// Bakes the Taglio's leather and brass textures into client/public/tex, so the browser downloads
// small images instead of generating millions of pixels on every visit:
//   noir pebbled calf (normal + roughness), cognac box-calf grain (normal),
//   the flap (colour with tonal drift, hide grain, needle holes and the blind-debossed D/F;
//   bump; glaze roughness), and the engraved brass plate.
// The D/F is drawn from the brand monogram (client/public/brand/DF_monogram_noir.svg).
//
//   node scripts/bake-textures.mjs
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { FLAP, COGNAC, BRASS } from '../client/src/three/taglioSpec.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'client', 'public', 'tex');
mkdirSync(OUT, { recursive: true });

const canvas = (w, h) => { const c = createCanvas(w, h); return [c, c.getContext('2d')]; };
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const save = (name, c, quality = 92) => {
  writeFileSync(path.join(OUT, name), c.encodeSync('webp', quality));
  console.log(`✓ tex/${name}  ${c.width}×${c.height}`);
};

// ---- The monogram, as paths ---------------------------------------------------------------
const svg = readFileSync(path.join(root, 'client', 'public', 'brand', 'DF_monogram_noir.svg'), 'utf8');
const subs = svg.match(/ d="([^"]+)"/)[1].split(/(?=M)/);
const GLYPHS = [subs[0] + subs[1], subs[2], subs[3]].map((d) => new Path2D(d)); // D, slash, F
const MARK_W = 1914.5, MARK_H = 1150.5, MARK_T = [20.5, 819.5]; // from the SVG viewBox and transform
// Draw the D/F centred on (cx, cy), `width` px wide.
function drawMark(ctx, cx, cy, width, fill) {
  const k = width / MARK_W;
  ctx.save();
  ctx.translate(cx - width / 2, cy - (MARK_H * k) / 2);
  ctx.scale(k, k);
  ctx.translate(...MARK_T);
  ctx.fillStyle = fill;
  for (const g of GLYPHS) ctx.fill(g, 'evenodd'); // separate fills, so overlaps never cancel
  ctx.restore();
}

// ---- Leather -------------------------------------------------------------------------------
function pebbleHeight(size, cells, seed) {
  const [sc, sctx] = canvas(64, 64);
  const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = g; sctx.fillRect(0, 0, 64, 64);
  const [c, ctx] = canvas(size, size);
  const r = rng(seed);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  const base = (size / Math.sqrt(cells)) * 0.75;
  for (let i = 0; i < cells; i++) {
    const x = r() * size, y = r() * size, rad = (0.6 + r() * 0.9) * base, d = rad * 2;
    for (const ox of x < rad ? [0, size] : x > size - rad ? [0, -size] : [0]) {
      for (const oy of y < rad ? [0, size] : y > size - rad ? [0, -size] : [0]) ctx.drawImage(sc, x + ox - rad, y + oy - rad, d, d);
    }
  }
  return c;
}

