import OpenAI from "openai";
import { buildAtlasPrompt } from "@/lib/atlas/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    const response = await openai.responses.create({
      model: "gpt-5",
      input: buildAtlasPrompt(input),
    });

    const text = response.output[0]?.content[0]?.text || "{}";

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
