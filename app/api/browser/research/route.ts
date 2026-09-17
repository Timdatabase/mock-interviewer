import { z } from "zod";
import { researchCompanyQuestions } from "@/lib/browser/research";

const requestSchema = z.object({ company: z.string().min(1), sourceUrl: z.string().url().optional() });

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    return Response.json(await researchCompanyQuestions(input.company, input.sourceUrl));
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Invalid research request." }, { status: 400 });
    return Response.json({ error: "Company research failed." }, { status: 500 });
  }
}
