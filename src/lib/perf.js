const POTATO_PROFILE = Object.freeze({
  pointerCooldownMs: 56,
  pointerActiveWindowMs: 120,
  presentationCooldownMs: 280,
  layoutIntervalMs: 3400,
  layoutIdleResetMs: 240,
  flashIntervalMs: 7200,
  flashDurationMs: 280,
  minFrameIntervalMs: 60,
});

export function getRuntimeTuning() {
  return POTATO_PROFILE;
}
