import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import { journey } from "./journey";
import { streakAlpha, streakLength, streakRate } from "./flight";
import { mulberry32 } from "./math";

const DEPTH = 120; // length of the tube of speed lines along the ship's axis

// The lines live in the ship's own frame (nose = -Z) and slide backwards past
// it, driven by a phase that only ever grows. Scrolling up changes nothing:
// the ship keeps climbing, the sky keeps streaming away behind it.
const vertexShader = /* glsl */ `
  uniform float uPhase;
  uniform float uLen;
  uniform float uAlpha;
  uniform float uDepth;
  attribute vec3 aBase;
  attribute float aEnd;
  varying float vAlpha;

  void main() {
    // ahead of the ship at -uDepth, behind it at +0.25 uDepth, then wrapped
    float zRel = mod(aBase.z - uPhase, uDepth) - uDepth * 0.75;
    vec3 p = vec3(aBase.xy, zRel + aEnd * uLen);
    float far = 1.0 - smoothstep(uDepth * 0.35, uDepth * 0.75, -zRel);
    float gone = 1.0 - smoothstep(uDepth * 0.1, uDepth * 0.25, zRel);
    vAlpha = uAlpha * far * gone * (1.0 - 0.8 * aEnd);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.7, 0.8, 1.0, vAlpha);
    #include <colorspace_fragment>
  }
`;

// Speed lines that stream past the ship the whole flight, faster as the
// reader scrolls. Light on purpose: they sell speed, they never take over.
export default function Streaks({ count }) {
  const ref = useRef(null);
  const phase = useRef(0);
  const geometry = useMemo(() => {
    const rng = mulberry32(21);
    const base = new Float32Array(count * 2 * 3);
    const end = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 3 + rng() * 14;
      const z = rng() * DEPTH;
      for (let k = 0; k < 2; k++) {
        base.set([Math.cos(angle) * radius, Math.sin(angle) * radius, z], (i * 2 + k) * 3);
        end[i * 2 + k] = k;
      }
    }
    return { base, end };
  }, [count]);
  const uniforms = useMemo(() => ({ uPhase: { value: 0 }, uLen: { value: 0 }, uAlpha: { value: 0 }, uDepth: { value: DEPTH } }), []);

  useFrame((_, rawDelta) => {
    const lines = ref.current;
    const ship = journey.ship;
    const alpha = streakAlpha(journey.flow);
    lines.visible = alpha > 0.003 && Boolean(ship);
    if (!lines.visible) return;
    phase.current += streakRate(journey.flow) * Math.min(rawDelta, 0.1);
    lines.position.copy(ship.position);
    lines.quaternion.copy(ship.quaternion);
    const live = lines.material.uniforms;
    live.uPhase.value = phase.current;
    live.uLen.value = streakLength(journey.flow);
    live.uAlpha.value = alpha;
  });

  return (
    <lineSegments ref={ref} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 2 * 3), 3]} />
        <bufferAttribute attach="attributes-aBase" args={[geometry.base, 3]} />
        <bufferAttribute attach="attributes-aEnd" args={[geometry.end, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
}
