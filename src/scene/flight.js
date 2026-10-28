// Flight director: pure functions that turn the ship's place on the route and
// the scroll speed into the cinematic bits (banking, swerving, camera glance,
// field of view, speed streaks). No three.js, so it runs under `node --test`.
import { clamp, clamp01, smoothstep } from "./math.js";

// 1 at the closest approach, easing to 0 `width` away.
export function bell(distance, width) {
  const t = 1 - clamp01(Math.abs(distance) / width);
  return t * t * (3 - 2 * t);
}

// What passing planets do at world position `z`. Planets pass above or below
// the flight line (inside the right-hand column of the screen), so the ship
// ducks away from them (`dip`), rolls a little away from their side (`bank`),
// nudges sideways (`swerve`) and the camera glances up or down at them (`look`).
// Positive bank = banking left (top of the ship leans toward -x).
export function flybys(z, planets) {
  let bank = 0;
  let swerve = 0;
  let dip = 0;
  let look = 0;
  let yaw = 0;
  for (const planet of planets) {
    const w = bell(z - planet.z, planet.reach);
    const side = Math.sign(planet.dx);
    const above = Math.sign(planet.dy);
    bank += side * w * 0.35;
    swerve -= side * w * 0.5;
    dip -= above * w * 1.2;
    look += above * w * 0.8;
    yaw += side * w * 0.4;
  }
  return {
    bank: clamp(bank, -0.5, 0.5),
    swerve: clamp(swerve, -0.8, 0.8),
    dip: clamp(dip, -1.5, 1.5),
    look: clamp(look, -1, 1),
    // radians the camera swings round the ship, toward the side away from the
    // planet: the viewpoint shifts and the planet slides past behind the ship
    yaw: clamp(yaw, -0.45, 0.45),
  };
}

// Which way the ship faces: 1 = forward (scrolling down), -1 = flying back
// (scrolling up). Rockets have no reverse gear, so instead of backing up the
// ship turns around. Jitter below `threshold` (world units per second) keeps
// the current heading.
export const HEADING_THRESHOLD = 2;
export function nextHeading(current, velocity, threshold = HEADING_THRESHOLD) {
  if (velocity > threshold) return 1;
  if (velocity < -threshold) return -1;
  return current;
}

// `speed` is the camera's world speed normalised to 0..1.
export const SPEED_REFERENCE = 60; // world units per second that count as "full speed"
export const normalizeSpeed = (unitsPerSecond) => clamp01(unitsPerSecond / SPEED_REFERENCE);

// Hero launch pose: nose up and to the right. World space, nose first.
export const ASCENT_HEADING = [1, 0.68, 0.3];

// How much the hero's launch pose and the contact portrait take over (0..1).
export const heroWeightAt = (r) => 1 - smoothstep(0, 0.35, r);
export const morphAt = (contact) => smoothstep(0.1, 0.7, contact);

// Return trip. Scrolling up, the ship and the camera half-loop together over
// the top (pitch up, 180 degrees about the world X axis), so the ship keeps
// flying nose first, seen from behind, and the stars keep streaming toward the
// reader: it reads as heading home, never as reversing. A rotation about X
// keeps world +x on the right of the screen, so planets stay clear of the
// text. Never at the hero or the portrait, which face the reader upright.
export const loopGoal = (heading, heroWeight, morph) => (heading < 0 ? (1 - heroWeight) * (1 - morph) : 0);
export const LOOP_RATE = 1.6; // per second; the half-loop takes about 1.5 s

// How fast the flight *feels*, 0..1: the real scroll speed, but never below a
// steady cruise between the launch (hero) and the landing (contact). Engines,
// speed lines and lens all follow this, so the ship looks fast the whole way.
export const CRUISE_FLOW = 0.6;
export function cruiseFlow(speed, r) {
  const cruising = CRUISE_FLOW * smoothstep(0.03, 0.4, r) * (1 - smoothstep(4.5, 4.95, r));
  return Math.max(clamp01(speed), cruising);
}

export const fovFor = (flow) => 45 + 7 * clamp01(flow);
export const streakAlpha = (flow) => 0.28 * smoothstep(0.1, 0.8, flow);
export const streakLength = (flow) => 0.8 + 3.4 * clamp01(flow);
// World units per second the speed lines slide past the ship.
export const streakRate = (flow) => 14 + 80 * clamp01(flow);
export const plumeLength = (flow) => 2 + 3.2 * clamp01(flow);

// Lift-off burst, 0..1, `t` seconds after ignition: a fast attack, then a
// slow fade over ~3 s. Drives the forward lurch and the extra flame.
export function ignition(t) {
  if (!(t >= 0)) return 0;
  if (t < 0.25) return t / 0.25;
  return Math.exp(-(t - 0.25) * 1.1);
}
