"use client";

/** Pointer capture keeps resizing reliable when the cursor leaves the handle. */
export default function PaneDivider({
  orientation,
  label,
  value,
  min,
  max,
  onDrag,
  onStep,
}: {
  orientation: "vertical" | "horizontal";
  label: string;
  value: number;
  min: number;
  max: number;
  onDrag: (x: number, y: number) => void;
  onStep: (direction: number) => void;
}) {
  return (
    <div
      className={`pane-divider ${orientation}`}
      role="separator"
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      tabIndex={0}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          onDrag(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onKeyDown={(event) => {
        const previous = orientation === "vertical" ? "ArrowLeft" : "ArrowUp";
        const next = orientation === "vertical" ? "ArrowRight" : "ArrowDown";
        if (event.key === previous || event.key === next) {
          event.preventDefault();
          onStep(event.key === previous ? -1 : 1);
        }
      }}
    >
      <span />
    </div>
  );
}
