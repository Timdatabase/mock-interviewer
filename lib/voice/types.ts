export type VoiceConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
export type TranscriptRole = "user" | "agent";

export interface TranscriptMessage {
  id: string;
  role: TranscriptRole;
  text: string;
  timestamp: number;
}

export interface VoiceProvider {
  status: VoiceConnectionStatus;
  isSpeaking: boolean;
  transcript: TranscriptMessage[];
  error?: string;
  start: () => Promise<void>;
  end: () => Promise<void>;
  toggleMute: () => void;
  isMuted: boolean;
}
