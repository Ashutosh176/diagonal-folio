// Re-engraves the D/F logo on metal plates where the 3D renders came out wrong
// (missing or broken letters). For each plate: the face is mapped with a perspective
// homography, stray/broken engraving marks are smoothed away, and the exact D/F
// letterforms from the brand monogram are engraved back in perspective, 4×4 supersampled.
// Only plate pixels change; originals are backed up to assets/source-renders first.
//
//   node scripts/fix-plate-logos.mjs && npm run images
import { readFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIG = path.join(root, 'assets', 'originals');
const BACKUP = path.join(root, 'assets', 'source-renders');

// Face quads are [TL, TR, BR, BL] in source pixels, inside the bevel.
// Cadre: `bar` is the raised turn-lock (slash) — [x1, y1, x2, y2, halfWidth]; it is never painted over.
const PLATES = [
  { file: 'cadre-banner', kind: 'cadre', quad: [[1494.2, 430.8], [1586.7, 435], [1582.5, 489.2], [1489.2, 485]], bar: [1520, 480.8, 1550.8, 438.3, 4.5] },
  { file: 'cadre-cg-01-hero', kind: 'cadre', quad: [[880.7, 706.7], [1009, 719.3], [999.5, 796.5], [867, 789]], bar: [908.3, 783.3, 960, 720, 6] },
  { file: 'cadre-cg-02-front', kind: 'cadre', quad: [[921.3, 667.5], [1081.3, 667], [1081.3, 750], [917.5, 750]], bar: [976.3, 741.3, 1023.8, 672.5, 5.5] },
  { file: 'cadre-cg-07-mood', kind: 'cadre', quad: [[991.3, 720], [1116.3, 713.8], [1126.3, 790], [1001.3, 796.3]], bar: [1048.8, 786.3, 1075, 721.3, 6] },
  { file: 'cadre-eb', kind: 'cadre', quad: [[526.4, 425], [608.6, 432.1], [605, 482.1], [520, 471.4]], bar: [547.9, 471.4, 576.4, 432.1, 4.5] },
  { file: 'cadre-nr', kind: 'cadre', quad: [[526.4, 425], [608.6, 432.1], [605, 482.1], [520, 471.4]], bar: [547.9, 471.4, 576.4, 432.1, 4.5] },
  { file: 'taglio-nc-01-hero', kind: 'taglio', quad: [[887, 1313], [985, 1302], [993, 1346], [896, 1360]] },
  { file: 'taglio-nc-02-front', kind: 'taglio', quad: [[953.8, 1217.5], [1077.5, 1187.5], [1087.5, 1237.5], [965, 1270]] },
  { file: 'taglio-nc-07-mood', kind: 'taglio', quad: [[1050, 1315], [1140, 1280], [1148.3, 1315], [1057.5, 1355]] },
  { file: 'taglio-es', kind: 'taglio', quad: [[533.1, 788.1], [588.8, 782.5], [593.8, 807.5], [538.8, 815]] },
  { file: 'taglio-nn', kind: 'taglio', quad: [[533.1, 787.5], [590, 781.3], [595, 806.3], [538.8, 815.6]] },
];

// Engraving layout per plate type, measured from the correctly rendered close-ups
// (cadre-cg-05-lock, taglio-nc-05-clasp). Units are fractions of the face.
const LAYOUT = {
  cadre: { aspect: 0.52, border: [0.035, 0.07], stroke: 0.007, cap: 0.48, dLeft: 0.095, fRight: 0.835, depth: [0.38, 0.44, 0.58] },
  taglio: { aspect: 0.44, border: [0.04, 0.12], stroke: 0.008, cap: 0.42, depth: [0.5, 0.56, 0.68] },
};

// ---- Brand monogram glyphs ---------------------------------------------------
const mono = readFileSync(path.join(root, 'client', 'public', 'brand', 'DF_monogram_noir.svg'), 'utf8');
const sub = mono.match(/ d="([^"]+)"/)[1].split(/(?=M)/);
const GLYPH = { D: sub[0] + sub[1], slash: sub[2], F: sub[3] };
// Glyph bounds in monogram space (measured): D x 60–719, F x 1353–1855, caps y 118–820; full mark x 60–1855.
const CAP_TOP = 118, CAP_H = 702, TX = 20.5, TY = 819.5;

