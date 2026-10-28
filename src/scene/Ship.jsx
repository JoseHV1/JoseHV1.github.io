import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Matrix4, Quaternion, Vector3 } from "three";
import { journey } from "./journey";
import { ASCENT_HEADING, flybys, heroWeightAt, ignition, morphAt, plumeLength } from "./flight";
import { mulberry32, routePosition, SECTION_IDS, smoothstep } from "./math";
import { PLANETS } from "./planetData";
import { aheadU, cruiseOffset, ROUTE, shipLead, stageOffset, stageScale } from "./route";
import { glowPointFragment } from "./shaders";
import { buildHullParticles, buildHullParts, NOZZLE_RING, NOZZLE_Z } from "./shipGeometry";

const SHIP_SCALE = 0.95;
// Poses, nose first. The hero shows the launch pose (up and to the right).
// Along the route the ship flies nose first, banking through its curves; on
// the way back it half-loops with the camera (journey.loop), so it still flies
// nose first instead of reversing.
const UP = new Vector3(0, 1, 0);
const Z_AXIS = new Vector3(0, 0, 1);
const poseFrom = (heading, up) =>
  new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), new Vector3(...heading).normalize(), up));
const X_AXIS = new Vector3(1, 0, 0);
const POINT_SIZE = 34; // px at 1 world unit, before device pixel ratio

const hullVertex = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  attribute vec3 aColor;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // per-point delay so the ship dissolves in a ripple instead of as one block
    float m = smoothstep(aSeed * 0.4, aSeed * 0.4 + 0.6, uMorph);
    vec3 p = position;
    p += 0.03 * (1.0 + 3.0 * m) * vec3(sin(uTime * 2.0 + aSeed * 40.0), cos(uTime * 1.7 + aSeed * 31.0), sin(uTime * 1.3 + aSeed * 17.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.7 + 0.6 * fract(aSeed * 91.7)) / -mv.z;
    vColor = aColor;
    // at contact the ship fades out and leaves the screen to the text
    vAlpha = 1.0 - m;
  }
`;

// Exhaust of the three engines: short, soft and fading, a touch longer when scrolling fast.
const plumeVertex = /* glsl */ `
  uniform float uTime;
  uniform float uLen;
  uniform float uFlow;
  uniform float uAlpha;
  uniform float uSize;
  attribute float aSeed;
  attribute vec2 aNozzle;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // the faster the flight, the faster the flame streams out
    float t = fract(aSeed * 7.13 + uTime * (0.9 + 1.8 * uFlow)); // 0 at the nozzle, 1 at the tail
    float angle = aSeed * 81.7;
    float spread = (0.1 + t * (0.3 + 0.22 * uFlow)) * fract(aSeed * 3.7);
    vec3 p = vec3(aNozzle + vec2(cos(angle), sin(angle)) * spread, ${NOZZLE_Z.toFixed(2)} + t * uLen);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.3 + 1.5 * fract(aSeed * 5.3)) * (1.0 - 0.5 * t) / -mv.z;
    // white-hot blue core, then amber, then a deep orange tail
    vec3 core = vec3(0.78, 0.9, 1.0);
    vec3 mid = vec3(1.0, 0.72, 0.28);
    vec3 tail = vec3(1.0, 0.38, 0.1);
    vColor = mix(mix(core, mid, smoothstep(0.0, 0.35, t)), tail, smoothstep(0.35, 1.0, t));
    float flicker = 0.8 + 0.2 * sin(uTime * 38.0 + aSeed * 200.0);
    vColor *= 1.7; // over-bright on purpose: the bloom turns it into fire
    vAlpha = min(1.0, (1.0 - t) * (0.8 + 0.7 * uFlow) * flicker) * uAlpha;
  }
