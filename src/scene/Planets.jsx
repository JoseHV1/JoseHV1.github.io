import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Color, NormalBlending, ShaderMaterial, Vector3 } from "three";
import { journey } from "./journey";
import { fibonacciSphere, mulberry32, routePosition, smoothstep } from "./math";
import { PLANETS } from "./planetData";
import { ROUTE, planetOffset, uAtZ } from "./route";
import { planetPointFragment } from "./shaders";
import { dotTexture } from "./textures";

// Palettes inside the site's amber / blue identity.
const KINDS = {
  gas: { a: "#9a4a08", b: "#FCD34D", c: "#fff1c2", bands: 14, rim: "#ffd978" },
  giant: { a: "#0d2260", b: "#3a6ee0", c: "#9ec1ff", bands: 11, rim: "#6fa0ff" },
};
const SUN = new Vector3(-0.8, 0.3, 0.55).normalize(); // light comes from the flight line's side
const RING = { inner: 1.35, outer: 1.75 }; // in planet radii
// Point size relative to the spacing between points. Below 1 on purpose: many
// small points with hairline gaps read as fine glitter, not as big dots.
const COVERAGE = 0.8;
const MAX_POINT_PX = 6; // hard cap at the closest flyby

// Planet surface points are sized from how many of them cover the visible
// hemisphere, so the globe looks solid at any distance or resolution.
const bodyVertex = /* glsl */ `
  uniform float uF;        // pixels per world unit at distance 1
  uniform float uSpacing;  // world distance between neighbouring points
  uniform float uReveal;
  uniform vec3 uSun;
  uniform float uSolid;    // 1 for the globe (hides its far side), 0 for the ring
  attribute vec3 aColor;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    vec3 normal = normalize(mat3(modelMatrix) * position);
    vec3 view = normalize(cameraPosition - world.xyz);
    float facing = dot(normal, view);
    float lit = clamp(dot(normal, uSun), 0.0, 1.0);
    float rim = pow(1.0 - clamp(facing, 0.0, 1.0), 2.5);
    float shade = mix(1.0, 0.16 + 0.84 * smoothstep(0.0, 0.6, lit), uSolid);
    vColor = aColor * shade + vec3(0.85, 0.92, 1.0) * rim * 0.3 * (0.3 + lit) * uSolid;
    float side = mix(1.0, mix(0.06, 1.0, smoothstep(-0.12, 0.2, facing)), uSolid);
    float dist = length(cameraPosition - world.xyz);
    vAlpha = side * smoothstep(260.0, 120.0, dist) * uReveal;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(${COVERAGE.toFixed(2)} * uSpacing * uF * (0.8 + 0.4 * fract(aSeed * 91.7)) / -mv.z, 1.0, ${MAX_POINT_PX.toFixed(1)});
  }
`;

const reveal = { value: 0 }; // shared: the sky stays planet-free until the journey starts

// A real ShaderMaterial instance (not JSX props): R3F would copy the uniforms
// and the per-frame writes below would never reach the material.
function bodyMaterial(spacing, solid, blending) {
  return new ShaderMaterial({
    vertexShader: bodyVertex,
    fragmentShader: planetPointFragment,
    uniforms: { uF: { value: 1000 }, uSpacing: { value: spacing }, uReveal: reveal, uSun: { value: SUN }, uSolid: { value: solid } },
    transparent: true,
    depthWrite: false,
    blending,
  });
}

// Latitude bands bent by a little noise, with lighter "cloud" patches.
function surfaceColors(unit, kind, rng) {
  const k = KINDS[kind];
  const count = unit.length / 3;
  const colors = new Float32Array(count * 3);
  const a = new Color(k.a);
  const b = new Color(k.b);
  const c = new Color(k.c);
  const mix = new Color();
  for (let i = 0; i < count; i++) {
    const x = unit[i * 3];
    const y = unit[i * 3 + 1];
    const z = unit[i * 3 + 2];
    const warp = Math.sin(x * 3.1 + z * 2.7) * 0.5 + Math.sin(y * 7.3 + x * 5.1) * 0.25;
    const bands = Math.sin((y + warp * 0.12) * k.bands) * 0.5 + 0.5;
    const patch = Math.sin(x * 9 + y * 4) * Math.sin(z * 8 - y * 6);
    mix.copy(a).lerp(b, bands).lerp(c, Math.max(0, patch - 0.45) * 0.9);
    mix.multiplyScalar(0.85 + rng() * 0.3).toArray(colors, i * 3);
  }
  return colors;
}

