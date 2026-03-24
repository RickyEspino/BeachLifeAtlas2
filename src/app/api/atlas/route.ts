import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveTrip } from "@/lib/atlas/save-trip";
import { saveQuickSearch } from "@/lib/atlas/save-quick-search";
import type { AtlasExperience, AtlasNode } from "@/types/atlas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Place = {
  id: string;
  name: string;
  slug: string | null;
  zone: string;
  category: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  vibe_tags: string[] | null;
  group_tags: string[] | null;
  price_band: string | null;
  indoor: boolean | null;
  outdoor: boolean | null;
  rainy_day_friendly: boolean | null;
  family_friendly: boolean | null;
  couple_friendly: boolean | null;
  friends_friendly: boolean | null;
  featured: boolean | null;
  points_reward: number | null;
};

type RankedPlace = Place & {
  atlas_score: number;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const earthRadiusMiles = 3958.8;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * c;
}

function getDistanceRadiusMiles(distance: string) {
  switch (distance) {
    case "walkable":
      return 1.2;
    case "short-drive":
      return 6;
    case "anywhere":
    default:
      return null;
  }
}

function getCategoryPool(vibe: string, mode: string) {
  if (mode === "quick-find") {
    return ["food", "tacos", "dessert", "drinks", "activity"];
  }

  switch (vibe) {
    case "foodie":
      return ["food", "tacos", "dessert", "drinks"];
    case "nightlife":
      return ["drinks", "tacos", "activity"];
    case "family":
      return ["food", "dessert", "activity"];
    case "romantic":
      return ["food", "dessert", "drinks"];
    case "chill":
      return ["food", "dessert", "drinks"];
    case "fun":
    default:
      return ["food", "tacos", "drinks", "activity"];
  }
}

function getCategoryPoolFromInput(vibe: string, input: string, mode: string) {
  const base = getCategoryPool(vibe, mode);
  const text = input.toLowerCase();

  if (text.includes("coffee")) {
    return Array.from(new Set(["food", "dessert", ...base]));
  }

  if (text.includes("taco")) {
    return Array.from(new Set(["tacos", "drinks", "dessert", ...base]));
  }

  if (
    text.includes("dessert") ||
    text.includes("ice cream") ||
    text.includes("sweet")
  ) {
    return Array.from(new Set(["dessert", "food", ...base]));
  }

  if (
    text.includes("drink") ||
    text.includes("bar") ||
    text.includes("cocktail") ||
    text.includes("rooftop")
  ) {
    return Array.from(new Set(["drinks", "food", ...base]));
  }

  if (
    text.includes("arcade") ||
    text.includes("bowling") ||
    text.includes("aquarium") ||
    text.includes("golf") ||
    text.includes("go-kart")
  ) {
    return Array.from(new Set(["activity", ...base]));
  }

  return base;
}

function scorePlace(place: Place, vibe: string, input: string) {
  let score = 0;
  const vibeTags = place.vibe_tags ?? [];
  const inputText = input.toLowerCase();

  if (place.featured) score += 2;
  if (vibeTags.includes(vibe)) score += 3;
  if (inputText.includes(place.category)) score += 2;

  if (inputText.includes("taco") && place.category === "tacos") score += 5;
  if (
    (inputText.includes("dessert") ||
      inputText.includes("ice cream") ||
      inputText.includes("sweet")) &&
    place.category === "dessert"
  ) {
    score += 5;
  }
  if (
    (inputText.includes("drink") ||
      inputText.includes("bar") ||
      inputText.includes("cocktail") ||
      inputText.includes("rooftop")) &&
    place.category === "drinks"
  ) {
    score += 5;
  }
  if (
    (inputText.includes("activity") ||
      inputText.includes("arcade") ||
      inputText.includes("bowling") ||
      inputText.includes("aquarium")) &&
    place.category === "activity"
  ) {
    score += 5;
  }
  if (inputText.includes("food") && place.category === "food") score += 4;

  if (vibe === "family" && place.family_friendly) score += 3;
  if (vibe === "romantic" && place.couple_friendly) score += 3;
  if ((vibe === "fun" || vibe === "nightlife") && place.friends_friendly) {
    score += 3;
  }

  return score;
}