`;

// The protagonist: a launch vehicle made of glowing particles (amber nose
// fading to blue engines) that leads the camera along the route, banks away
// from the planets it passes, and dissolves at contact.
export default function Ship({ hullParticles, plumeParticles }) {
  const group = useRef(null);
  const skin = useRef(null);
  const plume = useRef(null);
  const aspect = useThree((s) => s.viewport.aspect);
  const gl = useThree((s) => s.gl);

  const particles = useMemo(() => buildHullParticles(buildHullParts(), hullParticles), [hullParticles]);
  const nozzles = useMemo(() => {
    const seeds = new Float32Array(plumeParticles);
    const at = new Float32Array(plumeParticles * 2);
    const rng = mulberry32(5);
    for (let i = 0; i < plumeParticles; i++) {
      const a = Math.PI / 2 + (Math.floor(rng() * 3) * Math.PI * 2) / 3;
      seeds[i] = rng();
      at.set([Math.cos(a) * NOZZLE_RING, Math.sin(a) * NOZZLE_RING], i * 2);
    }
    return { seeds, at, origin: new Float32Array(plumeParticles * 3) };
  }, [plumeParticles]);

  const hullUniforms = useMemo(() => ({ uTime: { value: 0 }, uMorph: { value: 0 }, uSize: { value: POINT_SIZE } }), []);
  const plumeUniforms = useMemo(() => ({ uTime: { value: 0 }, uLen: { value: 1.4 }, uFlow: { value: 0 }, uAlpha: { value: 1 }, uSize: { value: POINT_SIZE } }), []);
  const tmp = useMemo(
    () => ({
      pos: new Vector3(),
      focus: new Vector3(),
      stage: new Vector3(),
      tangent: new Vector3(),
      zero: new Vector3(),
      m: new Matrix4(),
      travel: new Quaternion(),
      kick: new Vector3(),
      ascent: poseFrom(ASCENT_HEADING, UP),
      loopTurn: new Quaternion(),
      up: new Vector3(),
      identity: new Quaternion(),
      goal: new Quaternion(),
      roll: new Quaternion(),
      lastR: 0,
      lastMorph: 0,
      ignitedAt: -Infinity, // clock time of the last lift-off (from the hero or back from contact)
    }),
    []
  );

  useFrame(({ clock }, delta) => {
    const ship = group.current;
    const r = routePosition(journey.section);
    const u = r / (SECTION_IDS.length - 1);
    const uShip = aheadU(u, shipLead(r));
    const heroWeight = heroWeightAt(r);
    const morph = morphAt(journey.section.contact);
    tmp.loopTurn.setFromAxisAngle(X_AXIS, journey.loop);

    ROUTE.getPoint(uShip, tmp.pos);
    const dodge = flybys(tmp.pos.z, PLANETS);
    const wide = aspect >= 1;
    // The route bends ahead of the camera; following it fully would carry the
    // ship sideways out of its column (and over the text). Keep most of the
    // sideways motion on the camera's own line of sight.
    ROUTE.getPoint(u, tmp.focus);
    tmp.pos.x = tmp.focus.x + (tmp.pos.x - tmp.focus.x) * 0.3;
    tmp.pos.y = tmp.focus.y + (tmp.pos.y - tmp.focus.y) * 0.3;
    // wide screens: the camera swing moves the ship across the frame, so push it back into the right-hand column
    tmp.pos.x += (wide ? dodge.yaw * 6 : dodge.swerve) * (1 - morph);
    if (wide) tmp.pos.y += dodge.dip * (1 - morph);
    tmp.pos.addScaledVector(cruiseOffset(aspect, tmp.stage), smoothstep(0.2, 1, r) * (1 - morph));
    tmp.pos.addScaledVector(stageOffset("hero", aspect, tmp.stage), heroWeight);
    tmp.pos.addScaledVector(stageOffset("contact", aspect, tmp.stage), morph);
    tmp.pos.y += Math.sin(clock.elapsedTime * 1.2) * 0.08;
    // On the way back the whole rig (camera and ship) is half-looped about the focus.
    tmp.pos.sub(tmp.focus).applyQuaternion(tmp.loopTurn).add(tmp.focus);

    // Lift-off: the first scroll away from the hero fires the engines. The
    // ship lurches forward along its nose with a short shake and a burst of
    // flame, then settles into the cruise.
    if (r > 0.02 && tmp.lastR <= 0.02 && journey.heading > 0) tmp.ignitedAt = clock.elapsedTime;
    // and leaving contact upward: the ship reappears and takes off again
    if (morph < 0.4 && tmp.lastMorph >= 0.4 && journey.heading < 0) tmp.ignitedAt = clock.elapsedTime;
    tmp.lastR = r;
    tmp.lastMorph = morph;
    const boost = ignition(clock.elapsedTime - tmp.ignitedAt) * (1 - morph);
    tmp.kick.set(0, 0, -1).applyQuaternion(ship.quaternion).multiplyScalar(2.4 * boost);
    tmp.pos.add(tmp.kick);
    tmp.pos.y += Math.sin(clock.elapsedTime * 55) * 0.05 * boost;
    ship.position.lerp(tmp.pos, 1 - Math.exp(-6 * delta));

    tmp.roll.setFromAxisAngle(Z_AXIS, dodge.bank * (1 - morph));
    // Matrix4.lookAt points -Z (the nose) along the route tangent. On the way
    // back (journey.loop = PI) the nose turns to the real backward direction,
    // -tangent: the half-loop flips y and z, and x is eased across with cos.
    ROUTE.getTangent(uShip, tmp.tangent);
    tmp.tangent.x *= Math.cos(journey.loop);
    tmp.tangent.applyQuaternion(tmp.loopTurn);
    tmp.m.lookAt(tmp.zero, tmp.tangent, tmp.up.copy(UP).applyQuaternion(tmp.loopTurn));
    tmp.travel.setFromRotationMatrix(tmp.m);
    tmp.goal
      .copy(tmp.travel)
      .slerp(tmp.ascent, heroWeight)
      .slerp(tmp.identity, morph)
      .multiply(tmp.roll);
    ship.quaternion.slerp(tmp.goal, 1 - Math.exp(-5 * delta));
    ship.scale.setScalar(SHIP_SCALE * stageScale(aspect) * (wide ? 0.92 + 0.13 * heroWeight : 1));
    journey.ship = ship;

    // R3F copies the `uniforms` props into the materials: write to the materials' own.
    const live = skin.current.material.uniforms;
    live.uTime.value = clock.elapsedTime;
    live.uMorph.value = morph;
    live.uSize.value = POINT_SIZE * gl.getPixelRatio();
    const exhaust = plume.current.material.uniforms;
    exhaust.uTime.value = clock.elapsedTime;
    exhaust.uLen.value = plumeLength(journey.flow) + 5 * boost;
    exhaust.uFlow.value = journey.flow + boost;
    exhaust.uAlpha.value = 1 - morph;
    exhaust.uSize.value = POINT_SIZE * gl.getPixelRatio();
  });

  return (
    <group ref={group}>
      {/* renderOrder 4: always draw after the planets (renderOrder 1-3, NormalBlending). */}
      <points ref={skin} frustumCulled={false} renderOrder={4}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.position, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[particles.color, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[particles.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={hullVertex}
          fragmentShader={glowPointFragment}
          uniforms={hullUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <points ref={plume} frustumCulled={false} renderOrder={4}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nozzles.origin, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[nozzles.seeds, 1]} />
          <bufferAttribute attach="attributes-aNozzle" args={[nozzles.at, 2]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={plumeVertex}
          fragmentShader={glowPointFragment}
          uniforms={plumeUniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
