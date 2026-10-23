"use client";
import { VoiceConversation } from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { microphoneSupportError, microphoneStartupError } from "./microphone";
import type {
  VoiceProvider,
  TranscriptMessage,
  VoiceConnectionStatus,
} from "./types";

export function useElevenLabsProvider(): VoiceProvider {
  const session = useRef<VoiceConversation | null>(null);
  const generation = useRef(0);
  const pending = useRef(false);
  const messageId = useRef(0);
  const [status, setStatus] = useState<VoiceConnectionStatus>("disconnected");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string>();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasAudio, setHasAudio] = useState(false);
  const [levels, setLevels] = useState({ input: 0, output: 0 });

  useEffect(
    () => () => {
      generation.current++;
      const active = session.current;
      session.current = null;
      void active?.endSession().catch(() => {});
    },
    [],
  );
  useEffect(() => {
    if (status !== "connected") return;
    const timer = setInterval(() => {
      try {
        setLevels({
          input: session.current?.getInputVolume() ?? 0,
          output: session.current?.getOutputVolume() ?? 0,
        });
      } catch {
        /* The session may be closing. */
      }
    }, 200);
    return () => clearInterval(timer);
  }, [status]);

  const start = useCallback(async (prompt: string, firstMessage: string) => {
    if (pending.current || session.current)
      throw new Error("A voice session is already starting or connected.");
    const supportError = microphoneSupportError(
      window.isSecureContext,
      typeof navigator.mediaDevices?.getUserMedia === "function",
    );
    if (supportError) throw new Error(supportError);
    const attempt = ++generation.current;
    const current = () => generation.current === attempt;
    pending.current = true;
    setError(undefined);
    setStatus("connecting");
    setTranscript([]);
    setHasAudio(false);
    setIsSpeaking(false);
    setIsMuted(false);
    try {
      const response = await fetch("/api/voice/session", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Voice authorization failed.");
      // Use the client's real promise. This installed React hook's startSession
      // is fire-and-forget, so awaiting it cannot catch a rejected connection.
      const connected = await VoiceConversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: "websocket",
        textOnly: false,
        overrides: { agent: { prompt: { prompt }, firstMessage } },
        onStatusChange: ({ status }) => {
          if (current() && status === "connecting") setStatus("connecting");
        },
        onModeChange: ({ mode }) => {
          if (current()) setIsSpeaking(mode === "speaking");
        },
        onAudio: () => {
          if (current()) setHasAudio(true);
        },
        onMessage: (message) => {
          if (!current() || !message.message) return;
          setTranscript((previous) => [
            ...previous,
            {
              id: `message-${messageId.current++}`,
              role: message.source === "user" ? "user" : "agent",
              text: message.message,
              timestamp: Date.now(),
            },
          ]);
        },
        onError: (message) => {
          if (current()) setError(message || "Voice connection failed.");
        },
        onDisconnect: (details) => {
          if (!current()) return;
          session.current = null;
          setStatus("disconnected");
          setIsSpeaking(false);
          if (details.reason === "error")
            setError(
              "Sam disconnected unexpectedly. Check the agent settings and try reconnecting.",
            );
        },
      });
      if (!current()) {
        await connected.endSession();
        throw new Error("Voice startup was cancelled.");
      }
      session.current = connected;
      connected.setVolume({ volume: 1 });
      setVolume(1);
      setStatus("connected");
    } catch (failure) {
      const normalized = microphoneStartupError(failure);
      if (current()) {
        setError(normalized.message);
        setStatus("disconnected");
      }
      throw normalized;
    } finally {
      pending.current = false;
    }
  }, []);
  const end = useCallback(async () => {
    const active = session.current;
    generation.current++;
    session.current = null;
    try {
      await active?.endSession();
    } finally {
      setStatus("disconnected");
      setIsSpeaking(false);
      setIsMuted(false);
    }
  }, []);
  function activeSession() {
    if (!session.current)
      throw new Error("Connect Sam before sending a message.");
    return session.current;
  }
  return {
    status,
    isSpeaking,
    transcript,
    error,
    start,
    end,
    isMuted,
    volume,
    hasAudio,
    inputLevel: levels.input,
    outputLevel: levels.output,
    enableAudio: async () => {
      activeSession().setVolume({ volume: 1 });
      setVolume(1);
      const audio = [...document.querySelectorAll("audio")].filter(
        (element) => element.srcObject instanceof MediaStream,
      );
      if (!audio.length)
        throw new Error(
          "Audio output is not ready. Reconnect Sam and try again.",
        );
      await Promise.all(
        audio.map((element) => {
          element.muted = false;
          element.volume = 1;
          return element.play();
        }),
      );
    },
    setVolume: (value) => {
      const next = Math.max(0, Math.min(1, value));
      activeSession().setVolume({ volume: next });
      setVolume(next);
    },
    sendMessage: (text) => {
      activeSession().sendUserMessage(text);
      setTranscript((previous) => [
        ...previous,
        {
          id: `typed-${messageId.current++}`,
          role: "user",
          text,
          timestamp: Date.now(),
        },
      ]);
    },
    sendContext: (text) => activeSession().sendContextualUpdate(text),
    toggleMute: () => {
      const next = !isMuted;
      activeSession().setMicMuted(next);
      setIsMuted(next);
    },
  };
}
