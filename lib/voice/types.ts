export type VoiceConnectionStatus =
  "disconnected" | "connecting" | "connected" | "error";
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
  start: (prompt: string, firstMessage: string) => Promise<void>;
  sendMessage: (text: string) => void;
  sendContext: (text: string) => void;
  end: () => Promise<void>;
  toggleMute: () => void;
  isMuted: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  hasAudio: boolean;
  enableAudio: () => Promise<void>;
  inputLevel: number;
  outputLevel: number;
}
