// Pure helpers shared by the DOM and the 3D scene. No three.js imports: this file
// ships in the main bundle and runs under `node --test`.

export const SECTION_IDS = ["hero", "process", "automation", "stack", "work", "contact"];

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const clamp = (x, min, max) => Math.min(max, Math.max(min, x));

export function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Position along the route in "stations": 0 = hero … 5 = contact. Continuous:
// every section contributes the share of it already scrolled, so the ship is
// flying the whole time instead of parking at each section.
export function routePosition(section) {
  let r = 0;
  for (let i = 0; i < SECTION_IDS.length - 1; i++) r += clamp01(section[SECTION_IDS[i]] ?? 0);
  return r;
}

// Station pieces only render while the camera is close (in stations), so
// distant ones don't clutter the sky behind the current section.
export const nearStation = (r, id, range = 1) => Math.abs(r - SECTION_IDS.indexOf(id)) < range;

// ---------------------------------------------------------------- quality

export function pickTier({ webgl, reducedMotion, coarsePointer, cores, width }) {
  if (!webgl || reducedMotion) return "off";
  if (coarsePointer || cores <= 4 || width < 768) return "low";
  return "high";
}

// Below this many frames per second the 3D reads as stutter, not motion.
export const MIN_FPS = 24;

// Frame times in seconds from a sample window. The median, not the mean, so a
// few hitches (a tab switch, a GC pause) do not count: only a device that is
// slow on most frames falls back to the static page.
export function isTooSlow(deltas, minFps = MIN_FPS) {
  if (deltas.length === 0) return false;
  const sorted = [...deltas].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] > 1 / minFps;
}

// ---------------------------------------------------------------- random + sampling

// Small seeded PRNG so every visit builds the same scene.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- layouts

// One small constellation per stack group, laid out left to right.
// Returns star positions and the index pairs that draw each group's outline.
export function constellationLayout(groupSizes, rng) {
  const stars = [];
  const segments = [];
  groupSizes.forEach((size, g) => {
    const cx = (g - (groupSizes.length - 1) / 2) * 2.2;
    const cy = g % 2 === 0 ? -1 : 1.2;
    const first = stars.length;
    for (let s = 0; s < size; s++) {
      const a = rng() * Math.PI * 2;
      const r = 0.3 + rng() * 0.9;
      stars.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, z: (rng() - 0.5) * 1.2, group: g });
      if (s > 0) segments.push([first + s - 1, first + s]);
    }
  });
  return { stars, segments };
}

// A rock made of `count` surface points: a lumpy, flattened, slightly angular
// ellipsoid of radius ~1. Returns positions and outward normals (for shading).
export function rockShape(count, rng) {
  const squash = [0.75 + rng() * 0.45, 0.6 + rng() * 0.4, 0.75 + rng() * 0.45];
  const phase = Array.from({ length: 6 }, () => rng() * Math.PI * 2);
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // uniform direction on the sphere
    const y = rng() * 2 - 1;
    const a = rng() * Math.PI * 2;
    const ring = Math.sqrt(1 - y * y);
    const d = [Math.cos(a) * ring, y, Math.sin(a) * ring];
    // lumps at two scales, plus facets from the quantised third term
    const bump =
      0.16 * Math.sin(d[0] * 3.1 + phase[0]) * Math.sin(d[1] * 2.7 + phase[1]) +
      0.1 * Math.sin(d[2] * 5.3 + phase[2] + d[0] * 2) +
      (0.06 * Math.round(Math.sin(d[0] * 4 + d[1] * 3 + phase[3]) * 2)) / 2;
    const r = 1 + bump;
    position.set([d[0] * r * squash[0], d[1] * r * squash[1], d[2] * r * squash[2]], i * 3);
    const n = [d[0] / squash[0], d[1] / squash[1], d[2] / squash[2]];
    const len = Math.hypot(...n);
    normal.set([n[0] / len, n[1] / len, n[2] / len], i * 3);
  }
  return { position, normal };
}

// `count` unit vectors spread evenly over a sphere (Fibonacci lattice): no
// poles bunching, no randomness, so a particle planet has even coverage.
export function fibonacciSphere(count) {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}
