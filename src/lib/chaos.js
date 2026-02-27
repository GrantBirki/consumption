const MIN_ENERGY = 0.06;
const MIN_SCATTER = 8;

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
  const travel = Math.max(1, Math.hypot(dx, dy));
  const impulse = clamp(travel / 22, 0.08, 1);
  const hueJump = 9 + travel * 18 + Math.abs(pointer.x) * 140 + Math.abs(pointer.y) * 110;
  const scatterTarget = clamp(
    MIN_SCATTER + travel * 1.9 + (Math.abs(pointer.x) + Math.abs(pointer.y)) * 18,
    MIN_SCATTER,
    72
  );
  const tiltTargetX = clamp(pointer.y * -28 + dy * 0.45, -68, 68);
  const tiltTargetY = clamp(pointer.x * 28 + dx * 0.45, -68, 68);
  const wobbleTarget = clamp(4 + travel * 0.7 + Math.abs(pointer.x - pointer.y) * 10, 0, 36);

  return {
    ...state,
    pointerX: pointer.x,
    pointerY: pointer.y,
    hue: wrapHue(state.hue + hueJump * 0.65),
    targetHue: wrapHue(state.targetHue + hueJump),
    energy: clamp(state.energy + impulse * 0.35, 0, 1),
    targetEnergy: clamp(state.targetEnergy + impulse * 0.65, 0.18, 1),
    scatter: clamp(state.scatter + travel * 0.4, MIN_SCATTER, 72),
    targetScatter: scatterTarget,
    tiltX: clamp(state.tiltX + tiltTargetX * 0.25, -68, 68),
    targetTiltX: tiltTargetX,
    tiltY: clamp(state.tiltY + tiltTargetY * 0.25, -68, 68),
    targetTiltY: tiltTargetY,
    wobble: clamp(state.wobble + impulse * 8, 0, 36),
    targetWobble: wobbleTarget,
  };
}

export function tickChaos(state, dtSeconds) {
  const dt = clamp(dtSeconds, 0, 0.05);
  const mix = 1 - Math.exp(-dt * 7.5);
  const settle = 1 - Math.exp(-dt * 2.4);
  const targetEnergy = Math.max(MIN_ENERGY, state.targetEnergy - dt * 0.95);
  const targetScatter = Math.max(MIN_SCATTER, state.targetScatter - dt * 28);
  const targetTiltX = state.targetTiltX * (1 - settle);
  const targetTiltY = state.targetTiltY * (1 - settle);
  const targetWobble = Math.max(0, state.targetWobble - dt * 18);

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

