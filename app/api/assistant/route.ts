import { handleAssistant } from "@/lib/assistant/service";
export async function POST(request: Request) {
  return handleAssistant(request, {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_ASSISTANT_MODEL,
  });
}
export async function GET() {
  return Response.json(
    {
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      model: process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-6-astra",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
