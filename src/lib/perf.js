const POTATO_PROFILE = Object.freeze({
  pointerCooldownMs: 24,
  presentationCooldownMs: 180,
  layoutIntervalMs: 3400,
  layoutIdleResetMs: 260,
  flashIntervalMs: 7000,
  flashDurationMs: 300,
  minFrameIntervalMs: 32,
});

export function getRuntimeTuning() {
  return POTATO_PROFILE;
}
