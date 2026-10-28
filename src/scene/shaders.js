// Round, soft particle shared by every point cloud that uses a ShaderMaterial.
// Expects vColor (linear) and vAlpha from the vertex shader.
export const glowPointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * (0.5 + glow), glow * vAlpha);
    #include <colorspace_fragment>
  }
`;

// Dense planet particles: a flat soft disc with no extra glow, so thousands of
// overlapping points add up to a solid-looking globe instead of a white blob.
export const planetPointFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, vAlpha * smoothstep(0.5, 0.3, d));
    #include <colorspace_fragment>
  }
`;
