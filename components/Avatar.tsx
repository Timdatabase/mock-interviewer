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
      className={`avatar-scene ai-presence ${state}`}
      role="img"
      aria-label={`Sam, interviewer ${state}`}
      style={{ "--audio-level": activity } as CSSProperties}
    >
      <div className="orb-orbit orbit-one" />
      <div className="orb-orbit orbit-two" />
      <div className="orb-aura" />
      <div className="orb-core">
        <div className="orb-light" />
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
