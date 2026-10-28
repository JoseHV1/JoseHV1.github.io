import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Vector2 } from "three";
import { journey } from "./journey";
import { QUALITY } from "./quality";
import CameraRig from "./CameraRig";
import Stars from "./Stars";
import Nebula from "./Nebula";
import Streaks from "./Streaks";
import Planets from "./Planets";
import Ship from "./Ship";
import Rocks from "./Rocks";
import FrameWatch from "./FrameWatch";

const BACKGROUND = "#07070a";

// Cinematic grade: bloom for the glow, a soft vignette, and a hair of colour
// fringing that grows with speed (kept tiny on purpose).
function Post() {
  const aberration = useRef(null);
  const offset = useMemo(() => new Vector2(0, 0), []);
  useFrame(() => {
    // none at rest: at 1px stars, any fringing turns them into red/blue confetti
    const amount = journey.speed * 0.0007;
    aberration.current?.offset.set(amount, amount);
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={0.7} luminanceSmoothing={0.25} intensity={0.85} />
      <Vignette eskil={false} offset={0.25} darkness={0.7} />
      <ChromaticAberration ref={aberration} offset={offset} radialModulation={false} modulationOffset={0} />
    </EffectComposer>
  );
}

// Fixed, decorative canvas behind the page. All text lives in the DOM.
export default function Scene({ tier, onFail, onSlow }) {
  const quality = QUALITY[tier];
  const [visible, setVisible] = useState(() => !document.hidden);

  // Hidden tab: stop rendering instead of burning GPU in the background.
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        style={{ pointerEvents: "none" }}
        frameloop={visible ? "always" : "never"}
        dpr={[1, quality.maxDpr]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ fov: 45, near: 0.1, far: 500, position: [0, 0.6, 14] }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", onFail, { once: true });
        }}
      >
        <color attach="background" args={[BACKGROUND]} />
        <CameraRig />
        <FrameWatch onSlow={onSlow} />
        <Stars count={quality.stars} />
        <Nebula count={quality.nebula} />
        {quality.streaks > 0 && <Streaks count={quality.streaks} />}
        <Planets bodyPoints={quality.planetPoints} ringPoints={quality.ringPoints} />
        <Ship hullParticles={quality.hullParticles} plumeParticles={quality.plume} />
        <Rocks />
        {quality.post && <Post />}
      </Canvas>
    </div>
  );
}
