import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SECTION_IDS, routePosition, nearStation, pickTier, mulberry32,
  constellationLayout, fibonacciSphere, isTooSlow, rockShape,
} from "../src/scene/math.js";
import {
  bell, flybys, nextHeading, normalizeSpeed, fovFor, streakAlpha, streakLength, streakRate, plumeLength,
  cruiseFlow, CRUISE_FLOW, ASCENT_HEADING, ignition, loopGoal, heroWeightAt, morphAt,
} from "../src/scene/flight.js";
import { PLANETS } from "../src/scene/planetData.js";
import { cruiseOffset, frameShift } from "../src/scene/route.js";
import { ROUTE, STATIONS, SEGMENT_LENGTH, stationU, aheadU, shipLead, zAt, uAtZ } from "../src/scene/route.js";

const sections = (values) => Object.fromEntries(SECTION_IDS.map((id, i) => [id, values[i] ?? 0]));

test("routePosition moves continuously with the scroll, never parking", () => {
  assert.equal(routePosition(sections([])), 0);
  assert.equal(routePosition(sections([0.5])), 0.5); // already flying inside the hero
  assert.equal(routePosition(sections([1, 0.25])), 1.25);
  assert.equal(routePosition(sections([1, 1, 1, 1, 1, 0.7])), 5); // contact adds nothing: the route ends there
  let last = -1;
  for (let p = 0; p <= 1; p += 0.05) {
    const r = routePosition(sections([1, 1, p]));
    assert.ok(r > last, "strictly increasing while scrolling down");
    last = r;
  }
});

test("nearStation hides pieces more than a station away", () => {
  assert.ok(nearStation(0, "hero"));
  assert.ok(!nearStation(1, "automation"));
  assert.ok(nearStation(2.5, "stack"));
  assert.ok(!nearStation(4.5, "process"));
});

test("pickTier", () => {
  const base = { webgl: true, reducedMotion: false, coarsePointer: false, cores: 8, width: 1440 };
  assert.equal(pickTier(base), "high");
  assert.equal(pickTier({ ...base, webgl: false }), "off");
  assert.equal(pickTier({ ...base, reducedMotion: true }), "off");
  assert.equal(pickTier({ ...base, coarsePointer: true }), "low");
  assert.equal(pickTier({ ...base, cores: 4 }), "low");
  assert.equal(pickTier({ ...base, width: 767 }), "low");
});

test("isTooSlow judges the median frame, so hitches do not count", () => {
  const steady60 = Array.from({ length: 120 }, () => 1 / 60);
  assert.equal(isTooSlow(steady60), false);
  const phone20 = Array.from({ length: 120 }, () => 1 / 20);
  assert.equal(isTooSlow(phone20), true);
  const mostlyFine = [...Array.from({ length: 100 }, () => 1 / 60), ...Array.from({ length: 20 }, () => 0.5)];
  assert.equal(isTooSlow(mostlyFine), false, "a few long frames are hitches, not a slow device");
  assert.equal(isTooSlow([]), false, "no samples, no verdict");
});

