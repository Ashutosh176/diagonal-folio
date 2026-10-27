// A real-time 3D Taglio DF-01, built from the tech pack (W 431 base / 409 top × H 310 × D 110 mm),
// for the home-page scroll story. Units are decimetres. All textures are drawn on canvases:
// pebbled noir calf, cognac box calf with saddle stitching and a blind-debossed D/F, and a
// light-gold brass clasp engraved D/F. The scene only renders when something changes.
// Overlapping parts are kept a few hundredths apart so no two surfaces share a plane (no shimmer).
// The bag is built in part groups so it can come apart into an exploded view (`explode` 0→1),
// and it floats in drifting gold dust that parallaxes with the camera and the pointer.
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

const W_BASE = 4.31, W_TOP = 4.09, H = 3.1, D = 1.1, BEVEL = 0.07;
const TAN15 = Math.tan(Math.PI / 12);
const halfW = (y) => (W_BASE - (W_BASE - W_TOP) * (y / H)) / 2;
// The flap's lower edge: rises left to right on the 15° line, crossing the centre at FLAP_MID.
const FLAP_MID = 1.33;
const flapY = (x) => FLAP_MID + x * TAN15;

const COGNAC = '#9c4a1c', NOIR = '#1d1c1b', BRASS = '#c9a45e';
const SERIF = "'Cormorant Garamond', 'Times New Roman', serif";

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

// Seeded noise so the leather looks the same on every load.
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

// Height field → tangent-space normal map.
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

// A tileable field of soft pebbles. Each pebble is one pre-rendered sprite stamped with
// drawImage (much faster than building a gradient per pebble); pebbles near an edge are
// stamped again on the far side so the texture tiles without seams.
let pebbleSprite = null;
function pebbleHeight(size, cells, seed) {
  if (!pebbleSprite) {
    const [sc, sctx] = canvas(64, 64);
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = g; sctx.fillRect(0, 0, 64, 64);
    pebbleSprite = sc;
  }
  const [c, ctx] = canvas(size, size);
  const r = rng(seed);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
  const base = size / Math.sqrt(cells) * 0.75;
  for (let i = 0; i < cells; i++) {
    const x = r() * size, y = r() * size, rad = (0.6 + r() * 0.9) * base, d = rad * 2;
    for (const ox of x < rad ? [0, size] : x > size - rad ? [0, -size] : [0]) {
      for (const oy of y < rad ? [0, size] : y > size - rad ? [0, -size] : [0]) {
        ctx.drawImage(pebbleSprite, x + ox - rad, y + oy - rad, d, d);
      }
    }
  }
  return c;
}

function tex(c, repeat = 1, srgb = false) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 16; // clamped by three.js to what the GPU supports
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Cognac flap face: an even glazed colour with a faint tonal drift, saddle stitching inset from
// the cut edges, and the blind-debossed D/F (darker, with a matching bump).
function flapFace(poly, bbox, debossAt) {
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
  // a fine hide grain over the colour, written straight into the pixels (fast)
  const img = ctx.getImageData(0, 0, S, S), px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const n = (r() - 0.5) * 14;
    px[i] += n; px[i + 1] += n * 0.7; px[i + 2] += n * 0.45;
  }
  ctx.putImageData(img, 0, 0);
  bctx.fillStyle = '#808080'; bctx.fillRect(0, 0, S, S);
  // needle holes along the stitch line (the thread itself is real geometry, see flapStitches)
  const inset = 0.09;
  const [tl, tr, br, bl] = poly;
  const pts = [[tr[0] - inset, tr[1]], [br[0] - inset, br[1] + inset], [bl[0] + inset, bl[1] + inset], [tl[0] + inset, tl[1]]].map(P);
  for (const [ctx2, colour, w] of [[ctx, 'rgba(60,24,6,.35)', 7], [bctx, '#5a5a5a', 8]]) {
    ctx2.strokeStyle = colour; ctx2.lineWidth = w; ctx2.setLineDash([22, 14]); ctx2.lineCap = 'round';
    ctx2.beginPath(); ctx2.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx2.lineTo(...p); ctx2.stroke();
  }
  // blind deboss D/F
  const [dx, dy] = P(debossAt);
  const fs = 0.26 * sy;
  for (const [ctx2, colour] of [[ctx, 'rgba(70,30,10,.38)'], [bctx, '#3a3a3a']]) {
    ctx2.setLineDash([]); ctx2.fillStyle = colour; ctx2.font = `300 ${fs}px ${SERIF}`; ctx2.textBaseline = 'middle';
    ctx2.fillText('D', dx, dy); const wD = ctx2.measureText('D').width;
    ctx2.fillText('F', dx + wD + fs * 0.42, dy);
    ctx2.strokeStyle = colour; ctx2.lineWidth = fs * 0.05;
    ctx2.beginPath(); ctx2.moveTo(dx + wD + fs * 0.05, dy + fs * 0.42); ctx2.lineTo(dx + wD + fs * 0.36, dy - fs * 0.42); ctx2.stroke();
  }
  // the glaze: a soft, uneven sheen (lower roughness where the calf has been burnished)
  const [g, gctx] = canvas(512, 512);
  gctx.fillStyle = '#7a7a7a'; gctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, rad = 30 + r() * 120;
    const gr = gctx.createRadialGradient(x, y, 0, x, y, rad);
    const v = r() < 0.5 ? '40,40,40' : '170,170,170';
    gr.addColorStop(0, `rgba(${v},.22)`); gr.addColorStop(1, `rgba(${v},0)`);
    gctx.fillStyle = gr; gctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return { map: tex(c, 1, true), bump: tex(b), rough: tex(g) };
}

