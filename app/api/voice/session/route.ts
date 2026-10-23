function failure(error: string, status = 502) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.trim();
  if (!key || !agentId) {
    return failure(
      "Voice needs ELEVENLABS_API_KEY and NEXT_PUBLIC_ELEVENLABS_AGENT_ID in .env.local. You can still practice without voice.",
      503,
    );
  }
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { "xi-api-key": key },
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      // Provider response text may contain account data. Map known failures to
      // actionable messages without returning raw errors or credentials.
      const code = data?.detail?.status;
      if (code === "missing_permissions") {
        return failure(
          "Your ElevenLabs API key is valid but lacks the required convai_write permission. In ElevenLabs API key settings, enable Agents write access (convai_write) for this key, then retry.",
        );
      }
      if (code === "api_key_id_used_as_api_key") {
        return failure(
          "ELEVENLABS_API_KEY contains a key ID instead of the secret API key. Put the actual sk_ secret in .env.local, then retry.",
        );
      }
      if (response.status === 401) {
        return failure(
          "ElevenLabs rejected the API key. Update ELEVENLABS_API_KEY in .env.local with a valid secret key, then retry.",
        );
      }
      if (response.status === 403) {
        return failure(
          "This ElevenLabs key cannot access the configured agent. Check the key permissions and that the agent belongs to the same workspace.",
        );
      }
      if (response.status === 404) {
        return failure(
          "The ElevenLabs agent was not found. Check NEXT_PUBLIC_ELEVENLABS_AGENT_ID and the workspace associated with your API key.",
        );
      }
      if (response.status === 429) {
        return failure(
          "ElevenLabs is rate limiting voice authorization. Wait a moment and retry.",
          429,
        );
      }
      return failure(
        `ElevenLabs rejected voice authorization (HTTP ${response.status}). Check the agent configuration and account access.`,
      );
    }
    if (
      typeof data?.signed_url !== "string" ||
      !data.signed_url.startsWith("wss://")
    ) {
      return failure(
        "ElevenLabs returned an invalid voice session URL. Please retry.",
      );
    }
    return Response.json(
      { signedUrl: data.signed_url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return failure(
        "ElevenLabs voice authorization timed out. Check your connection and retry.",
        504,
      );
    }
    return failure(
      "Could not reach ElevenLabs. Check the server’s network connection and retry.",
    );
  }
}
