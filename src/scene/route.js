import { CatmullRomCurve3, Vector3 } from "three";
import { SECTION_IDS, smoothstep } from "./math.js";

// One station per section. The distance between stations follows the typical
// scroll window of the section that ends there (hero half a screen, work ~3),
// so the camera covers roughly the same distance per scrolled pixel everywhere.
export const STATIONS = [
  new Vector3(0, 0, 0), // hero
  new Vector3(6, 1, -12), // process
  new Vector3(-8, -2, -41), // automation
  new Vector3(4, 3, -107), // stack
  new Vector3(-4, 0, -139), // work
  new Vector3(0, 0, -233), // contact
];
export const SEGMENT_LENGTH = [12, 29, 66, 32, 94];

export const ROUTE = new CatmullRomCurve3(STATIONS, false, "catmullrom", 0.5);

// Route parameter (0..1) of a section's station. getPoint() splits the curve
// evenly between control points, so station i sits exactly at i / (n - 1).
export const stationU = (id) => SECTION_IDS.indexOf(id) / (SECTION_IDS.length - 1);

// World z of a route parameter (stations are monotonic in z).
export const zAt = (u) => ROUTE.getPoint(u).z;

// Inverse of zAt: the route parameter at world z (z falls as u grows).
export function uAtZ(z) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (ROUTE.getPoint(mid).z > z) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Route parameter `distance` world units ahead of `u`, using the local speed.
export function aheadU(u, distance) {
  const segment = Math.min(SEGMENT_LENGTH.length - 1, Math.floor(u * 5));
  return Math.min(1, u + distance / SEGMENT_LENGTH[segment] / 5);
}

// How far in front of the camera's focus the ship flies, in world units:
// none at the very start and end, ~10 in between.
export const shipLead = (r) => 10 * smoothstep(0.1, 0.5, r) * (1 - smoothstep(4.4, 4.95, r));

// The camera sits behind and slightly above the route point it looks at.
export const CAMERA_OFFSET = new Vector3(0, 0.6, 14);

// On wide screens the text takes the left ~65% of the viewport and the 3D
// lives in the right-hand column. Instead of pushing every object sideways
// (which drags passing planets across the text), the camera's lens is shifted:
// the flight line itself is drawn at ~81% of the screen width. NDC units.
export const frameShift = (aspect) => (aspect >= 1 ? 0.62 : 0);

// Where each station's 3D piece sits relative to its route point: centred on
// the (shifted) flight line on wide screens, above the text on narrow ones.
const STAGE_WIDE = { hero: [-1.7, 0.1, 4], stack: [1.4, 0.6, 0], contact: [0, 0, 0] };
const STAGE_NARROW_Y = { hero: 3.8, stack: 1.6, contact: 2.4 };

export function stageOffset(id, aspect, target = new Vector3()) {
  return aspect >= 1 ? target.fromArray(STAGE_WIDE[id]) : target.set(0, STAGE_NARROW_Y[id], 0);
}

export const stageScale = (aspect) => (aspect >= 1 ? 1 : 0.42);

// While cruising the ship flies on the flight line (wide screens: already in
// the right-hand column thanks to the lens shift; narrow: above the text).
export function cruiseOffset(aspect, target = new Vector3()) {
  return aspect >= 1 ? target.set(1.6, 0.2, 0) : target.set(0, 3, 0);
}

// Planet position relative to the route: above or below the flight line on
// wide screens; up and to the right on narrow ones, where the text is full width.
export function planetOffset(planet, aspect, target = new Vector3()) {
  return aspect >= 1
    ? target.set(planet.dx, planet.dy, 0)
    : target.set(4.4, 3.6 + planet.radius * 0.5, 0);
}
