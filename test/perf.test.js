import { expect, test } from "vitest";

import { getRuntimeTuning } from "../src/lib/perf.js";

test("getRuntimeTuning returns the potato-safe timing profile", () => {
  expect(getRuntimeTuning()).toEqual({
    pointerCooldownMs: 56,
    pointerActiveWindowMs: 120,
    presentationCooldownMs: 280,
    layoutIntervalMs: 3400,
    layoutIdleResetMs: 240,
    flashIntervalMs: 7200,
    flashDurationMs: 280,
    minFrameIntervalMs: 60,
  });
});

test("getRuntimeTuning reuses one immutable profile object", () => {
  const tuning = getRuntimeTuning();

  expect(tuning).toBe(getRuntimeTuning());
  expect(Object.isFrozen(tuning)).toBe(true);
});