// Saddle stitches as real geometry: short cream threads, slightly slanted, along a polyline.
const STITCH_PITCH = 0.036; // 7 stitches per inch
function stitchesAlong(points, z, threadMat) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, at: total }); total += len;
  }
  const count = Math.floor(total / STITCH_PITCH);
  const mesh = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.0065, 0.019, 3, 6), threadMat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  let k = 0;
  for (let n = 0; n < count; n++) {
    const d = (n + 0.5) * STITCH_PITCH;
    const sg = segs.find((x) => d >= x.at && d <= x.at + x.len) || segs[segs.length - 1];
    const t = (d - sg.at) / sg.len;
    const x = sg.a[0] + (sg.b[0] - sg.a[0]) * t, y = sg.a[1] + (sg.b[1] - sg.a[1]) * t;
    const ang = Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0]);
    e.set(0, 0, ang - Math.PI / 2 + 0.22); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, y, z), q, one);
    mesh.setMatrixAt(k++, m);
  }
  mesh.castShadow = false;
  return mesh;
}

function brassPlate() {
  const [c, ctx] = canvas(1024, 512);
  ctx.scale(2, 2);
  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0, '#e6c98d'); g.addColorStop(0.45, BRASS); g.addColorStop(1, '#a8823f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = 'rgba(80,55,20,.75)'; ctx.lineWidth = 6; ctx.strokeRect(34, 34, 444, 188);
  ctx.fillStyle = 'rgba(70,48,18,.9)'; ctx.font = `400 128px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('D', 196, 136); ctx.fillText('F', 326, 136);
  ctx.strokeStyle = 'rgba(70,48,18,.9)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(240, 186); ctx.lineTo(282, 84); ctx.stroke();
  return tex(c, 1, true);
}

function shadowTexture() {
  const [c, ctx] = canvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(0.55, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// A polygon outline with rounded corners (one radius per corner), as a Shape.
function roundedPoly(points, radii) {
  const s = new THREE.Shape();
  const n = points.length;
  const v = (p) => new THREE.Vector2(p[0], p[1]);
  for (let i = 0; i < n; i++) {
    const p = v(points[i]), prev = v(points[(i - 1 + n) % n]), next = v(points[(i + 1) % n]);
    const a = p.clone().add(prev.clone().sub(p).normalize().multiplyScalar(radii[i]));
    const b = p.clone().add(next.clone().sub(p).normalize().multiplyScalar(radii[i]));
    if (i === 0) s.moveTo(a.x, a.y); else s.lineTo(a.x, a.y);
    s.quadraticCurveTo(p.x, p.y, b.x, b.y);
  }
  s.closePath();
  return s;
}

function roundedTrapezoid(inset, r) {
  const s = new THREE.Shape();
  const bx = halfW(0) - inset, tx = halfW(H) - inset, y0 = inset, y1 = H - inset;
  s.moveTo(-bx + r, y0); s.lineTo(bx - r, y0); s.quadraticCurveTo(bx, y0, bx, y0 + r);
  s.lineTo(tx, y1 - r); s.quadraticCurveTo(tx, y1, tx - r, y1);
  s.lineTo(-tx + r, y1); s.quadraticCurveTo(-tx, y1, -tx, y1 - r);
  s.lineTo(-bx, y0 + r); s.quadraticCurveTo(-bx, y0, -bx + r, y0);
  return s;
}

// Where each part travels in the exploded view (bag units), and its slight turn.
const EXPLODE = {
  body: { p: [0, 0, 0] },
  flap: { p: [0, 1.0, 1.5], rx: -0.28 },
  clasp: { p: [0, 0.15, 2.9] },
  zip: { p: [0, -0.35, 1.1] },
  handle: { p: [0, 1.7, 0.35] },
  strap: { p: [0, 2.7, -0.45] },
  sleeve: { p: [0, 0, -1.8] },
  feet: { p: [0, -0.9, 0] },
};

// Hands control back to the browser for a frame, so a long build never freezes the page.
const breathe = () => new Promise((r) => requestAnimationFrame(() => r()));

async function buildBag() {
  const bag = new THREE.Group();
  const parts = {};
  for (const k of Object.keys(EXPLODE)) { parts[k] = new THREE.Group(); bag.add(parts[k]); }
  const put = (k, mesh) => { parts[k].add(mesh); return mesh; };

  // Noir pebbled calf: a 1K pebble field; the tops of the pebbles are polished by use, so the
  // roughness map follows the height (high = smoother).
  const pebble = pebbleHeight(1024, 9000, 3);
  const noirNormal = tex(normalFromHeight(pebble, 3.6), 2);
  const [rc, rctx] = canvas(1024, 1024);
  rctx.filter = 'invert(1) contrast(0.4) brightness(1.25)'; rctx.drawImage(pebble, 0, 0);
  const noirRough = tex(rc, 2);
  await breathe();
  const noir = new THREE.MeshPhysicalMaterial({ color: NOIR, roughness: 0.9, roughnessMap: noirRough, normalMap: noirNormal, normalScale: new THREE.Vector2(1.1, 1.1), clearcoat: 0.12, clearcoatRoughness: 0.55, sheen: 0.3, sheenColor: new THREE.Color('#2c2b2a'), sheenRoughness: 0.55 });
  // Cognac box calf: a very fine grain under a glaze.
  const fine = tex(normalFromHeight(pebbleHeight(512, 7000, 11), 1.0), 4);
  await breathe();
  const cognacSide = new THREE.MeshPhysicalMaterial({ color: COGNAC, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.3, normalMap: fine, normalScale: new THREE.Vector2(0.22, 0.22), sheen: 0.25, sheenColor: new THREE.Color('#ffb27a'), sheenRoughness: 0.4 });
  // Light-gold PVD brass, brushed: anisotropic highlights that streak along the grain.
  const brass = new THREE.MeshPhysicalMaterial({ color: BRASS, metalness: 1, roughness: 0.22, anisotropy: 0.7, anisotropyRotation: 0, clearcoat: 0.3, clearcoatRoughness: 0.15 });
  const thread = new THREE.MeshStandardMaterial({ color: '#efe2c8', roughness: 0.7 });
  // One dark trim for piping, tabs, zip tapes, the top slot and the back welts.
  const darkTrim = new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.62 });
  const edge = darkTrim;

  // Body: a softly bevelled trapezoid prism.
  const bodyGeo = new THREE.ExtrudeGeometry(roundedTrapezoid(BEVEL, 0.1), { depth: D - BEVEL * 2, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 5, curveSegments: 10 });
  bodyGeo.translate(0, 0, -(D - BEVEL * 2) / 2);
  put('body', new THREE.Mesh(bodyGeo, noir));

  // Front flap, cut on the 15° line. Thick box calf with rounded edges that overhang the body a
  // little; it stands clear of the body's face so the two never share a plane.
  const zF = D / 2 + 0.014, inset = 0.005, FT = 0.05, FB = 0.03;
  const yTop = H - 0.06;
  const xl = -halfW(flapY(-2)) + inset, xr = halfW(flapY(2)) - inset;
  const poly = [[-halfW(yTop) + inset, yTop], [halfW(yTop) - inset, yTop], [xr, flapY(xr)], [xl, flapY(xl)]];
  // softly rounded lower corners, as on the real flap; the top corners only just eased
  const shape = roundedPoly(poly, [0.05, 0.05, 0.16, 0.16]);
  const flapGeo = new THREE.ExtrudeGeometry(shape, { depth: FT, bevelEnabled: true, bevelThickness: FB, bevelSize: FB, bevelSegments: 5, curveSegments: 8 });
  const bbox = { x0: -2.25, x1: 2.25, y0: 0.6, y1: 3.15 };
  flapGeo.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 === 0 ? (v - bbox.x0) / (bbox.x1 - bbox.x0) : (v - bbox.y0) / (bbox.y1 - bbox.y0); });
  const face = flapFace(poly, bbox, [-1.69, 2.52]);
  await breathe();
  face.map.wrapS = face.map.wrapT = face.bump.wrapS = face.bump.wrapT = THREE.ClampToEdgeWrapping;
  const flapMat = new THREE.MeshPhysicalMaterial({ map: face.map, bumpMap: face.bump, bumpScale: 0.6, roughness: 0.5, roughnessMap: face.rough, clearcoat: 0.36, clearcoatRoughness: 0.38, sheen: 0.2, sheenColor: new THREE.Color('#ffb27a'), sheenRoughness: 0.45 });
  // the painted edge shares the cognac leather's feature set, so it reuses the same shader program
  const flapEdge = new THREE.MeshPhysicalMaterial({ color: '#7c3916', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, normalMap: cognacSide.normalMap, normalScale: new THREE.Vector2(0.22, 0.22), sheen: 0.2, sheenColor: new THREE.Color('#ffb27a'), sheenRoughness: 0.4 });
  const flap = new THREE.Mesh(flapGeo, [flapMat, flapEdge]);
  flap.position.z = zF;
  put('flap', flap);
  const flapFront = zF + FT + FB;
  {
    const i = 0.09, [tl, tr, br, bl] = poly;
    const path = [[tr[0] - i, tr[1] - 0.02], [br[0] - i, br[1] + i * 1.1], [bl[0] + i, bl[1] + i * 1.1], [tl[0] + i, tl[1] - 0.02]];
    put('flap', stitchesAlong(path, flapFront + 0.004, thread));
  }

  // The flap wraps the front edge in a thick rounded fold, then runs a short way over the top.
  const fold = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, W_TOP - 0.2, 8, 28), cognacSide);
  fold.rotation.z = Math.PI / 2; fold.position.set(0, H - 0.035, D / 2 - 0.005); put('flap', fold);
  const topDepth = 0.3;
  const top = new THREE.Mesh(new THREE.BoxGeometry(W_TOP - 0.02, 0.05, topDepth), cognacSide);
  top.position.set(0, H + 0.035, D / 2 - topDepth / 2); put('flap', top);
  const topEdge = new THREE.Mesh(new THREE.BoxGeometry(W_TOP - 0.02, 0.052, 0.012), flapEdge);
  topEdge.position.set(0, H + 0.035, D / 2 - topDepth - 0.004); put('flap', topEdge);

  // The black top: the 350 mm top zip runs between the two handles (tech pack p.3).
  const slot = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.012, 0.07), darkTrim);
  slot.position.set(0, H + 0.008, -0.02); put('body', slot);
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(3.44, 0.01, 0.02), brass);
  teeth.position.set(0, H + 0.016, -0.02); put('body', teeth);
  const topPull = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.045), brass);
  topPull.position.set(0.66, H + 0.03, -0.02); put('body', topPull);

  // 3 mm piping around the front and back panels, and the concealed expansion zip down each side.
  const piping = darkTrim;
  const outline = roundedTrapezoid(-0.006, 0.17).getPoints(24).map((p) => new THREE.Vector3(p.x, p.y, 0));
  for (const z of [D / 2 - BEVEL * 0.45, -(D / 2 - BEVEL * 0.45)]) {
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outline, true), 240, 0.018, 8, true), piping);
    pipe.position.z = z; put('body', pipe);
  }
  const lean = Math.atan((W_BASE - W_TOP) / 2 / H);
  for (const sgn of [-1, 1]) {
    const gz = new THREE.Mesh(new THREE.BoxGeometry(0.012, H - 0.36, 0.03), darkTrim);
    gz.position.set(sgn * (halfW(H / 2) + 0.004), H / 2, 0); gz.rotation.z = sgn * lean; put('body', gz);
  }

  // The clasp tab hangs square to the 15° cut, so it leans with it; the 47 × 20 mm engraved plate
  // sits parallel to the cut, its centre about 100 mm above the base (tech pack p.2 and p.7).
  const tabX = 0.06;
  const clasp = new THREE.Group();
  clasp.position.set(tabX, flapY(tabX), zF + 0.002); // tucked under the flap, emerging from its edge
  clasp.rotation.z = Math.atan(TAN15);
  const tabShape = new THREE.Shape();
  const tw = 0.2, tTop = 0.08, tBot = -0.7;
  tabShape.moveTo(-tw, tTop); tabShape.lineTo(-tw, tBot + tw); tabShape.quadraticCurveTo(-tw, tBot, 0, tBot);
  tabShape.quadraticCurveTo(tw, tBot, tw, tBot + tw); tabShape.lineTo(tw, tTop); tabShape.lineTo(-tw, tTop);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(tabShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3 }), [cognacSide, flapEdge]);
  clasp.add(tab);
  // cream topstitch around the tab
  const tabPath = new THREE.CatmullRomCurve3([[-tw + 0.055, tTop - 0.02], [-tw + 0.055, tBot + tw], [0, tBot + 0.055], [tw - 0.055, tBot + tw], [tw - 0.055, tTop - 0.02]].map(([x, y]) => new THREE.Vector3(x, y, 0)));
  clasp.add(stitchesAlong(tabPath.getSpacedPoints(40).map((p) => [p.x, p.y]), 0.046, thread));
  const plateFace = new THREE.MeshPhysicalMaterial({ map: brassPlate(), metalness: 1, roughness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.15 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.2, 0.045), [brass, brass, brass, brass, plateFace, brass]);
  plate.position.set(0, -0.34, 0.068);
  clasp.add(plate);
  put('clasp', clasp);

  // Front quick-access pocket: a 340 mm #5 zip about 50 mm above the base, just under the clasp
  // tab, its pull at the right (the 75 mm dimension on p.2 is the flap's low corner).
  const zipY = 0.5;
  const tape = new THREE.Mesh(new THREE.BoxGeometry(3.42, 0.065, 0.006), darkTrim);
  tape.position.set(0, zipY, D / 2 + 0.006); put('zip', tape);
  const TEETH = 112;
  const teethMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.03, 0.012), brass, TEETH);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < TEETH; i++) {
    m4.makeTranslation(-1.68 + (3.36 * i) / (TEETH - 1), zipY + (i % 2 ? 0.009 : -0.009), D / 2 + 0.014);
    teethMesh.setMatrixAt(i, m4);
  }
  put('zip', teethMesh);
  const pull = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.34, 0.028), cognacSide);
  pull.position.set(1.26, zipY - 0.14, D / 2 + 0.03); put('zip', pull);
  const pullCap = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.06, 0.036), brass);
  pullCap.position.set(1.26, zipY + 0.01, D / 2 + 0.03); put('zip', pullCap);

  // Two rolled handles over a rope core, 140 mm apart centre to centre with an 80 mm drop, each
  // on its own cognac keepers with a 9 mm rivet (tech pack p.2 and p.3).
  for (const z of [0.14, -0.17]) {
    const hc = new THREE.CatmullRomCurve3([[-0.7, H + 0.1], [-0.74, H + 0.42], [-0.52, H + 0.78], [0, H + 0.88], [0.52, H + 0.78], [0.74, H + 0.42], [0.7, H + 0.1]].map(([x, y]) => new THREE.Vector3(x, y, z)));
    put('handle', new THREE.Mesh(new THREE.TubeGeometry(hc, 90, 0.07, 22, false), cognacSide));
    for (const x of [-0.7, 0.7]) {
      const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.17), cognacSide);
      keeper.position.set(x, H + 0.05, z); put('handle', keeper);
      const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), brass);
      rivet.position.set(x + (x < 0 ? -0.06 : 0.06), H + 0.1, z); put('handle', rivet);
    }
  }

  // Side rings: 20 mm ID on noir calf tabs at the top corners, facing forward.
  const ringY = 2.97, ringX = halfW(ringY) + 0.1;
  for (const sgn of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.017, 12, 36), brass);
    ring.position.set(sgn * ringX, ringY, 0); put('body', ring);
    const sideTab = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.62, 0.15), piping);
    sideTab.position.set(sgn * (halfW(2.6) + 0.018), 2.6, 0); sideTab.rotation.z = sgn * lean; put('body', sideTab);
    const loop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.15), piping);
    loop.position.set(sgn * (ringX - 0.06), ringY - 0.1, 0); put('body', loop);
  }

  // Padded shoulder strap: round in section, sweeping up in a smooth curve and dropping straight
  // into a 20 mm swivel snap hook at each end, with an oval cognac pad and a 32 mm slide buckle.
  const hookLen = 0.3, sA = ringX, sY0 = ringY + 0.115 + hookLen, sRise = 1.65;
  const strapAt = (t) => new THREE.Vector3(sA * Math.sin(t), sY0 + sRise * Math.cos(t), 0);
  const strapCurve = new THREE.CatmullRomCurve3(Array.from({ length: 61 }, (_, i) => strapAt(-Math.PI / 2 + (Math.PI * i) / 60)));
  put('strap', new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 160, 0.055, 16, false), noir));
  const padCurve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => strapAt(-0.32 + (0.64 * i) / 12)));
  const pad = new THREE.Mesh(new THREE.TubeGeometry(padCurve, 40, 0.09, 18, false), cognacSide);
  pad.scale.z = 0.8; put('strap', pad);
  for (const t of [-0.32, 0.32]) {
    const end = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), cognacSide);
    end.position.copy(strapAt(t)); end.scale.z = 0.8; put('strap', end);
  }
  const bt = 0.95, bp = strapAt(bt);
  const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 4), brass);
  buckle.position.copy(bp); buckle.rotation.set(0, Math.PI / 2, -bt + Math.PI / 4); put('strap', buckle);
  for (const sgn of [-1, 1]) {
    const hook = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, hookLen - 0.1, 6, 12), brass);
    hook.position.set(sgn * sA, ringY + 0.115 + hookLen / 2, 0); put('strap', hook);
    const swivel = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 20), brass);
    swivel.position.set(sgn * sA, sY0 + 0.01, 0); swivel.rotation.y = Math.PI / 2; put('strap', swivel);
  }

  // Trolley pass-through across the back, standing clear of the body.
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(W_BASE - 0.16, 1.2, 0.04), noir);
  sleeve.position.set(0, 1.5, -D / 2 - 0.03); put('sleeve', sleeve);
  for (const y of [0.92, 2.08]) {
    const welt = new THREE.Mesh(new THREE.BoxGeometry(W_BASE - 0.16, 0.025, 0.03), edge);
    welt.position.set(0, y, -D / 2 - 0.065); put('sleeve', welt);
  }

  // Brass feet.
  for (const x of [-1.8, 1.8]) for (const z of [-0.35, 0.35]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), brass);
    foot.scale.y = 0.45; foot.position.set(x, -0.01, z); put('feet', foot);
  }

  bag.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Label anchors for the exploded view, in each part's own space.
  const anchors = [
    ['flap', new THREE.Vector3(-2.05, 2.85, flapFront)],
    ['clasp', new THREE.Vector3(0.3, flapY(0.3) - 0.34, flapFront + 0.12)],
    ['handle', new THREE.Vector3(0.62, H + 0.82, 0.14)],
    ['strap', new THREE.Vector3(1.4, sY0 + sRise * 0.77, 0)],
    ['body', new THREE.Vector3(-halfW(0.35), 0.35, D / 2)],
    ['sleeve', new THREE.Vector3(halfW(1.5) - 0.2, 1.5, -D / 2 - 0.05)],
  ];

  function setExplode(e) {
    const k = e * e * (3 - 2 * e);
    for (const [name, g] of Object.entries(parts)) {
      const { p, rx = 0 } = EXPLODE[name];
      g.position.set(p[0] * k, p[1] * k, p[2] * k);
      g.rotation.x = rx * k;
    }
  }
  return { bag, parts, anchors, setExplode };
}

// Gold dust: soft additive points in a deep volume, drifting slowly upwards. The drift runs in the
// vertex shader, so the processor does no per-frame work for it.
function goldDust(count) {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,236,190,1)'); g.addColorStop(0.25, 'rgba(240,196,120,.55)'); g.addColorStop(1, 'rgba(240,196,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  const r = rng(42);
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (r() - 0.5) * 18; pos[i * 3 + 1] = (r() - 0.35) * 11; pos[i * 3 + 2] = (r() - 0.6) * 14;
    seed[i] = r() * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uMap: { value: new THREE.CanvasTexture(c) }, uSize: { value: 0.13 }, uScale: { value: 400 } },
    vertexShader: `
      attribute float seed;
      uniform float uTime, uSize, uScale;
      varying float vNear;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.13 + seed) * 0.35;
        p.y = mod(p.y + uTime * (0.04 + fract(seed) * 0.05) + 4.0, 11.0) - 4.0;
        p.z += cos(uTime * 0.11 + seed) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        // specks right in front of the lens fade out and never swell into blobs
        vNear = smoothstep(2.0, 5.0, -mv.z);
        gl_PointSize = min(uSize * uScale / -mv.z, 18.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uMap;
      varying float vNear;
      void main() {
        vec4 t = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(vec3(1.0, 0.85, 0.63) * t.rgb, t.a * 0.85 * vNear);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.tick = (t) => { mat.uniforms.uTime.value = t; };
  points.userData.setScale = (px) => { mat.uniforms.uScale.value = px; };
  return points;
}

// A polished black-lacquer floor: a real mirror, tinted espresso, that fades to nothing towards
// its edges so it melts into the stage without a horizon line.
const LacquerShader = {
  name: 'LacquerShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    strength: { value: 0.42 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vLocal;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      vLocal = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float strength;
    varying vec4 vUv;
    varying vec2 vLocal;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec4 base = texture2DProj( tDiffuse, vUv );
      float d = distance( vLocal, vec2( 0.5 ) );
      float a = smoothstep( 0.5, 0.06, d ) * strength;
      gl_FragColor = vec4( base.rgb * color, a );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

// A photographer's studio for reflections: a dark room with a large warm softbox overhead-left,
// two tall strip lights for the rims, a low bounce card, and a faint warm floor. Rendered once
// into an HDR environment map, it gives leather and brass long, clean highlights.
function studioEnvironment() {
  const room = new THREE.Scene();
  room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 18, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.018, 0.014, 0.011), side: THREE.BackSide })));
  const panel = (w, h, rgb, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); room.add(m);
  };
  panel(9, 6, [2.9, 2.55, 2.15], [-5, 8, 5], [0, 0, 0]);  // key softbox, warm
  panel(1.4, 9, [2.4, 2.3, 2.2], [-9, 2, -3], [0, 1, 0]); // left strip (rim)
  panel(1.4, 9, [2.6, 2.4, 2.1], [9, 2, -2], [0, 1, 0]);  // right strip (rim)
  panel(8, 2.5, [0.9, 0.7, 0.5], [3, -1, 9], [0, 1, 0]);  // low bounce card, front right
  panel(20, 20, [0.12, 0.08, 0.05], [0, -6, 0], [0, 0, 0]); // warm floor
  return room;
}

