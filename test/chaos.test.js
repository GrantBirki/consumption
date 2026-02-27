import { expect, test } from "vitest";

import {
  applyPointerMove,
  buildChaosVars,
  createChaosState,
  normalizePointer,
  tickChaos,
  wrapHue,
} from "../src/lib/chaos.js";

test("normalizePointer clamps points into the viewport range", () => {
  expect(normalizePointer({ x: 50, y: 25 }, { width: 100, height: 50 })).toEqual({
    x: 0,
    y: 0,
  });

  expect(normalizePointer({ x: -10, y: 80 }, { width: 100, height: 50 })).toEqual({
    x: -1,
    y: 1,
  });
});

test("applyPointerMove scrambles the state even for a single pixel delta", () => {
  const state = createChaosState();

  const next = applyPointerMove(state, {
    point: { x: 201, y: 150 },
    delta: { x: 1, y: 0 },
    bounds: { width: 400, height: 300 },
  });

  expect(next.hue).not.toBe(state.hue);
  expect(next.targetHue).not.toBe(state.targetHue);
  expect(next.energy).toBeGreaterThan(state.energy);
  expect(next.scatter).toBeGreaterThanOrEqual(state.scatter);
});

test("tickChaos settles the energy and motion toward calmer values", () => {
  let state = createChaosState();
  state = applyPointerMove(state, {
    point: { x: 380, y: 20 },
    delta: { x: 70, y: -50 },
    bounds: { width: 400, height: 300 },
  });

  const energized = state;

  for (let index = 0; index < 120; index += 1) {
    state = tickChaos(state, 1 / 60);
  }

  expect(state.energy).toBeLessThan(energized.energy);
  expect(state.scatter).toBeLessThan(energized.scatter);
  expect(state.wobble).toBeLessThan(energized.wobble);
  expect(Math.abs(state.tiltX)).toBeLessThan(Math.abs(energized.tiltX));
});

test("buildChaosVars returns CSS custom properties without NaN values", () => {
  const vars = buildChaosVars(
    applyPointerMove(createChaosState(), {
      point: { x: 240, y: 160 },
      delta: { x: 12, y: 6 },
      bounds: { width: 400, height: 300 },
    })
  );

  expect(vars["--chaos-hue"]).toMatch(/deg$/);
  expect(vars["--chaos-accent"]).toMatch(/deg$/);
  expect(vars["--chaos-scatter"]).toMatch(/px$/);
  expect(vars["--pointer-x"]).toMatch(/%$/);
  expect(vars["--pointer-y"]).toMatch(/%$/);

  for (const value of Object.values(vars)) {
    expect(value.includes("NaN")).toBe(false);
  }
});

test("wrapHue keeps angles inside the CSS hue circle", () => {
  expect(wrapHue(370)).toBe(10);
  expect(wrapHue(-30)).toBe(330);
});
