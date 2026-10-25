import {
  assistantRequestSchema,
  assistantReplySchema,
  replyFormat,
} from "./schema";
import { codingPartnerInstructions, buildAssistantInput } from "./prompt";
function failure(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 1000000) {
      await reader.cancel();
      throw new RangeError("Workspace request is too large.");
    }
    chunks.push(value);
  }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(data));
}
export async function handleAssistant(
  request: Request,
  options: { apiKey?: string; model?: string; fetcher?: typeof fetch },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return failure(
      "Cross-origin coding partner requests are not allowed.",
      403,
    );
  let parsed;
  try {
    parsed = assistantRequestSchema.safeParse(await readBody(request));
  } catch (error) {
    return failure(
      error instanceof RangeError
        ? "The workspace request exceeds 1 MB. Shorten the current context and retry."
        : "Send a valid coding partner request.",
      error instanceof RangeError ? 413 : 400,
    );
  }
  if (!parsed.success)
    return failure(
      "Invalid coding partner request. Check the task, language, prompt, and workspace limits.",
      400,
    );
  if (!options.apiKey?.trim())
    return failure(
      "The coding partner needs OPENAI_API_KEY in .env.local. Add it locally and restart the server. Never paste your key into the chat.",
      503,
    );
  const model = options.model?.trim() || "gpt-6-astra";
  try {
    const upstream = await (options.fetcher ?? fetch)(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(60000)]),
        body: JSON.stringify({
          model,
          instructions: codingPartnerInstructions,
          input: buildAssistantInput(parsed.data),
          text: { format: replyFormat },
          store: false,
          max_output_tokens: 5000,
        }),
      },
    );
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      if (upstream.status === 401)
        return failure(
          "OpenAI rejected the API key. Check OPENAI_API_KEY on the server.",
          502,
        );
      if (upstream.status === 404)
        return failure(
          "The configured OpenAI assistant model is unavailable to this project. Check OPENAI_ASSISTANT_MODEL and model access.",
          502,
        );
      if (upstream.status === 429)
        return failure(
          data?.error?.code === "insufficient_quota"
            ? "The OpenAI project has no available API quota. Check its billing and usage limits."
            : "The coding partner is rate limited. Wait a moment and retry.",
          429,
        );
      return failure(
        "OpenAI could not complete the coding partner request. Please retry.",
        502,
      );
    }
    const content = (Array.isArray(data?.output) ? data.output : [])
      .filter((item: { type?: string }) => item.type === "message")
      .flatMap((item: { content?: unknown[] }) => item.content ?? []);
    if (content.some((item: { type?: string }) => item.type === "refusal"))
      return failure(
        "The coding partner could not help with that request. Try a narrower software-development question.",
        422,
      );
    if (data?.status === "incomplete")
      return failure(
        "The coding partner response was incomplete. Ask for a smaller change and retry.",
        502,
      );
    const text = content
      .filter((item: { type?: string }) => item.type === "output_text")
      .map((item: { text?: string }) => item.text ?? "")
      .join("");
    let reply;
    try {
      reply = assistantReplySchema.safeParse(JSON.parse(text));
    } catch {
      return failure(
        "The coding partner returned an unreadable reply. Please retry.",
        502,
      );
    }
    if (!reply.success)
      return failure(
        "The coding partner reply did not match the expected format. Please retry.",
        502,
      );
    return Response.json(
      {
        reply: reply.data,
        model,
        usage: data?.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
            }
          : undefined,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      return failure(
        "The coding partner request timed out or was stopped. Try a smaller request.",
        504,
      );
    return failure(
      "Could not reach OpenAI from the server. Check the connection and retry.",
      502,
    );
  }
}