const TW = 1200;
async function engravingMask(kind) {
  const L = LAYOUT[kind];
  const W = TW, H = Math.round(TW * L.aspect);
  const s = (L.cap * H) / CAP_H;
  const capY = (H - L.cap * H) / 2;
  const glyph = (d, x) => `<path fill-rule="evenodd" fill="#fff" transform="translate(${x} ${capY - CAP_TOP * s}) scale(${s}) translate(${TX} ${TY})" d="${d}"/>`;
  let marks;
  if (kind === 'cadre') {
    marks = glyph(GLYPH.D, L.dLeft * W - 60 * s) + glyph(GLYPH.F, L.fRight * W - 1855 * s);
  } else {
    const x = (W - (1855 - 60) * s) / 2 - 60 * s;
    marks = glyph(GLYPH.D, x) + glyph(GLYPH.slash, x) + glyph(GLYPH.F, x); // separate paths so overlaps don't cancel
  }
  const [bx, by] = L.border;
  const sw = L.stroke * W;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#000"/>
    <rect x="${bx * W}" y="${by * H}" width="${W - 2 * bx * W}" height="${H - 2 * by * H}" fill="none" stroke="#fff" stroke-width="${sw}"/>${marks}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).blur(0.6).greyscale().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, ch: info.channels };
}

function sampleMask(m, u, v) {
  const x = u * (m.w - 1), y = v * (m.h - 1);
  if (x < 0 || y < 0 || x > m.w - 1 || y > m.h - 1) return 0;
  const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, m.w - 1), y1 = Math.min(y0 + 1, m.h - 1);
  const fx = x - x0, fy = y - y0, at = (xx, yy) => m.data[(yy * m.w + xx) * m.ch] / 255;
  return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy) + (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy;
}

