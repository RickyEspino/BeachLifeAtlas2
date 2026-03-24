import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveTrip } from "@/lib/atlas/save-trip";
import type { AtlasExperience } from "@/types/atlas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function getCategoryPool(vibe: string) {
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

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

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

function scorePlace(place: Place, vibe: string, input: string) {
  let score = 0;
  const vibeTags = place.vibe_tags ?? [];
  const inputText = input.toLowerCase();

  if (place.featured) score += 2;
  if (vibeTags.includes(vibe)) score += 3;
  if (inputText.includes(place.category)) score += 2;
  if (inputText.includes("taco") && place.category === "tacos") score += 5;
  if (inputText.includes("dessert") && place.category === "dessert") score += 5;
  if (inputText.includes("drink") && place.category === "drinks") score += 5;
  if (inputText.includes("activity") && place.category === "activity") score += 5;
  if (inputText.includes("food") && place.category === "food") score += 4;

  if (vibe === "family" && place.family_friendly) score += 3;
  if (vibe === "romantic" && place.couple_friendly) score += 3;
  if ((vibe === "fun" || vibe === "nightlife") && place.friends_friendly) score += 3;

  return score;
}

function buildAtlasPrompt(input: string, vibe: string, places: unknown[]) {
  return `
You are Atlas, the BeachLife AI concierge for Myrtle Beach.

Your job is to build one fun, coherent BeachLife Experience using ONLY the provided places.

GOAL:
Create a 3 to 5 stop itinerary that feels intentional, geographically sensible, and fun.

HARD RULES:
- Use ONLY places from the provided dataset.
- Do NOT invent places.
- Do NOT return fewer than 3 nodes.
- Keep all selected places in the same zone whenever possible.
- Prefer experiences that feel walkable or short-hop logical.
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
    const { input, vibe } = await req.json();
    const supabase = createSupabaseServerClient();

    const vibeValue = normalizeText(vibe || "fun");
    const categoryPool = getCategoryPool(vibeValue);

    const { data: places, error: placesError } = await supabase
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
      .limit(40);

    if (placesError) {
      return Response.json(
        { error: "Failed to load places" },
        { status: 500 }
      );
    }

    // Score and rank places
    const rankedPlaces = (places ?? [])
      .map((place) => ({
        ...place,
        atlas_score: scorePlace(place, vibeValue, input || ""),
      }))
      .sort((a, b) => b.atlas_score - a.atlas_score)
      .slice(0, 20);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Atlas, a fun AI concierge for Myrtle Beach." },
        { role: "user", content: buildAtlasPrompt(input, vibeValue, rankedPlaces) },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content || "{}";
    const experience = parseExperience(text);
    const tripId = await saveTrip({
      experience,
      userInput: input,
      vibe,
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
