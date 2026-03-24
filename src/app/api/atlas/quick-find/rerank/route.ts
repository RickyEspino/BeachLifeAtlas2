import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

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

function getCategoryPoolFromInput(input: string) {
  const text = input.toLowerCase();
  const base = ["food", "tacos", "dessert", "drinks", "activity"];

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

function scorePlace(
  place: Place,
  input: string,
  preferredCategory?: string | null
) {
  let score = 0;
  const text = input.toLowerCase();

  if (place.featured) score += 2;

  if (text.includes(place.category)) score += 2;

  if (preferredCategory && place.category === preferredCategory) {
    score += 7;
  }

  if (text.includes("coffee")) {
    if (
      place.name.toLowerCase().includes("coffee") ||
      place.description?.toLowerCase().includes("coffee")
    ) {
      score += 6;
    }
  }

  if (text.includes("taco") && place.category === "tacos") score += 6;
  if (
    (text.includes("dessert") ||
      text.includes("ice cream") ||
      text.includes("sweet")) &&
    place.category === "dessert"
  ) {
    score += 5;
  }
  if (
    (text.includes("drink") ||
      text.includes("bar") ||
      text.includes("cocktail") ||
      text.includes("rooftop")) &&
    place.category === "drinks"
  ) {
    score += 5;
  }
  if (
    (text.includes("activity") ||
      text.includes("arcade") ||
      text.includes("bowling") ||
      text.includes("aquarium")) &&
    place.category === "activity"
  ) {
    score += 5;
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

function buildQuickResults(places: RankedPlace[]) {
  return places.slice(0, 5).map((place, index) => ({
    id: `${place.id}-${index}`,
    place_id: place.id,
    name: place.name,
    category: place.category,
    description: place.description ?? "",
    lat: place.lat,
    lng: place.lng,
    points_reward: place.points_reward ?? 0,
    sort_order: index,
  }));
}

export async function POST(req: Request) {
  try {
    const {
      query,
      distance,
      anchorMode,
      selectedZone,
      userLat,
      userLng,
      preferredCategory,
      excludePlaceIds,
    } = await req.json();

    const supabase = createSupabaseServerClient();

    const safeQuery = typeof query === "string" ? query.trim() : "";
    const distanceValue = normalizeText(distance || "walkable");
    const anchorModeValue = normalizeText(anchorMode || "auto");
    const selectedZoneValue =
      typeof selectedZone === "string" && selectedZone.trim()
        ? normalizeText(selectedZone)
        : null;

    const preferredCategoryValue =
      typeof preferredCategory === "string" && preferredCategory.trim()
        ? normalizeText(preferredCategory)
        : null;

    const excludedIds = Array.isArray(excludePlaceIds)
      ? excludePlaceIds.filter((id): id is string => typeof id === "string")
      : [];

    const hasUserCoords =
      typeof userLat === "number" &&
      !Number.isNaN(userLat) &&
      typeof userLng === "number" &&
      !Number.isNaN(userLng);

    const categoryPool = getCategoryPoolFromInput(safeQuery);

    let queryBuilder = supabase
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
      .limit(80);

    if (anchorModeValue === "zone" && selectedZoneValue) {
      queryBuilder = queryBuilder.eq("zone", selectedZoneValue);
    }

    const { data: places, error } = await queryBuilder;

    if (error || !places?.length) {
      return Response.json({ error: "No usable places found" }, { status: 500 });
    }

    let rankedPlaces = (places as Place[])
      .filter((place) => !excludedIds.includes(place.id))
      .map((place) => ({
        ...place,
        atlas_score: scorePlace(place, safeQuery, preferredCategoryValue),
      }))
      .sort((a, b) => b.atlas_score - a.atlas_score);

    if (!rankedPlaces.length) {
      rankedPlaces = (places as Place[])
        .map((place) => ({
          ...place,
          atlas_score: scorePlace(place, safeQuery, preferredCategoryValue),
        }))
        .sort((a, b) => b.atlas_score - a.atlas_score);
    }

    let finalPlaces: RankedPlace[];

    if (anchorModeValue === "user-location" && hasUserCoords) {
      finalPlaces = applyDistanceFromPoint(
        rankedPlaces,
        distanceValue,
        userLat,
        userLng
      );
    } else {
      finalPlaces = applyAutoDistanceStrategy(rankedPlaces, distanceValue);
    }

    const results = buildQuickResults(finalPlaces);

    return Response.json({ results });
  } catch (error) {
    console.error("Quick re-rank error:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to rerank results",
      },
      { status: 500 }
    );
  }
}
