import Interviewer from "@/components/Interviewer";
import { configSchema } from "@/lib/interview/config";
import Link from "next/link";
export default async function InterviewPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const raw = Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === 'string'));
    const result = configSchema.safeParse({ ...raw, tags: typeof raw.tags === 'string' ? raw.tags.split(',').filter(Boolean) : [], avoidRecent: raw.avoidRecent !== 'false' });
    if (!result.success)
        return <main className="shell"><h1>Let’s reset your room.</h1><p>These interview settings aren’t valid.</p><Link href="/">Return to setup →</Link></main>;
    return <Interviewer config={result.data}/>;
}
