// Taglio DF-01 measurements (tech pack, decimetres), shared by the 3D scene and the texture bake
// (scripts/bake-textures.mjs), so the baked flap artwork lines up exactly with the flap geometry.
export const W_BASE = 4.31, W_TOP = 4.09, H = 3.1, D = 1.1, BEVEL = 0.07;
export const TAN15 = Math.tan(Math.PI / 12);
export const halfW = (y) => (W_BASE - (W_BASE - W_TOP) * (y / H)) / 2;
// The flap's lower edge rises left to right on the 15° line, crossing the centre at FLAP_MID.
export const FLAP_MID = 1.33;
export const flapY = (x) => FLAP_MID + x * TAN15;

// Matched to the studio photography: a warm tan cognac, a charcoal (not jet) noir, satin light gold.
export const COGNAC = '#a8582a', NOIR = '#2e2c2a', BRASS = '#c9a45e';

// The flap outline (top-left, top-right, bottom-right, bottom-left) and the box its artwork covers.
const inset = 0.005, yTop = H - 0.06;
const xl = -halfW(flapY(-2)) + inset, xr = halfW(flapY(2)) - inset;
export const FLAP = {
  poly: [[-halfW(yTop) + inset, yTop], [halfW(yTop) - inset, yTop], [xr, flapY(xr)], [xl, flapY(xl)]],
  bbox: { x0: -2.25, x1: 2.25, y0: 0.6, y1: 3.15 },
  // Blind-debossed D/F: 44 mm wide, centred 58 mm in from the left edge and 58 mm below the top.
  deboss: { cx: -1.47, cy: 2.52, width: 0.44 },
};

// Baked texture files in client/public/tex (see scripts/bake-textures.mjs).
export const TEXTURES = {
  noirNormal: '/tex/noir-normal.webp',
  noirRough: '/tex/noir-rough.webp',
  cognacNormal: '/tex/cognac-normal.webp',
  flapColor: '/tex/flap-color.webp',
  flapBump: '/tex/flap-bump.webp',
  flapRough: '/tex/flap-rough.webp',
  plate: '/tex/plate.webp',
};
