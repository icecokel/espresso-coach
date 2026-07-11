export type FontLoadState = "ready" | "loading" | "error";

export function getFontLoadState(
  fontsLoaded: boolean,
  fontError: Error | null,
): FontLoadState {
  if (fontsLoaded) {
    return "ready";
  }

  return fontError ? "error" : "loading";
}
