import { expect, test } from "vitest";

import {
  buildScrollState,
  buildStatusReadouts,
  buildWordmarkEchoes,
  corruptPhrase,
  getLayoutMode,
} from "../src/lib/badness.js";

test("getLayoutMode cycles through deterministic sabotage modes", () => {
  expect(getLayoutMode(0)).toMatchObject({ id: "scatter", index: 0 });
  expect(getLayoutMode(4)).toMatchObject({ id: "scatter", index: 0 });
  expect(getLayoutMode(5)).toMatchObject({ id: "stack", index: 1 });
});

test("corruptPhrase preserves spaces while mutating glyphs at higher intensity", () => {
  const clean = "c o n s u m p t i o n";
  const corrupted = corruptPhrase(clean, 0.85, 3);

  expect(corrupted.length).toBeGreaterThanOrEqual(clean.length);
  expect(corrupted.replace(/[^ ]/g, "").length).toBeGreaterThan(0);
  expect(corrupted).not.toBe(clean);
});

test("buildWordmarkEchoes returns multiple corrupted variants", () => {
  const echoes = buildWordmarkEchoes("c o n s u m p t i o n", 0.6, 2);

  expect(echoes).toHaveLength(3);
  expect(new Set(echoes).size).toBeGreaterThan(1);
});

test("buildScrollState normalizes scroll ratios and sabotage values", () => {
  const state = buildScrollState(300, 200, 1000);

  expect(state.ratio).toBeCloseTo(0.375);
  expect(state.shift).not.toBe(0);
  expect(state.label).toBe("mid-spiral");
});

test("buildStatusReadouts formats the fake diagnostics", () => {
  const readouts = buildStatusReadouts({
    energy: 0.42,
    scatter: 18.5,
    wobble: 6.2,
    speed: 88.4,
    flash: true,
    scrollRatio: 0.5,
    phase: 2,
  });

  expect(readouts).toHaveLength(4);
  expect(readouts[0]).toContain("retina load 42%");
  expect(readouts[1]).toContain("flash state detonating");
  expect(readouts[2]).toContain("scroll contamination 50%");
});