function applyDistanceFromPoint(
  rankedPlaces: RankedPlace[],
  distance: string,
  anchorLat: number,
  anchorLng: number
): RankedPlace[] {
  const radiusMiles = getDistanceRadiusMiles(distance);

  if (radiusMiles == null) {
    return rankedPlaces.slice(0, 24);
  }

  const filtered = rankedPlaces
    .map((place) => {
      const distanceFromAnchor = haversineMiles(
        anchorLat,
        anchorLng,
        place.lat,
        place.lng
      );

      return {
        ...place,
        distance_from_anchor: distanceFromAnchor,
        cluster_score:
          place.atlas_score -
          distanceFromAnchor * (distance === "walkable" ? 2.5 : 1.2),
      };
    })
    .filter((place) => place.distance_from_anchor <= radiusMiles)
    .sort((a, b) => b.cluster_score - a.cluster_score);

  if (filtered.length < 3) {
    return rankedPlaces.slice(0, distance === "walkable" ? 12 : 18);
  }

  return filtered.slice(0, distance === "walkable" ? 12 : 18);
}

function applyAutoDistanceStrategy(
  rankedPlaces: RankedPlace[],
  distance: string
): RankedPlace[] {
  if (!rankedPlaces.length) return [];

  const radiusMiles = getDistanceRadiusMiles(distance);

  if (radiusMiles == null) {
    return rankedPlaces.slice(0, 24);
  }

  const candidateAnchors = rankedPlaces.slice(0, Math.min(6, rankedPlaces.length));

  let bestCluster: RankedPlace[] = [];
  let bestClusterScore = -Infinity;

  for (const anchor of candidateAnchors) {
    const cluster = rankedPlaces
      .map((place) => {
        const distanceFromAnchor = haversineMiles(
          anchor.lat,
          anchor.lng,
          place.lat,
          place.lng
        );

        return {
          ...place,
          distance_from_anchor: distanceFromAnchor,
          cluster_score:
            place.atlas_score -
            distanceFromAnchor * (distance === "walkable" ? 2.5 : 1.2),
        };
      })
      .filter((place) => place.distance_from_anchor <= radiusMiles)
      .sort((a, b) => b.cluster_score - a.cluster_score);

    const clusterScore = cluster.reduce(
      (sum, place) => sum + place.cluster_score,
      0
    );

    if (
      cluster.length > bestCluster.length ||
      (cluster.length === bestCluster.length && clusterScore > bestClusterScore)
    ) {
      bestCluster = cluster;
      bestClusterScore = clusterScore;
    }
  }

  if (bestCluster.length < 3) {
    return rankedPlaces.slice(0, distance === "walkable" ? 12 : 18);
  }

  return bestCluster.slice(0, distance === "walkable" ? 12 : 18);
}

function buildQuickFindResults(places: RankedPlace[]): AtlasNode[] {
  return places.slice(0, 5).map((place) => ({
    id: place.id,
    place_id: place.id,
    name: place.name,
    role: "PICK",
    description: place.description ?? "",
    lat: place.lat,
    lng: place.lng,
    points_reward: place.points_reward ?? 0,
    category: place.category,
  }));
}

function buildFallbackExperience(places: Place[]): AtlasExperience {
  const nodes = places.slice(0, 5).map((place, i) => ({
    id: place.id,
    place_id: place.id,
    name: place.name,
    role: ["START", "BUILD", "HIGHLIGHT", "SWEET STOP", "FINALE"][i] || "BUILD",
    category: place.category,
    lat: place.lat,
    lng: place.lng,
    description: place.description || "",
    points_reward: place.points_reward || 0,
    zone: place.zone,
  }));

  const edges = nodes.slice(0, -1).map((node, idx) => ({
    from: node.id,
    to: nodes[idx + 1].id,
    mode: "walk",
  }));

  return {
    title: nodes.length
      ? `BeachLife Experience: ${nodes[0].name}`
      : "BeachLife Experience",
    zone: nodes[0]?.zone || "",
    summary: "Fallback experience due to AI error.",
    nodes,
    edges,
  };
}