export async function createTaglioScene(canvasEl) {
  // The scene (and the mirror's reflection pass) render into an off-screen buffer; a final pass
  // tone-maps it to the screen. Both passes then share one set of shader programs, which halves
  // the compile work. The buffer is multisampled, so the canvas itself needs no antialiasing.
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: false, alpha: true, powerPreference: 'high-performance' });
  // A fixed resolution (up to 1.5×): changing it mid-scroll would re-allocate the canvas and hitch.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Khronos PBR Neutral: made for product display, it keeps the cognac and the brass true to colour.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Shadows are only recomputed when the bag moves (see render), not on every frame.
  renderer.shadowMap.autoUpdate = false;

  await breathe();
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studioEnvironment(), 0.02).texture;
  scene.environmentIntensity = 0.8;

  // Warm key from high left, a cool rim behind, a low warm fill: a dark studio.
  const key = new THREE.DirectionalLight('#ffe6c4', 2.4);
  key.position.set(-5, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 3;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -3.4, right: 3.4, top: 4.2, bottom: -2.6, near: 2, far: 22 });
  scene.add(key);
  const rim = new THREE.DirectionalLight('#bcd2ff', 1.6); rim.position.set(6, 4, -6); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#3a2e24', '#0c0b0a', 0.6));
  const fill = new THREE.DirectionalLight('#ffd7a8', 0.9); fill.position.set(5, 1.5, 7); scene.add(fill);

  const stage = new THREE.Group();
  await breathe();
  const { bag, parts, anchors, setExplode } = await buildBag();
  bag.position.y = -2.0;
  stage.add(bag);
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const dust = goldDust(narrow ? 260 : 520);
  scene.add(dust);
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  floorShadow.rotation.x = -Math.PI / 2; floorShadow.position.y = -2.036;
  scene.add(floorShadow);
  const mirrorScale = narrow ? 0.18 : 0.26; // lacquer reflections are soft, so a small buffer is enough
  const mirror = new Reflector(new THREE.PlaneGeometry(16, 16), {
    shader: LacquerShader, color: new THREE.Color('#b89a80'), clipBias: 0.003,
    textureWidth: Math.round(canvasEl.clientWidth * mirrorScale) || 512, textureHeight: Math.round(canvasEl.clientHeight * mirrorScale) || 512,
  });
  mirror.material.transparent = true; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = -2.042;
  scene.add(mirror);
  // The reflection pass is the costliest part of a frame, so it refreshes every other frame;
  // at the mirror's softness the difference cannot be seen, and scrolling stays at full rate.
  const reflect = mirror.onBeforeRender;
  let mirrorTick = 0;
  mirror.onBeforeRender = function (...args) { if (mirrorTick++ % 2 === 0) reflect.apply(this, args); };
  scene.add(stage);

  const camera = new THREE.PerspectiveCamera(28, 1, 0.5, 60);
  const buffer = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: buffer.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    depthTest: false, depthWrite: false, toneMapped: true,
  }));
  post.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(post);
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const target = new THREE.Vector3();

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvasEl;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    buffer.setSize(Math.round(w * renderer.getPixelRatio()), Math.round(h * renderer.getPixelRatio()));
    camera.aspect = w / h; camera.updateProjectionMatrix();
    mirror.getRenderTarget().setSize(Math.round(w * mirrorScale), Math.round(h * mirrorScale));
    dust.userData.setScale(h * renderer.getPixelRatio() * 0.5); // same attenuation as PointsMaterial
    renderer.shadowMap.needsUpdate = true;
  }

  // pose: { rotY, rotX, dist, ty, x, explode } — the stage turns, the camera dollies, the bag
  // slides and comes apart. pointer: {x, y} in -1…1 for parallax. t: seconds, for the dust.
  // Returns the label anchors in canvas pixels.
  const v = new THREE.Vector3();
  let lastKey = '';
  function render(pose, pointer = { x: 0, y: 0 }, t = 0) {
    const key = [pose.rotY, pose.rotX, pose.x, pose.explode, pointer.x, pointer.y].map((n) => (n || 0).toFixed(4)).join();
    if (key !== lastKey) { renderer.shadowMap.needsUpdate = true; lastKey = key; }
    setExplode(pose.explode || 0);
    stage.rotation.set(pose.rotX + pointer.y * 0.05, pose.rotY + pointer.x * 0.12, 0);
    stage.position.x = pose.x;
    floorShadow.position.x = pose.x;
    floorShadow.scale.set(1 - Math.abs(Math.sin(pose.rotY)) * 0.55, 1, 1);
    floorShadow.material.opacity = 1 - (pose.explode || 0) * 0.6;
    dust.userData.tick(t);
    target.set(0, pose.ty, 0);
    camera.position.set(pointer.x * 0.9, pose.ty + pose.dist * 0.16 - pointer.y * 0.5, pose.dist);
    camera.lookAt(target);
    renderer.setRenderTarget(buffer);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
    const { clientWidth: w, clientHeight: h } = canvasEl;
    const toScreen = (vec) => ({ x: (vec.x * 0.5 + 0.5) * w, y: (-vec.y * 0.5 + 0.5) * h });
    const out = anchors.map(([name, local]) => toScreen(v.copy(local).applyMatrix4(parts[name].matrixWorld).project(camera)));
    out.center = toScreen(v.set(pose.x, -0.4, 0).project(camera));
    return out;
  }

  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      for (const m of o.material ? [].concat(o.material) : []) { for (const k of Object.keys(m)) if (m[k]?.isTexture) m[k].dispose(); m.dispose(); }
    });
    pmrem.dispose();
    mirror.dispose();
    buffer.dispose();
    post.geometry.dispose(); post.material.dispose();
    renderer.dispose();
  }

  // Compile every shader (for the screen and for the mirror's reflection pass) and upload the
  // textures in the background, so the first frame never freezes the page. Uses the browser's
  // parallel shader compilation where available.
  async function warm() {
    scene.traverse((o) => {
      for (const m of o.material ? [].concat(o.material) : []) for (const k of Object.keys(m)) if (m[k]?.isTexture) renderer.initTexture(m[k]);
    });
    renderer.setRenderTarget(buffer);
    await renderer.compileAsync(scene, camera);
    renderer.setRenderTarget(null);
    await renderer.compileAsync(postScene, postCamera);
  }

  if (import.meta.env.DEV) window.__df = { renderer, scene, mirror, key, dust, camera };
  resize();
  return { render, resize, dispose, warm };
}
