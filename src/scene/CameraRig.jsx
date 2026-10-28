import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import { journey } from "./journey";
import { cruiseFlow, flybys, fovFor, heroWeightAt, LOOP_RATE, loopGoal, morphAt, nextHeading, normalizeSpeed } from "./flight";
import { routePosition, SECTION_IDS, smoothstep } from "./math";
import { PLANETS } from "./planetData";
import { CAMERA_OFFSET, frameShift, ROUTE } from "./route";

const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);

// Frame-rate independent smoothing factor.
const damp = (rate, delta) => 1 - Math.exp(-rate * delta);

// Flies the camera along the route as the reader scrolls. Reads the scroll,
// publishes how fast we are going (journey.speed) and adds the cinematic
// layer: a glance at passing planets, a slight roll into them, a wider lens
// when going fast and a little pointer parallax.
export default function CameraRig() {
  const focus = useMemo(() => new Vector3(), []);
  const previous = useMemo(() => new Vector3(), []);
  const goal = useMemo(() => new Vector3(), []);
  const look = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);
  const offset = useMemo(() => new Vector3(), []);
  const loopTurn = useMemo(() => new Quaternion(), []);
  const state = useMemo(() => ({ ready: false, speed: 0, u: 0, loop: 0, pointerX: 0, pointerY: 0 }), []);

  useEffect(() => {
    const onMove = (e) => {
      state.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [state]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1); // a hidden tab must not teleport the camera
    const r = routePosition(journey.section);
    const u = r / (SECTION_IDS.length - 1);
    ROUTE.getPoint(u, focus);

    if (!state.ready) {
      state.ready = true;
      previous.copy(focus);
      camera.position.copy(focus).add(CAMERA_OFFSET);
      look.copy(focus);
      state.u = u;
    }
    if (delta > 0) {
      const perSecond = focus.distanceTo(previous) / delta;
      state.speed += (perSecond - state.speed) * damp(5, delta);
      journey.heading = nextHeading(journey.heading, Math.sign(u - state.u) * perSecond);
    }
    previous.copy(focus);
    state.u = u;
    journey.speed = normalizeSpeed(state.speed);
    journey.flow = cruiseFlow(journey.speed, r);

    const glance = flybys(focus.z, PLANETS);

    // Half-loop for the trip back (see loopGoal); the ship reads journey.loop too.
    const loopTarget = loopGoal(journey.heading, heroWeightAt(r), morphAt(journey.section.contact));
    state.loop += (loopTarget - state.loop) * damp(LOOP_RATE, delta);
    journey.loop = Math.PI * smoothstep(0, 1, state.loop);
    loopTurn.setFromAxisAngle(X_AXIS, journey.loop);

    offset.copy(CAMERA_OFFSET);
    offset.z += journey.flow * 2.5;
    offset.applyAxisAngle(Y_AXIS, -glance.yaw).applyQuaternion(loopTurn);
    goal.copy(focus).add(offset);
    goal.x += state.pointerX * 0.8;
    goal.y += state.pointerY * 0.5 - glance.look * 0.3;
    camera.position.lerp(goal, damp(4, delta));

    target.copy(focus);
    target.y += glance.look;
    look.lerp(target, damp(4, delta));
    camera.up.copy(Y_AXIS).applyQuaternion(loopTurn);
    camera.lookAt(look);
    camera.rotateZ(-glance.bank * 0.1);

    const fov = fovFor(journey.flow);
    let dirty = false;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * damp(3, delta);
      dirty = true;
    }
    // Lens shift (see frameShift): film offset that moves the image right by
    // `shift` NDC, recomputed as the fov and aspect change.
    const film = -frameShift(camera.aspect) * camera.getFilmWidth() * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
    if (Math.abs(camera.filmOffset - film) > 1e-4) {
      camera.filmOffset = film;
      dirty = true;
    }
    if (dirty) camera.updateProjectionMatrix();
  });

  return null;
}
