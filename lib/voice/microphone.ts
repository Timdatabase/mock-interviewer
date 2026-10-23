export function microphoneSupportError(
  secureContext: boolean,
  hasGetUserMedia: boolean,
): string | undefined {
  if (!secureContext) {
    return "Microphone access requires HTTPS or localhost. On the computer running the app, open http://localhost:3000 instead of its network IP address. From another device, use an HTTPS deployment.";
  }
  if (!hasGetUserMedia) {
    return "This browser does not expose microphone access. Open the app directly in a current Chrome, Edge, Firefox, or Safari browser, and check microphone permissions.";
  }
}

export function microphoneStartupError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return new Error(
        "Microphone access was blocked. Allow microphone access in your browser’s site settings, check system microphone permissions, then retry.",
      );
    }
    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return new Error(
        "No microphone was found. Connect or enable a microphone, then retry.",
      );
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return new Error(
        "The microphone could not be opened. Check whether another app is using it and verify system microphone permissions.",
      );
    }
    return error;
  }
  return new Error("Unable to start the voice interview. Please try again.");
}
