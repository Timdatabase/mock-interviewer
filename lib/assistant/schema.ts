import { z } from "zod";
export const assistantRequestSchema = z.object({
  mode: z.literal("ai-assisted"),
  task: z.object({
    id: z.string().max(150),
    title: z.string().max(200),
    question: z.string().min(1).max(50000),
  }),
  language: z.enum(["javascript", "typescript", "python"]),
  code: z.string().max(100000),
  notes: z.string().max(12000).default(""),
  latestRun: z.string().max(15000).default("Not run yet"),
  prompt: z.string().trim().min(1).max(6000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(6000),
      }),
    )
    .max(8)
    .default([]),
});
export const assistantReplySchema = z.object({
  message: z.string().min(1).max(30000),
  proposedCode: z.string().max(100000).nullable(),
  checks: z.array(z.string().max(2000)).max(12),
  assumptions: z.array(z.string().max(2000)).max(12),
});
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantReply = z.infer<typeof assistantReplySchema>;
export interface AssistantEvent {
  id: string;
  questionId: string;
  language: AssistantRequest["language"];
  kind: "prompt" | "reply" | "applied" | "undone";
  text: string;
  timestamp: number;
  code?: string;
}
export const replyFormat = {
  type: "json_schema",
  name: "coding_partner_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      message: { type: "string" },
      proposedCode: { type: ["string", "null"] },
      checks: { type: "array", items: { type: "string" } },
      assumptions: { type: "array", items: { type: "string" } },
    },
    required: ["message", "proposedCode", "checks", "assumptions"],
  },
};
