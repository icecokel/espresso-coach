export function buildNextShotHref(sessionId: string) {
  return {
    pathname: "/",
    params: { sessionId },
  } as const;
}
