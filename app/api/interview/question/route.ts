import { randomInt } from "node:crypto";
import { z } from "zod";
import { configSchema } from "@/lib/interview/config";
import { matchingQuestions, publicQuestion } from "@/lib/interview/questions";
const requestSchema = z.object({ config: configSchema, seen: z.array(z.string()).max(500).default([]), recent: z.array(z.string()).max(500).default([]) });
export async function POST(request: Request) {
    try {
        const parsed = requestSchema.safeParse(await request.json());
        if (!parsed.success)
            return Response.json({ error: "Invalid interview settings." }, { status: 400 });
        const { config, seen, recent } = parsed.data;
        const matches = matchingQuestions(config);
        const remaining = matches.filter(q => !seen.includes(q.id));
        const fresh = remaining.filter(q => !recent.includes(q.id));
        const pool = config.avoidRecent && fresh.length ? fresh : remaining;
        if (!pool.length)
            return Response.json({ error: matches.length ? "You have practiced every matching question in this session. Start a new session or change your filters." : "No questions match. Try fewer topics or another difficulty." }, { status: 404 });
        return Response.json({ question: publicQuestion(pool[randomInt(pool.length)]), total: matches.length, reusedRecent: config.avoidRecent && !fresh.length }, { headers: { "Cache-Control": "no-store" } });
    }
    catch {
        return Response.json({ error: "Unable to select a question." }, { status: 400 });
    }
}
