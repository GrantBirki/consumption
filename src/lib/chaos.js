const MIN_ENERGY = 0.06;
const MIN_SCATTER = 8;
const SETTLED_EPSILON = 0.015;
const DEFAULT_STATE = Object.freeze({
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
});

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function readState(state, key) {
  return toFiniteNumber(state?.[key], DEFAULT_STATE[key]);
}

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
  const width = Math.max(toFiniteNumber(bounds?.width, 1), 1);
  const height = Math.max(toFiniteNumber(bounds?.height, 1), 1);
  const x = toFiniteNumber(point?.x, 0);
  const y = toFiniteNumber(point?.y, 0);

  return {
    x: clamp((x / width) * 2 - 1, -1, 1),
    y: clamp((y / height) * 2 - 1, -1, 1),
  };
}

export function createChaosState() {
  return { ...DEFAULT_STATE };
}

export function applyPointerMove(state, event) {
  const pointer = normalizePointer(event?.point, event?.bounds);
  const dx = toFiniteNumber(event?.delta?.x, 0);
  const dy = toFiniteNumber(event?.delta?.y, 0);
  const currentHue = readState(state, "hue");
  const currentTargetHue = readState(state, "targetHue");
  const currentEnergy = readState(state, "energy");
  const currentTargetEnergy = readState(state, "targetEnergy");
  const currentScatter = readState(state, "scatter");
  const currentTiltX = readState(state, "tiltX");
  const currentTiltY = readState(state, "tiltY");
  const currentWobble = readState(state, "wobble");
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
    hue: wrapHue(currentHue + hueJump * 0.4),
    targetHue: wrapHue(currentTargetHue + hueJump),
    energy: clamp(currentEnergy + impulse * 0.24, 0, 1),
    targetEnergy: clamp(currentTargetEnergy + impulse * 0.42, 0.14, 0.92),
    scatter: clamp(currentScatter + effectiveTravel * 0.18, MIN_SCATTER, 54),
    targetScatter: scatterTarget,
    tiltX: clamp(currentTiltX + tiltTargetX * 0.18, -56, 56),
    targetTiltX: tiltTargetX,
    tiltY: clamp(currentTiltY + tiltTargetY * 0.18, -56, 56),
    targetTiltY: tiltTargetY,
    wobble: clamp(currentWobble + impulse * 4.2, 0, 24),
    targetWobble: wobbleTarget,
  };
}

export function tickChaos(state, dtSeconds) {
  const currentTargetEnergy = readState(state, "targetEnergy");
  const currentTargetScatter = readState(state, "targetScatter");
  const currentTargetTiltX = readState(state, "targetTiltX");
  const currentTargetTiltY = readState(state, "targetTiltY");
  const currentTargetWobble = readState(state, "targetWobble");
  const currentEnergy = readState(state, "energy");
  const currentScatter = readState(state, "scatter");
  const currentTiltX = readState(state, "tiltX");
  const currentTiltY = readState(state, "tiltY");
  const currentWobble = readState(state, "wobble");
  const currentHue = readState(state, "hue");
  const currentTargetHue = readState(state, "targetHue");
  const dt = clamp(toFiniteNumber(dtSeconds, 0), 0, 0.05);
  const mix = 1 - Math.exp(-dt * 10);
  const settle = 1 - Math.exp(-dt * 4.5);
  const targetEnergy = Math.max(MIN_ENERGY, currentTargetEnergy - dt * 1.7);
  const targetScatter = Math.max(MIN_SCATTER, currentTargetScatter - dt * 42);
  const targetTiltX = currentTargetTiltX * (1 - settle);
  const targetTiltY = currentTargetTiltY * (1 - settle);
  const targetWobble = Math.max(0, currentTargetWobble - dt * 28);

  return {
    ...state,
    targetEnergy,
    targetScatter,
    targetTiltX,
    targetTiltY,
    targetWobble,
    energy: lerp(currentEnergy, targetEnergy, mix),
    scatter: lerp(currentScatter, targetScatter, mix),
    tiltX: lerp(currentTiltX, targetTiltX, mix),
    tiltY: lerp(currentTiltY, targetTiltY, mix),
    wobble: lerp(currentWobble, targetWobble, mix),
    hue: lerpAngle(currentHue, currentTargetHue, mix * 0.85),
  };
}

export function buildChaosVars(state) {
  const hue = wrapHue(readState(state, "hue"));
  const energy = clamp(readState(state, "energy"), 0, 1);
  const scatter = clamp(readState(state, "scatter"), MIN_SCATTER, 54);
  const tiltX = clamp(readState(state, "tiltX"), -56, 56);
  const tiltY = clamp(readState(state, "tiltY"), -56, 56);
  const wobble = clamp(readState(state, "wobble"), 0, 24);
  const pointerX = clamp(readState(state, "pointerX"), -1, 1);
  const pointerY = clamp(readState(state, "pointerY"), -1, 1);
  const accentHue = wrapHue(hue + 124 + wobble * 3);
  const acidHue = wrapHue(hue + 246 - scatter * 1.6);

  return {
    "--chaos-hue": `${Math.round(hue)}deg`,
    "--chaos-accent": `${Math.round(accentHue)}deg`,
    "--chaos-acid": `${Math.round(acidHue)}deg`,
    "--chaos-energy": energy.toFixed(3),
    "--chaos-scatter": `${scatter.toFixed(2)}px`,
    "--chaos-tilt-x": `${tiltX.toFixed(2)}deg`,
    "--chaos-tilt-y": `${tiltY.toFixed(2)}deg`,
    "--chaos-wobble": `${wobble.toFixed(2)}deg`,
    "--pointer-x": `${((pointerX + 1) * 50).toFixed(2)}%`,
    "--pointer-y": `${((pointerY + 1) * 50).toFixed(2)}%`,
    "--pointer-drift-x": pointerX.toFixed(4),
    "--pointer-drift-y": pointerY.toFixed(4),
    "--chaos-blur": `${(energy * 2.8).toFixed(2)}px`,
    "--chaos-scale": (1 + energy * 0.18).toFixed(3),
    "--chaos-glare": (0.55 + energy * 0.65).toFixed(3),
    "--chaos-outline": `${(3 + energy * 10).toFixed(2)}px`,
  };
}

export function isChaosSettled(state) {
  const energy = readState(state, "energy");
  const targetEnergy = readState(state, "targetEnergy");
  const scatter = readState(state, "scatter");
  const targetScatter = readState(state, "targetScatter");
  const tiltX = readState(state, "tiltX");
  const targetTiltX = readState(state, "targetTiltX");
  const tiltY = readState(state, "tiltY");
  const targetTiltY = readState(state, "targetTiltY");
  const wobble = readState(state, "wobble");
  const targetWobble = readState(state, "targetWobble");

  return (
    Math.abs(energy - MIN_ENERGY) < SETTLED_EPSILON &&
    Math.abs(targetEnergy - MIN_ENERGY) < SETTLED_EPSILON &&
    Math.abs(scatter - MIN_SCATTER) < 0.4 &&
    Math.abs(targetScatter - MIN_SCATTER) < 0.4 &&
    Math.abs(tiltX) < 0.5 &&
    Math.abs(targetTiltX) < 0.5 &&
    Math.abs(tiltY) < 0.5 &&
    Math.abs(targetTiltY) < 0.5 &&
    Math.abs(wobble) < 0.4 &&
    Math.abs(targetWobble) < 0.4
  );
}
