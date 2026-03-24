import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveTrip } from "@/lib/atlas/save-trip";
import type { AtlasExperience } from "@/types/atlas";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function buildAtlasPrompt(input: string, places: unknown[]) {
  return `
You are Atlas, the BeachLife AI concierge for Myrtle Beach.

Your job is to build a fun BeachLife Experience using ONLY the places provided below.

Rules:
- Use 3 to 5 places
- Keep them in the same zone
- Follow this flow when possible:
  START → BUILD → HIGHLIGHT → SWEET STOP → FINALE
- Do not invent places
- Return only valid JSON

Places:
${JSON.stringify(places, null, 2)}

Return JSON in this format:
{
  "title": "string",
  "zone": "string",
  "nodes": [
    {
      "id": "string",
      "place_id": "string",
      "name": "string",
      "role": "START | BUILD | HIGHLIGHT | SWEET STOP | FINALE",
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

User request:
${input}
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

    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("*")
      .eq("active", true)
      .limit(30);

    if (placesError) {
      return Response.json(
        { error: "Failed to load places" },
        { status: 500 }
      );
    }

    const promptInput = vibe
      ? `${input}\nPreferred vibe: ${vibe}`
      : input;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Atlas, a fun AI concierge for Myrtle Beach." },
        { role: "user", content: buildAtlasPrompt(promptInput, places ?? []) },
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
