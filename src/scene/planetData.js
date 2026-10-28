// The two planets of the flight. Pure data, no three.js.
//
// `z` is where the ship passes closest (world z along the route), `dx`/`dy`
// the offset from the flight line: to the right of it, so the ship visibly
// flies past the planet's flank while the camera swings round it. `reach` is
// how far (world units) the planet's pull on the ship and camera is felt.
export const PLANETS = [
  { id: "solis", z: -62, dx: 8, dy: 1.5, radius: 3.6, kind: "gas", ring: true, reach: 34 },
  { id: "cobalt", z: -182, dx: 8.5, dy: -1.5, radius: 4.2, kind: "giant", ring: false, reach: 38 },
];
