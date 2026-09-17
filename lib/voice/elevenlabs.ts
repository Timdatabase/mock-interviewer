"use client";

import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { createElement, useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { VoiceProvider, TranscriptMessage } from "@/lib/voice/types";

export function ElevenLabsProvider({ children }: { children: ReactNode }) {
  return createElement(ConversationProvider, null, children);
}

export function useElevenLabsProvider(): VoiceProvider {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string>();
  const [isMuted, setIsMuted] = useState(false);
  const messageId = useRef(0);
  const conversation = useConversation({
    onMessage: (message) => {
      const text = message.message;
      if (!text) return;
      setTranscript((current) => [...current, { id: `message-${messageId.current++}`, role: message.source === "user" ? "user" : "agent", text, timestamp: Date.now() }]);
    },
    onError: (message) => setError(typeof message === "string" ? message : "Voice session failed."),
  });

  const start = useCallback(async () => {
    setError(undefined);
    setTranscript([]);
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    if (!agentId) throw new Error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID is not configured.");
    if (!agentId.startsWith("agent_")) throw new Error("NEXT_PUBLIC_ELEVENLABS_AGENT_ID must be the agent_ ID from ElevenLabs Conversational AI.");
    conversation.startSession({ agentId });
  }, [conversation]);

  const end = useCallback(async () => conversation.endSession(), [conversation]);

  return {
    status: conversation.status === "connected" ? "connected" : conversation.status === "connecting" ? "connecting" : "disconnected",
    isSpeaking: conversation.isSpeaking,
    transcript,
    error,
    start,
    end,
    toggleMute: () => {
      const nextMuted = !isMuted;
      conversation.setMuted(nextMuted);
      setIsMuted(nextMuted);
    },
    isMuted,
  };
}
