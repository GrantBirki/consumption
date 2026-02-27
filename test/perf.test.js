import { expect, test } from "vitest";

import { getRuntimeTuning } from "../src/lib/perf.js";

test("getRuntimeTuning returns the potato-safe timing profile", () => {
  expect(getRuntimeTuning()).toEqual({
    pointerCooldownMs: 24,
    presentationCooldownMs: 180,
    layoutIntervalMs: 3400,
    layoutIdleResetMs: 260,
    flashIntervalMs: 7000,
    flashDurationMs: 300,
    minFrameIntervalMs: 32,
  });
});

test("getRuntimeTuning reuses one immutable profile object", () => {
  const tuning = getRuntimeTuning();

  expect(tuning).toBe(getRuntimeTuning());
  expect(Object.isFrozen(tuning)).toBe(true);
});
