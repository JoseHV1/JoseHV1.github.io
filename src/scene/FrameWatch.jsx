import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { isTooSlow } from "./math";

// Frames before we start judging: shader compile and first uploads are slow
// on every device and say nothing about the phone.
const WARMUP_FRAMES = 60;
const SAMPLE_FRAMES = 120;

// Renders nothing. Times the first real frames of the scene. If the device
// cannot keep about 24 fps (iPhones in low-power mode, older phones) it calls
// onSlow once, and the page keeps its static background instead of stuttering.
export default function FrameWatch({ onSlow }) {
  const seen = useRef(0);
  const deltas = useRef([]);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current) return;
    seen.current += 1;
    if (seen.current <= WARMUP_FRAMES) return;
    deltas.current.push(delta);
    if (deltas.current.length < SAMPLE_FRAMES) return;
    done.current = true;
    if (isTooSlow(deltas.current)) onSlow();
  });

  return null;
}
