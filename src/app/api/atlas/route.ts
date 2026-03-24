import OpenAI from "openai";
import { buildAtlasPrompt } from "@/lib/atlas/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { input } = await req.json();


    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use a valid model name, e.g., gpt-4o or gpt-3.5-turbo
      messages: [
        { role: "system", content: "You are Atlas, a fun AI concierge for Myrtle Beach." },
        { role: "user", content: buildAtlasPrompt(input) },
      ],
      response_format: { type: "json_object" },
    });

    const text = response.choices?.[0]?.message?.content || "{}";

    return new Response(text, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to generate" }), {
      status: 500,
    });
  }
}