function normalFromHeight(hc, strength) {
  const { width: w, height: h } = hc;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [nc, nctx] = canvas(w, h);
  const out = nctx.createImageData(w, h);
  const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const len = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    out.data[i] = (-dx / len * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
    out.data[i + 2] = (1 / len * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
  }
  nctx.putImageData(out, 0, 0);
  return nc;
}

// Pebble tops are polished by use: roughness follows the inverted, softened height.
function roughnessFromHeight(hc) {
  const { width: w, height: h } = hc;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const [rc, rctx] = canvas(w, h);
  const out = rctx.createImageData(w, h);
  for (let i = 0; i < src.length; i += 4) {
    const v = Math.min(255, ((255 - src[i]) - 128) * 0.4 + 128 * 1.25);
    out.data[i] = out.data[i + 1] = out.data[i + 2] = v; out.data[i + 3] = 255;
  }
  rctx.putImageData(out, 0, 0);
  return rc;
}

const pebble = pebbleHeight(1024, 9000, 3);
save('noir-normal.webp', normalFromHeight(pebble, 3.6), 86);
save('noir-rough.webp', roughnessFromHeight(pebble), 90);
save('cognac-normal.webp', normalFromHeight(pebbleHeight(512, 7000, 11), 1.0), 94);

// ---- The flap ------------------------------------------------------------------------------
{
  const { poly, bbox, deboss } = FLAP;
  const S = 2048, sx = S / (bbox.x1 - bbox.x0), sy = S / (bbox.y1 - bbox.y0);
  const P = ([x, y]) => [(x - bbox.x0) * sx, (bbox.y1 - y) * sy];
  const [c, ctx] = canvas(S, S), [b, bctx] = canvas(S, S);
  ctx.fillStyle = COGNAC; ctx.fillRect(0, 0, S, S);
  const r = rng(7);
  const sheen = ctx.createLinearGradient(0, 0, 0, S);
  sheen.addColorStop(0, 'rgba(255,190,130,.10)'); sheen.addColorStop(1, 'rgba(60,25,8,.12)');
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(${r() < 0.5 ? '90,40,15' : '220,140,80'},${0.006 + r() * 0.01})`;
    ctx.beginPath(); ctx.arc(r() * S, r() * S, 80 + r() * 220, 0, Math.PI * 2); ctx.fill();
  }
  const img = ctx.getImageData(0, 0, S, S), px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (r() - 0.5) * 14;
    px[i] += n; px[i + 1] += n * 0.7; px[i + 2] += n * 0.45;
  }
  ctx.putImageData(img, 0, 0);
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, S, S);
  // needle holes along the stitch line (the thread itself is geometry in the scene)
  const inset = 0.09, [tl, tr, br, bl] = poly;
  const pts = [[tr[0] - inset, tr[1]], [br[0] - inset, br[1] + inset], [bl[0] + inset, bl[1] + inset], [tl[0] + inset, tl[1]]].map(P);
  for (const [ctx2, colour, w] of [[ctx, 'rgba(60,24,6,.35)', 7], [bctx, '#5a5a5a', 8]]) {
    ctx2.strokeStyle = colour; ctx2.lineWidth = w; ctx2.setLineDash([22, 14]); ctx2.lineCap = 'round';
    ctx2.beginPath(); ctx2.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx2.lineTo(...p); ctx2.stroke();
  }
  // the blind-debossed D/F: darker in colour, pressed into the bump
  const [dx, dy] = P([deboss.cx, deboss.cy]);
  drawMark(ctx, dx, dy, deboss.width * sx, 'rgba(70,30,10,.38)');
  drawMark(bctx, dx, dy, deboss.width * sx, '#3a3a3a');
  save('flap-color.webp', c, 80);
  save('flap-bump.webp', b, 92);
  // the glaze: a soft, uneven sheen
  const [g, gctx] = canvas(512, 512);
  gctx.fillStyle = '#7a7a7a'; gctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, rad = 30 + r() * 120;
    const gr = gctx.createRadialGradient(x, y, 0, x, y, rad);
    const v = r() < 0.5 ? '40,40,40' : '170,170,170';
    gr.addColorStop(0, `rgba(${v},.22)`); gr.addColorStop(1, `rgba(${v},0)`);
    gctx.fillStyle = gr; gctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  save('flap-rough.webp', g, 90);
}

// ---- The engraved brass plate (47 × 20 mm; engraving 22 mm wide, frame line at 3 mm) ----------
{
  const [c, ctx] = canvas(1024, 512);
  const g = ctx.createLinearGradient(0, 0, 1024, 512);
  g.addColorStop(0, '#e6c98d'); g.addColorStop(0.45, BRASS); g.addColorStop(1, '#a8823f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
  ctx.strokeStyle = 'rgba(80,55,20,.75)'; ctx.lineWidth = 10; ctx.strokeRect(66, 76, 892, 360);
  drawMark(ctx, 512, 262, 1024 * (22 / 47), 'rgba(70,48,18,.92)');
  save('plate.webp', c, 92);
}
