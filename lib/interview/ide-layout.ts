export function clampPartnerWidth(width: number, workspaceWidth: number) {
  const maximum = Math.max(
    260,
    Math.min(520, Math.floor(workspaceWidth * 0.42)),
  );
  return Math.round(Math.max(260, Math.min(maximum, width)));
}