// ---- Geometry ------------------------------------------------------------------
function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
// Homography mapping image (x, y) → face (u, v).
function imageToFace(quad) {
  const src = quad, dst = [[0, 0], [1, 0], [1, 1], [0, 1]], A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = solve(A, b);
  return (x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
const distToSeg = (px, py, [x1, y1, x2, y2]) => {
  const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

// Robust quadratic surface fit of plate colour over (u, v).
function fitSurface(samples) {
  const feats = ([u, v]) => [1, u, v, u * u, u * v, v * v];
  let use = samples, coef;
  for (let iter = 0; iter < 4; iter++) {
    coef = [0, 1, 2].map((c) => {
      const AtA = Array.from({ length: 6 }, () => Array(6).fill(0)), Atb = Array(6).fill(0);
      for (const s of use) { const f = feats(s.uv); for (let i = 0; i < 6; i++) { Atb[i] += f[i] * s.rgb[c]; for (let j = 0; j < 6; j++) AtA[i][j] += f[i] * f[j]; } }
      for (let i = 0; i < 6; i++) AtA[i][i] += 1e-6;
      return solve(AtA, Atb);
    });
    const pred = (s) => [0, 1, 2].map((c) => feats(s.uv).reduce((a, f, i) => a + f * coef[c][i], 0));
    use = samples.filter((s) => { const p = pred(s), L = lum(s.rgb), PL = lum(p); return L > PL - 9 && L < PL + 30; });
  }
  return (uv) => [0, 1, 2].map((c) => feats(uv).reduce((a, f, i) => a + f * coef[c][i], 0));
}
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

// ---- Per plate -------------------------------------------------------------------
async function fixPlate(buf, info, plate, mask) {
  const L = LAYOUT[plate.kind];
  const toFace = imageToFace(plate.quad);
  const xs = plate.quad.map((p) => p[0]), ys = plate.quad.map((p) => p[1]);
  const x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1;
  const y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
  const C = info.channels, idx = (x, y) => (y * info.width + x) * C;
  const protectedPx = (x, y, extra = 0) => plate.bar && distToSeg(x + 0.5, y + 0.5, plate.bar) < plate.bar[4] * (plate.kind === 'cadre' ? 2.2 : 1) + extra;
  const interior = ([u, v]) => u > 0.012 && u < 0.988 && v > 0.025 && v < 0.975;

  // 1. Fit the clean plate surface and smooth away dark (engraved/broken) marks.
  const samples = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const uv = toFace(x + 0.5, y + 0.5);
    if (!interior(uv) || protectedPx(x, y)) continue;
    const i = idx(x, y);
    samples.push({ x, y, uv, rgb: [buf[i], buf[i + 1], buf[i + 2]] });
  }
  const surface = fitSurface(samples);
  const resid = samples.map((s) => lum(s.rgb) - lum(surface(s.uv)));
  const ok = resid.filter((r) => r > -9 && r < 30);
  const sigma = Math.sqrt(ok.reduce((a, r) => a + r * r, 0) / Math.max(1, ok.length));

  const weight = new Map();
  for (const s of samples) {
    const d = lum(surface(s.uv)) - lum(s.rgb);
    const w = Math.max(0, Math.min(1, (d - 5) / 12));
    if (w > 0) weight.set(s.y * info.width + s.x, w);
  }
  // Dilate by one pixel so anti-aliased edges of old marks go too.
  const grown = new Map(weight);
  for (const [k, w] of weight) {
    const x = k % info.width, y = (k - x) / info.width;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const kk = (y + dy) * info.width + (x + dx);
      if (!protectedPx(x + dx, y + dy) && interior(toFace(x + dx + 0.5, y + dy + 0.5))) grown.set(kk, Math.max(grown.get(kk) || 0, w * 0.85));
    }
  }
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  for (const [k, w] of grown) {
    const x = k % info.width, y = (k - x) / info.width, i = idx(x, y);
    const fit = surface(toFace(x + 0.5, y + 0.5)), n = rnd() * sigma * 0.6;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(buf[i + c] * (1 - w) + (fit[c] + n) * w);
  }

  // 2. Engrave the monogram, supersampled 4×4, with a soft lit lip on the lower edge.
  const SS = 4, lip = 0.006;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (protectedPx(x, y, plate.kind === 'cadre' ? -plate.bar[4] * 1.1 : 0)) continue;
    let m = 0, hl = 0, inside = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const [u, v] = toFace(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      inside++;
      const a = sampleMask(mask, u, v);
      m += a;
      hl += Math.max(0, sampleMask(mask, u - lip, v - lip * 2) - a);
    }
    if (!inside) continue;
    m /= SS * SS; hl /= SS * SS;
    if (m < 0.002 && hl < 0.002) continue;
    const i = idx(x, y);
    for (let c = 0; c < 3; c++) {
      const base = buf[i + c];
      buf[i + c] = Math.max(0, Math.min(255, Math.round(base * (1 - L.depth[c] * m) + (255 - base) * 0.18 * hl)));
    }
  }
}

if (!existsSync(BACKUP)) mkdirSync(BACKUP, { recursive: true });
const masks = { cadre: await engravingMask('cadre'), taglio: await engravingMask('taglio') };
for (const plate of PLATES) {
  const file = path.join(ORIG, `${plate.file}.jpg`), backup = path.join(BACKUP, `${plate.file}.jpg`);
  if (!existsSync(backup)) copyFileSync(file, backup); // always work from the untouched render
  const { data, info } = await sharp(backup).raw().toBuffer({ resolveWithObject: true });
  await fixPlate(data, info, plate, masks[plate.kind]);
  await sharp(data, { raw: info }).jpeg({ quality: 96, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(file);
  console.log(`✓ ${plate.file}`);
}
