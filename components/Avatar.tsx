import type { CSSProperties } from "react";

export default function Avatar({
  state,
  level = 0,
}: {
  state: "idle" | "speaking" | "listening" | "connecting";
  level?: number;
}) {
  const activity = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0));
  return (
    <div
      className={`avatar-scene ai-presence sam-android ${state}`}
      role="img"
      aria-label={`Sam, digital interviewer ${state}`}
      style={{ "--audio-level": activity } as CSSProperties}
    >
      <div className="orb-orbit orbit-one" />
      <div className="orb-orbit orbit-two" />
      <div className="orb-aura" />
      <div className="android-head" aria-hidden="true">
        <div className="android-ear android-ear-left" />
        <div className="android-ear android-ear-right" />
        <div className="android-shell">
          <div className="android-forehead">
            <i />
            <i />
            <i />
          </div>
          <div className="android-visor">
            <div className="android-eye android-eye-left" />
            <div className="android-eye android-eye-right" />
          </div>
          <div className="android-nose" />
          <div className="android-cheek android-cheek-left" />
          <div className="android-cheek android-cheek-right" />
          <div className="android-mouth">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="android-chin" />
        </div>
      </div>
      <div className="orb-wave" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => (
          <i
            key={index}
            style={
              {
                "--bar-weight": 0.35 + (1 - Math.abs(7 - index) / 8) * 0.65,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <span className="avatar-badge">
        <i />
        {state === "speaking"
          ? "Speaking"
          : state === "listening"
            ? "Listening"
            : state === "connecting"
              ? "Connecting"
              : "Ready when you are"}
      </span>
    </div>
  );
}
