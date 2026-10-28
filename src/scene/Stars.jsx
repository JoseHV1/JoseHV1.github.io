import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Color } from "three";
import { mulberry32 } from "./math";
import { glowPointFragment } from "./shaders";

const TINTS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#dbe6ff", "#dbe6ff", "#FCD34D", "#4F8CFF"];
const STAR_SIZE = 2.4; // px before device pixel ratio

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute vec3 aColor;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    // each star twinkles at its own pace
    vAlpha = (0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 2.4) + aSeed * 60.0)) * (0.3 + 0.7 * aSeed);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * (0.5 + 1.6 * aSeed * aSeed);
  }
`;

// Star field around the whole route: twinkling points in three tints, denser
// and brighter ones scattered in depth so the flight reads as parallax.
export default function Stars({ count }) {
  const gl = useThree((s) => s.gl);
  const ref = useRef(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uSize: { value: STAR_SIZE } }), []);
  const [positions, colors, seeds] = useMemo(() => {
    const rng = mulberry32(11);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const c = new Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * 180;
      pos[i * 3 + 1] = (rng() - 0.5) * 110;
      pos[i * 3 + 2] = 40 - rng() * 340;
      c.set(TINTS[Math.floor(rng() * TINTS.length)]).multiplyScalar(0.45 + rng() * 0.55);
      c.toArray(col, i * 3);
      seed[i] = rng();
    }
    return [pos, col, seed];
  }, [count]);

  useFrame(({ clock }) => {
    // R3F copies the `uniforms` prop into the material: write to the material's own.
    const live = ref.current.material.uniforms;
    live.uTime.value = clock.elapsedTime;
    live.uSize.value = STAR_SIZE * gl.getPixelRatio();
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={glowPointFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