function buildAtlasPrompt(
  input: string,
  vibe: string,
  distance: string,
  anchorMode: string,
  selectedZone: string | null,
  places: unknown[]
) {
  return `
You are Atlas, the BeachLife AI concierge for Myrtle Beach.

Your job is to build one fun, coherent BeachLife Experience using ONLY the provided places.

GOAL:
Create a 3 to 5 stop itinerary that feels intentional, geographically sensible, and fun.

HARD RULES:
- Use ONLY places from the provided dataset.
- Do NOT invent places.
- Do NOT return fewer than 3 nodes.
- Respect the user's distance preference.
- If distance is "walkable", keep the route tightly clustered and realistically walkable.
- If distance is "short-drive", keep the route compact and avoid long jumps across the area.
- If distance is "anywhere", you may use the broader set.
- Prefer nearby stops when multiple good options exist.
- If anchor mode is "zone", strongly respect the selected zone.
- Avoid duplicate categories back-to-back unless necessary.
- Make the itinerary feel natural: food first, activity in the middle, dessert or drinks near the end.
- If the user asks for something specific like tacos, strongly prefer matching places.
- If not enough perfect matches exist, build the best possible experience from the provided places while still returning at least 3 nodes.

EXPERIENCE SHAPE:
Prefer this flow when possible:
START → BUILD → HIGHLIGHT → SWEET STOP → FINALE

ROLE GUIDANCE:
- START: easy entry point, usually food or tacos
- BUILD: momentum builder, often activity or second food/drink stop
- HIGHLIGHT: main event or strongest stop
- SWEET STOP: dessert if available
- FINALE: drinks, scenic close, or final fun stop

USER REQUEST:
${input}

SELECTED VIBE:
${vibe}

DISTANCE PREFERENCE:
${distance}

ANCHOR MODE:
${anchorMode}

SELECTED ZONE:
${selectedZone ?? "none"}

AVAILABLE PLACES:
${JSON.stringify(places, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "zone": "string",
  "summary": "string",
  "nodes": [
    {
      "id": "string",
      "place_id": "string",
      "name": "string",
      "role": "START | BUILD | HIGHLIGHT | SWEET STOP | FINALE",
      "category": "string",
      "lat": 0,
      "lng": 0,
      "description": "string",
      "points_reward": 0
    }
  ],
  "edges": [
    {
      "from": "string",
      "to": "string",
      "mode": "walk"
    }
  ]
}
`;
}

function parseExperience(raw: string): AtlasExperience {
  const parsed = JSON.parse(raw) as AtlasExperience;

  if (!parsed?.title || !parsed?.zone || !Array.isArray(parsed?.nodes)) {
    throw new Error("Invalid AI response shape");
  }

  if (parsed.nodes.length < 3) {
    throw new Error("Experience must include at least 3 nodes");
  }

  return parsed;
}

