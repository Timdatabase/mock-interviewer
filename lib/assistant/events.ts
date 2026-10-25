import type { AssistantEvent } from "./schema";
let sequence = 0;
// Called only by user-action and completed-request handlers, never during render.
export function assistantEventId() {
  return `partner-${Date.now()}-${sequence++}`;
}
export function createAssistantEvent(
  event: Omit<AssistantEvent, "id" | "timestamp">,
): AssistantEvent {
  return { ...event, id: assistantEventId(), timestamp: Date.now() };
}
