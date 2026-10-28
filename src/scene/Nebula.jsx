import { useMemo } from "react";
import { AdditiveBlending, Color, Vector3 } from "three";
import { mulberry32 } from "./math";
import { ROUTE } from "./route";
import { dotTexture } from "./textures";

// Where the dust clouds hang: route parameter, offset from the flight line
// (always off to the right/back, away from the text) and colour.
const CLOUDS = [
  { u: 0.52, offset: [20, 5, -28], radius: 13, color: "#4F8CFF" },
  { u: 0.7, offset: [24, 0, -30], radius: 15, color: "#FCD34D" },
  { u: 0.88, offset: [21, 3, -28], radius: 14, color: "#4F8CFF" },
];

const gaussian = (rng) => (rng() + rng() + rng() - 1.5) / 1.5; // roughly -1..1, bell shaped

// Large, very faint additive sprites that give depth to the empty space
// between planets.
export default function Nebula({ count }) {
  const map = useMemo(dotTexture, []);
  const [positions, colors] = useMemo(() => {
    const rng = mulberry32(31);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const centre = new Vector3();
    const c = new Color();
    for (let i = 0; i < count; i++) {
      const cloud = CLOUDS[i % CLOUDS.length];
      ROUTE.getPoint(cloud.u, centre);
      pos[i * 3] = centre.x + cloud.offset[0] + gaussian(rng) * cloud.radius;
      pos[i * 3 + 1] = centre.y + cloud.offset[1] + gaussian(rng) * cloud.radius * 0.5;
      pos[i * 3 + 2] = centre.z + cloud.offset[2] + gaussian(rng) * cloud.radius;
      c.set(cloud.color).multiplyScalar(0.5 + rng() * 0.5).toArray(col, i * 3);
    }
    return [pos, col];
  }, [count]);

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={9}
        map={map}
        vertexColors
        transparent
        opacity={0.03}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