test("mulberry32 is deterministic", () => {
  const a = mulberry32(7);
  const b = mulberry32(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test("constellationLayout draws one polyline per group", () => {
  const { stars, segments } = constellationLayout([3, 1, 4], mulberry32(5));
  assert.equal(stars.length, 8);
  assert.equal(segments.length, 2 + 0 + 3);
  for (const [a, b] of segments) assert.equal(stars[a].group, stars[b].group);
});

test("the route passes through every station, with segment lengths matching the table", () => {
  STATIONS.forEach((station, i) => {
    assert.ok(ROUTE.getPoint(stationU(SECTION_IDS[i])).distanceTo(station) < 1e-6, `station ${SECTION_IDS[i]}`);
  });
  SEGMENT_LENGTH.forEach((length, i) => {
    assert.equal(Math.round(STATIONS[i].z - STATIONS[i + 1].z), length);
  });
});

test("aheadU and shipLead", () => {
  assert.ok(aheadU(0.1, 10) > 0.1);
  assert.ok(aheadU(0.99, 100) <= 1);
  assert.equal(shipLead(0), 0);
  assert.equal(shipLead(5), 0);
  assert.ok(shipLead(2.5) > 9);
});

test("uAtZ inverts zAt", () => {
  for (const u of [0, 0.13, 0.5, 0.77, 1]) assert.ok(Math.abs(uAtZ(zAt(u)) - u) < 1e-6);
});

test("two planets, clear of the ship's path and of each other", () => {
  assert.equal(PLANETS.length, 2);
  const ship = cruiseOffset(2); // where the ship flies on wide screens
  let previous = zAt(0);
  for (const p of PLANETS) {
    const clearance = Math.hypot(p.dx - ship.x, p.dy - ship.y);
    assert.ok(p.z < previous && p.z > zAt(1), `${p.id} out of order or off the route`);
    assert.ok(p.radius >= 3 && p.radius <= 4.5, `${p.id}: big but under a quarter of the screen`);
    assert.ok(clearance - p.radius >= 1, `${p.id} would clip the ship`);
    assert.ok(p.dx >= 6 && p.dx <= 10, `${p.id} passes to the right of the flight line, never over the text`);
    assert.ok(p.reach >= 20 && p.reach <= 45);
    previous = p.z;
  }
  assert.ok(PLANETS[0].z - PLANETS[1].z >= 60, "planets far apart: one at a time");
});

test("fibonacciSphere spreads unit vectors evenly over the sphere", () => {
  const v = fibonacciSphere(2000);
  let sumY = 0;
  let north = 0;
  for (let i = 0; i < 2000; i++) {
    const len = Math.hypot(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
    assert.ok(Math.abs(len - 1) < 1e-5);
    sumY += v[i * 3 + 1];
    if (v[i * 3 + 1] > 0.5) north++;
  }
  assert.ok(Math.abs(sumY) < 1, "centred");
  assert.ok(Math.abs(north / 2000 - 0.25) < 0.01, "a quarter of the sphere lies above y = 0.5");
});

test("flybys: quiet far from planets, ducking away from the planet when close", () => {
  const far = flybys(0, [{ z: -100, dx: 2, dy: 8, reach: 20 }]);
  assert.deepEqual(far, { bank: 0, swerve: 0, dip: 0, look: 0, yaw: 0 });

  const above = flybys(-100, [{ z: -100, dx: 2, dy: 8, reach: 20 }]);
  assert.ok(above.dip < 0 && above.look > 0, "ducks under a planet above and glances up at it");
  assert.ok(above.bank > 0 && above.swerve < 0, "rolls and nudges away from its side");
  const below = flybys(-100, [{ z: -100, dx: -2, dy: -8, reach: 20 }]);
  assert.ok(below.dip > 0 && below.look < 0 && below.bank < 0 && below.swerve > 0);
  assert.ok(Math.abs(above.dip + below.dip) < 1e-12, "mirror image");
  assert.ok(above.yaw > 0 && below.yaw < 0, "the camera swings round to the side away from the planet");

  const crowded = flybys(-100, Array.from({ length: 6 }, () => ({ z: -100, dx: 2, dy: 8, reach: 20 })));
  assert.ok(crowded.bank <= 0.5 && crowded.swerve >= -0.8 && crowded.dip >= -1.5 && crowded.look <= 1 && crowded.yaw <= 0.45, "stays bounded");
  assert.ok(bell(0, 0.1) === 1 && bell(0.1, 0.1) === 0 && bell(0.05, 0.1) === bell(-0.05, 0.1));
});

test("cruise flow: the flight feels fast between launch and landing, even when not scrolling", () => {
  assert.equal(cruiseFlow(0, 0), 0, "idle at the launch pad");
  assert.equal(cruiseFlow(0, 5), 0, "engines off at the portrait");
  assert.ok(Math.abs(cruiseFlow(0, 2.5) - CRUISE_FLOW) < 1e-9, "steady cruise mid-flight");
  assert.equal(cruiseFlow(1, 2.5), 1, "scrolling fast goes beyond the cruise");
  assert.ok(cruiseFlow(0, 0.2) > 0 && cruiseFlow(0, 0.2) < CRUISE_FLOW, "ignition ramps up after the hero");
  assert.ok(streakAlpha(CRUISE_FLOW) > 0.15, "speed lines are visible while cruising");
  assert.ok(plumeLength(CRUISE_FLOW) > 3, "the flame is long while cruising");
  assert.ok(streakRate(1) > streakRate(0));
});

test("lift-off burst: fast attack, slow fade, nothing before ignition", () => {
  assert.equal(ignition(-1), 0);
  assert.equal(ignition(-Infinity), 0);
  assert.equal(ignition(NaN), 0);
  assert.ok(ignition(0.125) > 0.4 && ignition(0.125) < 0.6, "ramps up in a fraction of a second");
  assert.equal(ignition(0.25), 1);
  assert.ok(ignition(1) < ignition(0.5) && ignition(3.5) < 0.05, "fades out within ~3 s");
});

test("hero launch pose points the nose up and right, never at the reader", () => {
  const [x, y, z] = ASCENT_HEADING;
  assert.ok(y > 0 && x > 0, "up and away from the text");
  assert.ok(Math.abs(z) < 0.5, "never pointing at or away from the camera");
});

test("return trip: half-loop only while scrolling up, never at the hero or the portrait", () => {
  assert.equal(loopGoal(1, 0, 0), 0, "flying down: no loop");
  assert.equal(loopGoal(-1, 0, 0), 1, "flying back mid-route: full half-loop");
  assert.equal(loopGoal(-1, heroWeightAt(0), 0), 0, "upright at the hero");
  assert.equal(loopGoal(-1, 0, morphAt(1)), 0, "upright at the portrait");
  assert.ok(loopGoal(-1, heroWeightAt(0.2), 0) > 0 && loopGoal(-1, heroWeightAt(0.2), 0) < 1, "eases back upright near the hero");
});

test("rockShape makes lumpy rocks of roughly unit size with unit normals", () => {
  const { position, normal } = rockShape(300, mulberry32(3));
  assert.equal(position.length, 900);
  for (let i = 0; i < 300; i++) {
    const r = Math.hypot(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]);
    assert.ok(r > 0.4 && r < 1.7, `radius ${r}`);
    assert.ok(Math.abs(Math.hypot(normal[i * 3], normal[i * 3 + 1], normal[i * 3 + 2]) - 1) < 1e-5);
  }
  const radii = Array.from({ length: 300 }, (_, i) => Math.hypot(position[i * 3], position[i * 3 + 1], position[i * 3 + 2]));
  assert.ok(Math.max(...radii) - Math.min(...radii) > 0.3, "lumpy, not a smooth sphere");
});

test("heading follows the scroll direction (it picks the pose, the ship never reverses)", () => {
  assert.equal(nextHeading(1, -10), -1, "scrolling up turns it around");
  assert.equal(nextHeading(-1, 10), 1, "scrolling down turns it forward again");
  assert.equal(nextHeading(-1, 0.5), -1, "jitter keeps the heading");
  assert.equal(nextHeading(1, -0.5), 1);
  assert.equal(nextHeading(-1, 0), -1, "at rest it keeps facing where it was going");
});

test("lens shift puts the flight in the right-hand column on wide screens only", () => {
  assert.ok(frameShift(16 / 9) > 0.5 && frameShift(16 / 9) < 0.7, "flight line at ~80% of the width");
  assert.equal(frameShift(390 / 844), 0);
});

test("speed effects are subtle and bounded", () => {
  assert.equal(normalizeSpeed(0), 0);
  assert.equal(normalizeSpeed(1e6), 1);
  assert.equal(fovFor(0), 45);
  assert.equal(fovFor(5), 52);
  assert.equal(streakAlpha(0), 0);
  assert.ok(Math.abs(streakAlpha(1) - 0.28) < 1e-12 && streakAlpha(9) === streakAlpha(1));
  assert.ok(streakLength(1) <= 4.3 && plumeLength(1) <= 5.3);
  assert.ok(streakAlpha(0.3) < streakAlpha(0.6), "grows with speed");
});
