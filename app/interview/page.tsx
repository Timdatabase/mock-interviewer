import { randomInt } from "node:crypto";
import { matchingQuestions, publicQuestion } from "@/lib/interview/questions";
import Interviewer from "@/components/Interviewer";
import { configSchema } from "@/lib/interview/config";
import Link from "next/link";
export default async function InterviewPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const raw = Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string'));
    const result = configSchema.safeParse({ ...raw, tags: typeof raw.tags === 'string' ? raw.tags.split(',').filter(Boolean) : [], avoidRecent: Array.isArray(params.avoidRecent) ? params.avoidRecent.includes('true') : params.avoidRecent !== 'false' });
    if (!result.success)
        return <main className="shell"><h1>Let’s reset your room.</h1><p>These interview settings aren’t valid.</p><Link href="/">Return to setup →</Link></main>;
    const seen = typeof params.seen === 'string' ? params.seen.split(',').filter(Boolean).slice(-500) : [];
    if (params.pick === '1') {
        const matches = matchingQuestions(result.data);
        const pool = matches.filter(q => !seen.includes(q.id));
        if (pool.length) {
            const question = publicQuestion(pool[randomInt(pool.length)]);
            return <Interviewer config={result.data} initialQuestion={question} initialTotal={matches.length} initialSeen={[...seen, question.id]} />;
        }
        return <Interviewer config={result.data} initialError={matches.length ? 'Every matching question has been practiced. Start a new session to repeat.' : 'No questions match. Return to setup and try fewer topics or another difficulty.'} initialSeen={seen} />;
    }
    return <Interviewer config={result.data}/>;
}
