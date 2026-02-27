const LAYOUT_MODES = [
  { id: "scatter", label: "scatter atlas" },
  { id: "stack", label: "stack attack" },
  { id: "spill", label: "spill parade" },
  { id: "collapse", label: "collapse gala" },
];

const LETTER_MUTATIONS = {
  a: ["@", "4", "aa", "/-\\"],
  c: ["(", "[", "<", "cc"],
  e: ["3", "€", "ee"],
  i: ["!", "|", "ii"],
  m: ["nn", "/\\/\\", "mm"],
  n: ["//", "nn", "^/"],
  o: ["0", "()", "oo"],
  p: ["pp", "|*", "9"],
  s: ["$", "5", "ss"],
  t: ["+", "7", "tt"],
  u: ["uu", "\\_\\_", "v"],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hashGlyph(character, index, phase) {
  return (character.charCodeAt(0) * 17 + index * 29 + phase * 31) % 97;
}

export function getLayoutMode(index) {
  const normalized = ((index % LAYOUT_MODES.length) + LAYOUT_MODES.length) % LAYOUT_MODES.length;
  return {
    ...LAYOUT_MODES[normalized],
    index: normalized,
  };
}

export function corruptPhrase(text, intensity = 0, phase = 0) {
  const weight = clamp(intensity, 0, 1);

  return Array.from(text)
    .map((character, index) => {
      if (character === " ") {
        return weight > 0.55 && (index + phase) % 5 === 0 ? "  " : " ";
      }

      const lower = character.toLowerCase();
      const hash = hashGlyph(character, index, phase);
      const variants = LETTER_MUTATIONS[lower];
      const shouldMutate = variants && hash / 96 < weight * 0.82;

      if (shouldMutate) {
        const variant = variants[(phase + index + hash) % variants.length];
        return character === lower ? variant : variant.toUpperCase();
      }

      if (hash / 96 < weight * 0.42) {
        return character.toUpperCase();
      }

      if (hash / 96 < weight * 0.18) {
        return `${character}${character}`;
      }

      return character;
    })
    .join("");
}

export function buildWordmarkEchoes(wordmark, intensity, phase) {
  return [1, 2, 3].map((offset) =>
    corruptPhrase(wordmark, clamp(intensity + offset * 0.12, 0, 1), phase + offset * 3)
  );
}

export function buildScrollState(scrollY, viewportHeight, documentHeight) {
  const safeViewport = Math.max(viewportHeight, 1);
  const travel = Math.max(documentHeight - safeViewport, 1);
  const ratio = clamp(scrollY / travel, 0, 1);

  return {
    ratio,
    shift: (ratio - 0.5) * 120,
    torque: (ratio - 0.5) * 16,
    glare: 0.3 + ratio * 0.7,
    label: ratio > 0.66 ? "deep in the mess" : ratio > 0.33 ? "mid-spiral" : "freshly compromised",
  };
}

export function buildStatusReadouts(metrics) {
  const energy = Math.round(metrics.energy * 100);
  const scatter = Math.round(metrics.scatter);
  const wobble = Math.round(metrics.wobble * 10) / 10;
  const speed = Math.round(metrics.speed);
  const scroll = Math.round(metrics.scrollRatio * 100);
  const layout = getLayoutMode(metrics.phase).label;
  const flashState = metrics.flash ? "detonating" : "simmering";

  return [
    `retina load ${energy}% / pointer velocity ${speed}`,
    `layout sabotage ${layout} / flash state ${flashState}`,
    `scroll contamination ${scroll}% / scatter debt ${scatter}`,
    `wobble index ${wobble} / taste engine liability accepted`,
  ];
}