function buildPlanet(planet, bodyCount, ringCount, index) {
  const rng = mulberry32(100 + index);
  const unit = fibonacciSphere(bodyCount);
  const position = new Float32Array(unit.length);
  for (let i = 0; i < unit.length; i++) position[i] = unit[i] * planet.radius * (1 + (rng() - 0.5) * 0.008);
  const seed = new Float32Array(bodyCount).map(() => rng());
  const body = { position, color: surfaceColors(unit, planet.kind, rng), seed };

  let ring = null;
  if (planet.ring && ringCount > 0) {
    const k = KINDS[planet.kind];
    const pos = new Float32Array(ringCount * 3);
    const col = new Float32Array(ringCount * 3);
    const sd = new Float32Array(ringCount);
    const dark = new Color(k.a).multiplyScalar(1.3);
    const light = new Color(k.c);
    const c = new Color();
    for (let i = 0; i < ringCount; i++) {
      let t;
      let stripes;
      do {
        t = rng();
        stripes = 0.5 + 0.5 * Math.sin(t * 60 + Math.sin(t * 17) * 2);
      } while (rng() > 0.25 + 0.75 * stripes);
      const radius = planet.radius * (RING.inner + t * (RING.outer - RING.inner));
      const angle = rng() * Math.PI * 2;
      pos.set([Math.cos(angle) * radius, (rng() - 0.5) * planet.radius * 0.015, Math.sin(angle) * radius], i * 3);
      c.copy(dark).lerp(light, stripes).multiplyScalar(0.8 + rng() * 0.4).toArray(col, i * 3);
      sd[i] = rng();
    }
    ring = { position: pos, color: col, seed: sd };
  }
  // Spacing between points: the visible half of the globe holds half the points.
  const bodySpacing = planet.radius * Math.sqrt((4 * Math.PI) / bodyCount);
  const ringArea = Math.PI * (RING.outer ** 2 - RING.inner ** 2) * planet.radius ** 2;
  return { planet, u: uAtZ(planet.z), body, ring, bodySpacing, ringSpacing: Math.sqrt(ringArea / Math.max(1, ringCount)) };
}

// The two planets of the flight, made of the same glowing particles as the
// ship: a banded globe, a halo and, for the first one, a particle ring.
export default function Planets({ bodyPoints, ringPoints }) {
  const aspect = useThree((s) => s.viewport.aspect);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const groups = useRef([]);
  const spins = useRef([]);
  const offset = useMemo(() => new Vector3(), []);
  const halo = useMemo(dotTexture, []);
  const built = useMemo(() => PLANETS.map((planet, i) => buildPlanet(planet, bodyPoints, ringPoints, i)), [bodyPoints, ringPoints]);
  const materials = useMemo(
    () => built.map((b) => ({ body: bodyMaterial(b.bodySpacing, 1, NormalBlending), ring: bodyMaterial(b.ringSpacing, 0, AdditiveBlending) })),
    [built]
  );

  useFrame(({ camera, clock }) => {
    reveal.value = smoothstep(0.1, 0.6, routePosition(journey.section));
    const pixelsPerUnit = (size.height * gl.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    built.forEach(({ planet, u }, i) => {
      const group = groups.current[i];
      group.visible = reveal.value > 0.005;
      if (!group.visible) return;
      ROUTE.getPoint(u, group.position).add(planetOffset(planet, aspect, offset));
      group.scale.setScalar(aspect >= 1 ? 1 : 0.6);
      spins.current[i].rotation.y = clock.elapsedTime * 0.03;
      materials[i].body.uniforms.uF.value = pixelsPerUnit;
      materials[i].ring.uniforms.uF.value = pixelsPerUnit;
    });
  });

  return (
    <>
      {built.map(({ planet, body, ring }, i) => (
        <group key={planet.id} ref={(node) => { groups.current[i] = node; }}>
          <points renderOrder={1} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[new Float32Array(3), 3]} />
            </bufferGeometry>
            <pointsMaterial size={planet.radius * 5.4} map={halo} color={KINDS[planet.kind].rim} transparent opacity={0.22} depthWrite={false} blending={AdditiveBlending} />
          </points>
          <group ref={(node) => { spins.current[i] = node; }}>
            <points renderOrder={2}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[body.position, 3]} />
                <bufferAttribute attach="attributes-aColor" args={[body.color, 3]} />
                <bufferAttribute attach="attributes-aSeed" args={[body.seed, 1]} />
              </bufferGeometry>
              <primitive object={materials[i].body} attach="material" />
            </points>
          </group>
          {ring && (
            <points rotation={[0.38, 0, 0.28]} renderOrder={3}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[ring.position, 3]} />
                <bufferAttribute attach="attributes-aColor" args={[ring.color, 3]} />
                <bufferAttribute attach="attributes-aSeed" args={[ring.seed, 1]} />
              </bufferGeometry>
              <primitive object={materials[i].ring} attach="material" />
            </points>
          )}
        </group>
      ))}
    </>
  );
}
