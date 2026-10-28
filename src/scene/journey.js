// Shared scroll state. DOM hooks write it; the 3D scene reads it every frame.
// A plain mutable object on purpose: scrolling must not re-render React.
export const journey = {
  section: { hero: 0, process: 0, automation: 0, stack: 0, work: 0, contact: 0 },
  speed: 0, // camera speed, 0..1, written by CameraRig and read by the ship, streaks and post FX
  flow: 0, // how fast the flight feels, 0..1 (scroll speed, never below the cruise), written by CameraRig
  heading: 1, // 1 scrolling down, -1 scrolling up, written by CameraRig
  loop: 0, // radians of the return-trip half-loop (0 forward, PI heading home), written by CameraRig
  ship: null, // the ship's Object3D, set by Ship so the speed lines can follow it
};
