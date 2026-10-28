import { pickTier } from "./math";

export const QUALITY = {
  high: { stars: 6000, hullParticles: 28000, plume: 2600, streaks: 150, nebula: 350, planetPoints: 60000, ringPoints: 22000, bloom: true, post: true, maxDpr: 1.75 },
  low: { stars: 2500, hullParticles: 10000, plume: 1000, streaks: 60, nebula: 180, planetPoints: 24000, ringPoints: 9000, bloom: false, post: false, maxDpr: 1 },
};

function hasWebGL2() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

// Master switch for the 3D scene. Off on every device: the page is static.
// Set to true to bring the scene back (the code stays in place).
export const SCENE_ENABLED = true;

export function detectTier() {
  // QA override: ?tier=high|low|off forces a tier (e.g. to review the 3D scene).
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "off" || Object.hasOwn(QUALITY, forced)) return forced;
  if (!SCENE_ENABLED) return "off";
  return pickTier({
    webgl: hasWebGL2(),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    cores: navigator.hardwareConcurrency ?? 4,
    width: window.innerWidth,
  });
}
