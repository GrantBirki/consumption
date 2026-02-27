const MOBILE_USER_AGENT_PATTERN = /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i;
const MOBILE_VIEWPORT_MAX = 900;

export function resolveStickyHeadLimit({
  userAgent = "",
  viewportWidth = 1024,
  hasCoarsePointer = false,
} = {}) {
  const mobileUserAgent = MOBILE_USER_AGENT_PATTERN.test(userAgent);
  const smallViewport = Number.isFinite(viewportWidth) && viewportWidth <= MOBILE_VIEWPORT_MAX;

  return mobileUserAgent || (hasCoarsePointer && smallViewport) ? 2 : 10;
}