export async function POST(req: Request) {
  try {
    const {
      mode,
      input,
      vibe,
      distance,
      anchorMode,
      selectedZone,
      userLat,
      userLng,
    } = await req.json();

    const supabase = createSupabaseServerClient();

    const modeValue =
      normalizeText(mode || "full-experience") === "quick-find"
        ? "quick-find"
        : "full-experience";

    const safeInput = typeof input === "string" ? input.trim() : "";
    const vibeValue = normalizeText(vibe || "fun");
    const distanceValue = normalizeText(distance || "walkable");
    const anchorModeValue = normalizeText(anchorMode || "auto");
    const selectedZoneValue =
      typeof selectedZone === "string" && selectedZone.trim()
        ? normalizeText(selectedZone)
        : null;

    const hasUserCoords =
      typeof userLat === "number" &&
      !Number.isNaN(userLat) &&
      typeof userLng === "number" &&
      !Number.isNaN(userLng);

    const categoryPool = getCategoryPoolFromInput(vibeValue, safeInput, modeValue);

    let query = supabase
      .from("places")
      .select(`
        id,
        name,
        slug,
        zone,
        category,
        description,
        address,
        lat,
        lng,
        vibe_tags,
        group_tags,
        price_band,
        indoor,
        outdoor,
        rainy_day_friendly,
        family_friendly,
        couple_friendly,
        friends_friendly,
        featured,
        points_reward
      `)
      .eq("active", true)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .in("category", categoryPool)
      .limit(60);

    if (anchorModeValue === "zone" && selectedZoneValue) {
      query = query.eq("zone", selectedZoneValue);
    }

    const { data: places, error: placesError } = await query;

    if (placesError || !places?.length) {
      return Response.json({ error: "No usable places found" }, { status: 500 });
    }

    const rankedPlaces = (places as Place[])
      .map((place) => ({
        ...place,
        atlas_score: scorePlace(place, vibeValue, safeInput),
      }))
      .sort((a, b) => b.atlas_score - a.atlas_score);

    let finalPlaces: RankedPlace[];

    if (anchorModeValue === "zone" && selectedZoneValue) {
      finalPlaces = applyAutoDistanceStrategy(rankedPlaces, distanceValue);
    } else if (anchorModeValue === "user-location" && hasUserCoords) {
      finalPlaces = applyDistanceFromPoint(
        rankedPlaces,
        distanceValue,
        userLat,
        userLng
      );
    } else {
      finalPlaces = applyAutoDistanceStrategy(rankedPlaces, distanceValue);
    }

    if (modeValue === "quick-find") {
      const results = buildQuickFindResults(finalPlaces);
      const searchId = await saveQuickSearch({
        query: safeInput,
        vibe: vibeValue,
        distance: distanceValue,
        anchorMode: anchorModeValue,
        selectedZone: selectedZoneValue,
        userLat: hasUserCoords ? userLat : null,
        userLng: hasUserCoords ? userLng : null,
        results,
      });

      return Response.json({ searchId });
    }


    let experience: AtlasExperience;

    try {
      // Only send compactPlaces (top 12, compact fields) to the model
      const compactPlaces = finalPlaces.slice(0, 12).map((place) => ({
        id: place.id,
        name: place.name,
        zone: place.zone,
        category: place.category,
        lat: place.lat,
        lng: place.lng,
        description: (place.description ?? "").slice(0, 120),
        points_reward: place.points_reward ?? 0,
      }));

      const response = await openai.responses.create({
        model: "gpt-5-mini",
        input: buildAtlasPrompt(
          safeInput,
          vibeValue,
          distanceValue,
          anchorModeValue,
          selectedZoneValue,
          compactPlaces
        ),
      });

      const text =
        response.output_text ||
        (Array.isArray(response.output) &&
        response.output.length > 0 &&
        typeof response.output[0] === "object" &&
        response.output[0] &&
        "content" in response.output[0] &&
        Array.isArray(response.output[0].content) &&
        response.output[0].content.length > 0 &&
        typeof response.output[0].content[0] === "object" &&
        response.output[0].content[0] &&
        "text" in response.output[0].content[0]
          ? response.output[0].content[0].text
          : "{}");

      try {
        experience = parseExperience(text || "{}");
      } catch {
        experience = buildFallbackExperience(finalPlaces);
      }
    } catch {
      experience = buildFallbackExperience(finalPlaces);
    }

    const tripId = await saveTrip({
      experience,
      userInput: safeInput,
      vibe: vibeValue,
      distance: distanceValue,
      anchorMode: anchorModeValue,
      selectedZone: selectedZoneValue,
      userLat: hasUserCoords ? userLat : null,
      userLng: hasUserCoords ? userLng : null,
    });

    return Response.json({ tripId });
  } catch (error) {
    console.error("Atlas route error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate experience",
      },
      { status: 500 }
    );
  }
}