export async function POST() {
    const key = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!key || !agentId)
        return Response.json({ error: "Voice needs ELEVENLABS_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID. You can still practice without voice." }, { status: 503 });
    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, { headers: { "xi-api-key": key }, cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!response.ok)
            throw new Error();
        const data = await response.json();
        return Response.json({ signedUrl: data.signed_url }, { headers: { "Cache-Control": "no-store" } });
    }
    catch {
        return Response.json({ error: "Could not authorize voice. Check the ElevenLabs agent and API key." }, { status: 502 });
    }
}
