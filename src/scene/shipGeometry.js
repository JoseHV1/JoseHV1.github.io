import {
  Color, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Mesh, Shape,
  TorusGeometry, Vector2, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { mulberry32 } from "./math";

// Launch vehicle used only as a surface to scatter particles on. Modelled in
// Y-up units (nose toward +Y), then turned so the nose points at -Z, the
// direction of flight. ~8.5 units long.
export const NOZZLE_Z = 3.95; // where the exhaust starts, in the flight frame
export const NOZZLE_RING = 0.28; // radius of the three-engine cluster
const NOSE_Z = -4.6;

const AMBER = new Color("#FCD34D");
const WARM = new Color("#ffe9a8");
const BLUE = new Color("#4F8CFF");

const lathe = (points) => new LatheGeometry(points.map(([r, y]) => new Vector2(r, y)), 48);

// Von Karman nose cone: the smoothest ogive for a supersonic rocket.
function noseProfile(radius, baseY, length, steps = 18) {
  const points = [];
  for (let i = steps; i >= 0; i--) {
    const x = (length * i) / steps; // distance from the tip
    const theta = Math.acos(1 - (2 * x) / length);
    points.push([radius * Math.sqrt((theta - Math.sin(2 * theta) / 2) / Math.PI), baseY + length - x]);
  }
  return points;
}

function fin(angle) {
  const shape = new Shape();
  shape.moveTo(0.6, -1.4);
  shape.lineTo(1.55, -3.25);
  shape.lineTo(1.55, -3.55);
  shape.lineTo(0.6, -3.3);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false }).translate(0, 0, -0.035).rotateY(angle);
}

// `kind` decides the particle colour: "body" fades warm -> blue along the
// hull, "accent" stays amber (nose, bands), "fin" is blue.
export function buildHullParts() {
  const parts = [];
  const add = (name, geometry, kind) => parts.push({ name, geometry, kind });

  add("core", lathe([[0.01, -3.35], [0.7, -3.35], [0.74, -3.3], [0.74, -2.75], [0.62, -2.6], [0.62, 1.9]]), "body");
  add("nose", lathe(noseProfile(0.62, 1.9, 2.7)), "accent");
  for (const y of [-0.7, 0.55, 1.9]) {
    add(`band${y}`, new TorusGeometry(0.625, 0.03, 8, 48).rotateX(Math.PI / 2).translate(0, y, 0), "accent");
  }
  for (const side of [-1, 1]) {
    const x = side * 1.0;
    add(`booster${side}`, lathe([[0.01, -3.0], [0.2, -3.0], [0.27, -2.8], [0.27, 1.7]]).translate(x, 0, 0), "body");
    add(`booster-nose${side}`, lathe(noseProfile(0.27, 1.7, 1.1, 12)).translate(x, 0, 0), "accent");
  }
  for (let k = 0; k < 4; k++) add(`fin${k}`, fin(Math.PI / 4 + (k * Math.PI) / 2), "fin");
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 2 + (k * Math.PI * 2) / 3;
    add(
      `bell${k}`,
      new CylinderGeometry(0.13, 0.3, 0.6, 24, 1, true).translate(Math.cos(a) * NOZZLE_RING, -3.65, Math.sin(a) * NOZZLE_RING),
      "fin"
    );
  }
  // Y-up (nose +Y) -> flight frame (nose -Z): (x, y, z) -> (x, z, -y).
  for (const part of parts) part.geometry.rotateX(-Math.PI / 2);
  return parts;
}

// Particle skin of the whole hull: every point takes its part's colour, is
// shaded by a fixed key light so the cloud reads as a solid volume, and the
// body fades from warm at the nose to blue at the engines.
export function buildHullParticles(parts, count) {
  const rng = mulberry32(42);
  const geometries = parts.map((part) => {
    const geometry = part.geometry.clone().toNonIndexed();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    const kind = { body: 0, accent: 1, fin: 2 }[part.kind];
    geometry.setAttribute("color", new Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3).fill(kind), 3));
    return geometry;
  });
  const sampler = new MeshSurfaceSampler(new Mesh(mergeGeometries(geometries))).setRandomGenerator(rng).build();

  const position = new Float32Array(count * 3);
  const color = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const p = new Vector3();
  const n = new Vector3();
  const tag = new Color();
  const c = new Color();
  const key = new Vector3(-0.5, 0.7, 0.6).normalize();

  for (let i = 0; i < count; i++) {
    seed[i] = rng();
    sampler.sample(p, n, tag);
    const along = (p.z - NOSE_Z) / (NOZZLE_Z - NOSE_Z); // 0 at the nose, 1 at the engines
    if (tag.r < 0.5) c.copy(WARM).lerp(BLUE, along); // body
    else if (tag.r < 1.5) c.copy(AMBER); // accent
    else c.copy(BLUE); // fin
    c.multiplyScalar(0.55 + 0.9 * Math.max(0, n.dot(key)));
    p.addScaledVector(n, rng() < 0.08 ? 0.05 + rng() * 0.2 : 0.02);
    p.toArray(position, i * 3);
    c.toArray(color, i * 3);
  }
  return { position, color, seed };
}
