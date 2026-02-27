const MIN_ENERGY = 0.06;
const MIN_SCATTER = 8;
const SETTLED_EPSILON = 0.015;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

export function wrapHue(value) {
  return ((value % 360) + 360) % 360;
}

export function lerpAngle(start, end, amount) {
  const delta = ((((end - start) % 360) + 540) % 360) - 180;
  return wrapHue(start + delta * amount);
}

export function normalizePointer(point, bounds) {
  const width = Math.max(bounds?.width ?? 1, 1);
  const height = Math.max(bounds?.height ?? 1, 1);

  return {
    x: clamp((point.x / width) * 2 - 1, -1, 1),
    y: clamp((point.y / height) * 2 - 1, -1, 1),
  };
}

export function createChaosState() {
  return {
    hue: 24,
    targetHue: 24,
    energy: 0.14,
    targetEnergy: 0.14,
    scatter: 14,
    targetScatter: 14,
    tiltX: -4,
    targetTiltX: -4,
    tiltY: 6,
    targetTiltY: 6,
    wobble: 5,
    targetWobble: 5,
    pointerX: 0,
    pointerY: 0,
  };
}

export function applyPointerMove(state, event) {
  const pointer = normalizePointer(event.point, event.bounds);
  const dx = event.delta?.x ?? 0;
  const dy = event.delta?.y ?? 0;
  const travel = Math.hypot(dx, dy);
  const effectiveTravel = Math.max(0, travel - 1.5);
  const impulse = clamp(effectiveTravel / 28, 0.03, 0.85);
  const hueJump = 5 + effectiveTravel * 9 + Math.abs(pointer.x) * 92 + Math.abs(pointer.y) * 76;
  const scatterTarget = clamp(
    MIN_SCATTER + effectiveTravel * 1.1 + (Math.abs(pointer.x) + Math.abs(pointer.y)) * 12,
    MIN_SCATTER,
    54
  );
  const tiltTargetX = clamp(pointer.y * -22 + dy * 0.28, -56, 56);
  const tiltTargetY = clamp(pointer.x * 22 + dx * 0.28, -56, 56);
  const wobbleTarget = clamp(3 + effectiveTravel * 0.34 + Math.abs(pointer.x - pointer.y) * 8, 0, 24);

  return {
    ...state,
    pointerX: pointer.x,
    pointerY: pointer.y,
    hue: wrapHue(state.hue + hueJump * 0.4),
    targetHue: wrapHue(state.targetHue + hueJump),
    energy: clamp(state.energy + impulse * 0.24, 0, 1),
    targetEnergy: clamp(state.targetEnergy + impulse * 0.42, 0.14, 0.92),
    scatter: clamp(state.scatter + effectiveTravel * 0.18, MIN_SCATTER, 54),
    targetScatter: scatterTarget,
    tiltX: clamp(state.tiltX + tiltTargetX * 0.18, -56, 56),
    targetTiltX: tiltTargetX,
    tiltY: clamp(state.tiltY + tiltTargetY * 0.18, -56, 56),
    targetTiltY: tiltTargetY,
    wobble: clamp(state.wobble + impulse * 4.2, 0, 24),
    targetWobble: wobbleTarget,
  };
}

export function tickChaos(state, dtSeconds) {
  const dt = clamp(dtSeconds, 0, 0.05);
  const mix = 1 - Math.exp(-dt * 10);
  const settle = 1 - Math.exp(-dt * 4.5);
  const targetEnergy = Math.max(MIN_ENERGY, state.targetEnergy - dt * 1.7);
  const targetScatter = Math.max(MIN_SCATTER, state.targetScatter - dt * 42);
  const targetTiltX = state.targetTiltX * (1 - settle);
  const targetTiltY = state.targetTiltY * (1 - settle);
  const targetWobble = Math.max(0, state.targetWobble - dt * 28);

  return {
    ...state,
    targetEnergy,
    targetScatter,
    targetTiltX,
    targetTiltY,
    targetWobble,
    energy: lerp(state.energy, targetEnergy, mix),
    scatter: lerp(state.scatter, targetScatter, mix),
    tiltX: lerp(state.tiltX, targetTiltX, mix),
    tiltY: lerp(state.tiltY, targetTiltY, mix),
    wobble: lerp(state.wobble, targetWobble, mix),
    hue: lerpAngle(state.hue, state.targetHue, mix * 0.85),
  };
}

export function buildChaosVars(state) {
  const accentHue = wrapHue(state.hue + 124 + state.wobble * 3);
  const acidHue = wrapHue(state.hue + 246 - state.scatter * 1.6);

  return {
    "--chaos-hue": `${Math.round(state.hue)}deg`,
    "--chaos-accent": `${Math.round(accentHue)}deg`,
    "--chaos-acid": `${Math.round(acidHue)}deg`,
    "--chaos-energy": state.energy.toFixed(3),
    "--chaos-scatter": `${state.scatter.toFixed(2)}px`,
    "--chaos-tilt-x": `${state.tiltX.toFixed(2)}deg`,
    "--chaos-tilt-y": `${state.tiltY.toFixed(2)}deg`,
    "--chaos-wobble": `${state.wobble.toFixed(2)}deg`,
    "--pointer-x": `${((state.pointerX + 1) * 50).toFixed(2)}%`,
    "--pointer-y": `${((state.pointerY + 1) * 50).toFixed(2)}%`,
    "--pointer-drift-x": state.pointerX.toFixed(4),
    "--pointer-drift-y": state.pointerY.toFixed(4),
    "--chaos-blur": `${(state.energy * 2.8).toFixed(2)}px`,
    "--chaos-scale": (1 + state.energy * 0.18).toFixed(3),
    "--chaos-glare": (0.55 + state.energy * 0.65).toFixed(3),
    "--chaos-outline": `${(3 + state.energy * 10).toFixed(2)}px`,
  };
}

export function isChaosSettled(state) {
  return (
    Math.abs(state.energy - MIN_ENERGY) < SETTLED_EPSILON &&
    Math.abs(state.targetEnergy - MIN_ENERGY) < SETTLED_EPSILON &&
    Math.abs(state.scatter - MIN_SCATTER) < 0.4 &&
    Math.abs(state.targetScatter - MIN_SCATTER) < 0.4 &&
    Math.abs(state.tiltX) < 0.5 &&
    Math.abs(state.targetTiltX) < 0.5 &&
    Math.abs(state.tiltY) < 0.5 &&
    Math.abs(state.targetTiltY) < 0.5 &&
    Math.abs(state.wobble) < 0.4 &&
    Math.abs(state.targetWobble) < 0.4
  );
}
