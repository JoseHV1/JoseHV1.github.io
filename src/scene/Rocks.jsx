import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, NormalBlending, ShaderMaterial, Vector3 } from "three";
import { STACK_GROUPS } from "../data/content";
import { journey } from "./journey";
import { constellationLayout, mulberry32, rockShape, routePosition, SECTION_IDS, smoothstep } from "./math";
import { ROUTE, stageOffset, stageScale } from "./route";
import { planetPointFragment } from "./shaders";

const STACK_MID = SECTION_IDS.indexOf("stack") + 0.5; // route position halfway through the stack section
const ROCK_POINTS = 260;
const COVERAGE = 0.9;
const MAX_POINT_PX = 4.5;
const SUN = new Vector3(-0.8, 0.3, 0.55).normalize(); // same light as the planets
const PALETTES = [
  { dark: "#5a300a", light: "#FCD34D" }, // amber
  { dark: "#14307f", light: "#8fb8ff" }, // blue
];

const vertex = /* glsl */ `
  uniform float uF;       // pixels per world unit at distance 1
  uniform float uSpacing; // world distance between neighbouring points
  uniform float uFade;
  uniform vec3 uSun;
  attribute vec3 aColor;
  attribute vec3 aNormal;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    vec3 normal = normalize(mat3(modelMatrix) * aNormal);
    vec3 view = normalize(cameraPosition - world.xyz);
    float lit = clamp(dot(normal, uSun), 0.0, 1.0);
    float facing = dot(normal, view);
    // lit side bright, shadow side dark, a few glints like mineral flecks
    vColor = aColor * (0.18 + 0.95 * lit) + vec3(1.0, 0.95, 0.85) * step(0.97, aSeed) * lit * 0.6;
    vAlpha = uFade * mix(0.1, 1.0, smoothstep(-0.15, 0.2, facing));
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(${COVERAGE.toFixed(2)} * uSpacing * uF * (0.8 + 0.4 * fract(aSeed * 91.7)) / -mv.z, 1.0, ${MAX_POINT_PX.toFixed(1)});
  }
`;

function buildRock(index, group, rng) {
  const { position, normal } = rockShape(ROCK_POINTS, rng);
  const palette = PALETTES[group % 2];
  const dark = new Color(palette.dark);
  const light = new Color(palette.light);
  const c = new Color();
  const color = new Float32Array(ROCK_POINTS * 3);
  const seed = new Float32Array(ROCK_POINTS);
  for (let i = 0; i < ROCK_POINTS; i++) {
    // darker toward the bottom of the rock, lighter on top, with speckle
    const shade = Math.min(1, Math.max(0, 0.5 + position[i * 3 + 1] * 0.45 + (rng() - 0.5) * 0.5));
    c.copy(dark).lerp(light, shade).toArray(color, i * 3);
    seed[i] = rng();
  }
  const radius = 0.32 + rng() * 0.5;
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: planetPointFragment,
    uniforms: {
      uF: { value: 1000 },
      uSpacing: { value: radius * Math.sqrt((4 * Math.PI) / ROCK_POINTS) },
      uFade: { value: 0 },
      uSun: { value: SUN },
    },
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
  return {
    index,
    position,
    normal,
    color,
    seed,
    material,
    radius,
    spin: new Vector3((rng() - 0.5) * 0.5, (rng() - 0.5) * 0.7, (rng() - 0.5) * 0.4),
    drift: [rng() * Math.PI * 2, 0.3 + rng() * 0.5],
  };
}

// The stack section's quiet decoration: a loose field of small rocks in the
// same glowing particles, tumbling slowly in the right-hand column. Amber and
// blue rocks alternate with the stack's groups.
export default function Rocks() {
  const group = useRef(null);
  const rocks = useRef([]);
  const aspect = useThree((s) => s.viewport.aspect);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  // The camera flies continuously, so the field sits where the camera is in
  // the MIDDLE of the stack section, not at the station that starts it.
  const station = useMemo(() => ROUTE.getPoint(STACK_MID / (SECTION_IDS.length - 1)), []);
  const built = useMemo(() => {
    const { stars } = constellationLayout(
      STACK_GROUPS.map((g) => g.items.length),
      mulberry32(9)
    );
    return stars
      .filter((_, i) => i % 2 === 0)
      .map((star, i) => ({ star, ...buildRock(i, star.group, mulberry32(40 + i)) }));
  }, []);

  useFrame(({ camera, clock }) => {
    const fade = 1 - smoothstep(0.5, 1.1, Math.abs(routePosition(journey.section) - STACK_MID));
    group.current.visible = fade > 0.01;
    if (!group.current.visible) return;
    stageOffset("stack", aspect, group.current.position).add(station);
    group.current.scale.setScalar(stageScale(aspect) * (aspect >= 1 ? 0.7 : 1));
    group.current.rotation.y = Math.sin(clock.elapsedTime * 0.1) * 0.2;
    const pixelsPerUnit = (size.height * gl.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const t = clock.elapsedTime;
    built.forEach((rock, i) => {
      const node = rocks.current[i];
      node.position.set(rock.star.x, rock.star.y + Math.sin(t * rock.drift[1] + rock.drift[0]) * 0.18, rock.star.z);
      node.rotation.set(t * rock.spin.x, t * rock.spin.y, t * rock.spin.z);
      node.scale.setScalar(rock.radius * (0.4 + 0.6 * fade));
      rock.material.uniforms.uF.value = pixelsPerUnit * group.current.scale.x;
      rock.material.uniforms.uFade.value = fade;
    });
  });

  return (
    <group ref={group}>
      {built.map((rock, i) => (
        <points
          key={rock.index}
          ref={(node) => {
            rocks.current[i] = node;
          }}
          frustumCulled={false}
          renderOrder={2}
        >
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rock.position, 3]} />
            <bufferAttribute attach="attributes-aNormal" args={[rock.normal, 3]} />
            <bufferAttribute attach="attributes-aColor" args={[rock.color, 3]} />
            <bufferAttribute attach="attributes-aSeed" args={[rock.seed, 1]} />
          </bufferGeometry>
          <primitive object={rock.material} attach="material" />
        </points>
      ))}
    </group>
  );
}
