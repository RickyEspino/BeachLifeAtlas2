import OpenAI from "openai";
import { supabase } from "@/lib/supabase/client";

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

export async function POST(req: Request) {
  try {
    const { input, vibe } = await req.json();

    const { data: places, error } = await supabase
      .from("places")
      .select("*")
      .eq("active", true)
      .limit(30);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to load places" }),
        { status: 500 }
      );
    }

    const prompt = buildAtlasPrompt(
      vibe ? `${input}\nPreferred vibe: ${vibe}` : input,
      places ?? []
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Atlas, a fun AI concierge for Myrtle Beach." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content || "{}";

    return new Response(text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to generate experience" }),
      { status: 500 }
    );
  }
}
