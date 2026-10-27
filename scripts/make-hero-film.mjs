// Builds the home-page hero film from the product renders in assets/originals.
// Five slow shots, Taglio then Cadre: the gold monogram, the Taglio clasp, the Taglio,
// the Cadre slash-lock and the Cadre. Each shot drifts or pushes in, a soft light sweep
// at 15° crosses the brass, and the cut is graded warm with a vignette and fine grain.
// Writes client/public/video/hero-{wide,tall}.mp4 plus a poster JPEG for each.
//
//   node scripts/make-hero-film.mjs          (needs ffmpeg on PATH)
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets', 'originals');
const OUT = path.join(root, 'client', 'public', 'video');
const FPS = 25;
const FADE = 0.9; // cross-fade between shots, seconds

// Plates are rendered at 2× the output size so the slow moves stay smooth.
const FORMATS = {
  wide: { W: 1920, H: 1080, crf: 23 },
  tall: { W: 1080, H: 1920, crf: 24 },
};

// cx/cy: where the camera looks, as fractions of the plate, from → to.
// z: zoom from → to. sweep: [start, end] seconds of the light sweep, if any.
// grade: extra filters for the studio close-ups, which are lit brighter than the mood shots.
const SHOTS = [
  { plate: 'monogram', dur: 4.2, z: [1.12, 1.0], cx: [0.5, 0.5], cy: [0.5, 0.5], sweep: [0.9, 3.4] },
  { plate: 'clasp', dur: 3.6, z: [1.1, 1.16], cx: [0.44, 0.56], cy: [0.53, 0.47], sweep: [0.6, 2.9], grade: 'eq=gamma=0.8:contrast=1.08:saturation=1.15,colorbalance=rm=0.06:gm=0.01:bm=-0.08:rh=0.04:bh=-0.05' },
  { plate: 'taglio', dur: 4.6, z: [1.0, 1.08], cx: [0.5, 0.52], cy: [0.5, 0.48] },
  { plate: 'lock', dur: 3.6, z: [1.14, 1.08], cx: [0.56, 0.46], cy: [0.47, 0.53], sweep: [0.5, 2.8], grade: 'eq=gamma=0.8:contrast=1.08:saturation=1.15,colorbalance=rm=0.06:gm=0.01:bm=-0.08:rh=0.04:bh=-0.05' },
  { plate: 'cadre', dur: 4.8, z: [1.0, 1.08], cx: [0.5, 0.52], cy: [0.5, 0.48] },
];

const file = (name) => path.join(SRC, `${name}.jpg`);

// A crop of `name` around (fx, fy) with the plate's aspect ratio, as large as fits.
async function cropAround(name, fx, fy, PW, PH, scale = 1) {
  const img = sharp(file(name));
  const { width, height } = await img.metadata();
  let cw = width / scale, ch = (cw * PH) / PW;
  if (ch > height / scale) { ch = height / scale; cw = (ch * PW) / PH; }
  const left = Math.round(Math.min(Math.max(fx * width - cw / 2, 0), width - cw));
  const top = Math.round(Math.min(Math.max(fy * height - ch / 2, 0), height - ch));
  return img.extract({ left, top, width: Math.round(cw), height: Math.round(ch) }).resize(PW, PH, { kernel: 'lanczos3' });
}

// A square studio render set into the plate. The studio is extended from the render's own
// empty left and right edges (wall above, floor below), blended across the frame, and the
// sharp square fades into it at its borders, so there is no seam and no ghost of the bag.
async function bagPlate(name, PW, PH, wide) {
  const side = wide ? PH : PW;
  const cx = wide ? 0.63 : 0.5, cy = wide ? 0.5 : 0.54;
  const top = Math.round(cy * PH - side / 2), left = Math.round(cx * PW - side / 2);
  const { width, height } = await sharp(file(name)).metadata();
  const edge = (x) => sharp(file(name)).extract({ left: x, top: 0, width: 24, height }).resize(1, side, { fit: 'fill' }).raw().toBuffer();
  const [l, r] = await Promise.all([edge(0), edge(width - 24)]);
  const cols = Buffer.alloc(side * 2 * 3);
  for (let y = 0; y < side; y++) { l.copy(cols, y * 6, y * 3, y * 3 + 3); r.copy(cols, y * 6 + 3, y * 3, y * 3 + 3); }
  const bg = await sharp(cols, { raw: { width: 2, height: side, channels: 3 } })
    .resize(PW, side, { fit: 'fill', kernel: 'linear' })
    .extend({ top, bottom: PH - side - top, extendWith: 'copy' })
    .blur(6).png().toBuffer();
  const feather = Math.round(side * 0.1);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}"><defs>
      <linearGradient id="h"><stop offset="0" stop-color="#000"/><stop offset="${feather / side}" stop-color="#fff"/><stop offset="${1 - feather / side}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="v" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="${feather / side}" stop-color="#fff"/><stop offset="${1 - feather / side}" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="m"><rect width="100%" height="100%" fill="url(#v)"/></mask></defs>
      <rect width="100%" height="100%" fill="url(#h)" mask="url(#m)"/></svg>`,
  );
  const alpha = await sharp(mask).resize(side, side).extractChannel(0).toBuffer();
  const fg = await sharp(file(name)).resize(side, side, { kernel: 'lanczos3' }).removeAlpha().joinChannel(alpha).png().toBuffer();
  return sharp(bg).composite([{ input: fg, left, top }]);
}

// The monogram for the tall cut: a strip around the D/F as wide as the frame, with the
// leather fading into shadow above and below.
async function tallMonogram(PW, PH) {
  const name = 'leather-noir-monogram';
  const { width, height } = await sharp(file(name)).metadata();
  const cw = Math.round(width * 0.54), left = Math.min(Math.round(width * 0.735 - cw / 2), width - cw);
  const h = Math.round((height * PW) / cw), pad = Math.max(0, PH - h);
  const strip = await sharp(file(name)).extract({ left, top: 0, width: cw, height }).resize(PW, h).toBuffer();
  // Pad with the tone of the strip's own top and bottom edges, faded in, so the leather
  // dissolves into shadow instead of repeating (a mirror would repeat the D/F).
  const tone = async (y) => {
    const { channels } = await sharp(strip).extract({ left: 0, top: y, width: PW, height: 40 }).stats();
    return channels.slice(0, 3).map((c) => Math.round(c.mean));
  };
  const [t, btm] = await Promise.all([tone(0), tone(h - 40)]);
  const top = Math.floor(pad / 2), fade = Math.round(h * 0.18);
  const rgb = (c) => `rgb(${c.join(',')})`;
  const veil = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><defs>
    <linearGradient id="a" x2="0" y2="1"><stop offset="0" stop-color="${rgb(t)}"/><stop offset="1" stop-color="${rgb(t)}" stop-opacity="0"/></linearGradient>
    <linearGradient id="b" x2="0" y2="1"><stop offset="0" stop-color="${rgb(btm)}" stop-opacity="0"/><stop offset="1" stop-color="${rgb(btm)}"/></linearGradient></defs>
    <rect y="${top}" width="${PW}" height="${fade}" fill="url(#a)"/><rect y="${top + h - fade}" width="${PW}" height="${fade}" fill="url(#b)"/></svg>`);
  return sharp({ create: { width: PW, height: PH, channels: 3, background: { r: t[0], g: t[1], b: t[2] } } })
    .composite([
      { input: { create: { width: PW, height: PH - top - h, channels: 3, background: { r: btm[0], g: btm[1], b: btm[2] } } }, left: 0, top: top + h },
      { input: strip, left: 0, top },
      { input: veil, left: 0, top: 0 },
    ]).png().toBuffer().then((buf) => sharp(buf));
}

async function makePlates(fmt, dir) {
  const { W, H } = FORMATS[fmt];
  const PW = W * 2, PH = H * 2, wide = fmt === 'wide';
  const plates = {
    monogram: wide ? await cropAround('leather-noir-monogram', 0.72, 0.42, PW, PH) : await tallMonogram(PW, PH),
    clasp: await cropAround('taglio-nc-05-clasp', 0.46, 0.6, PW, PH),
    taglio: await bagPlate('taglio-nc-07-mood', PW, PH, wide),
    lock: await cropAround('cadre-cg-05-lock', 0.52, 0.5, PW, PH),
    cadre: await bagPlate('cadre-cg-07-mood', PW, PH, wide),
  };
  for (const [k, p] of Object.entries(plates)) await p.removeAlpha().png({ compressionLevel: 3 }).toFile(path.join(dir, `${k}.png`));

  // The sweep: a soft band of light leaning 15° like the slash in D/F.
  // The canvas is widened by the lean so the skewed band is never clipped into a hard edge.
  const bw = Math.round(W * 0.3), bh = Math.round(H * 1.3), lean = Math.round(bh * Math.tan(Math.PI / 12));
  await sharp(Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bw + lean}" height="${bh}"><defs><linearGradient id="g">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff4dc" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient></defs><rect x="${lean}" width="${bw}" height="${bh}" fill="url(#g)" transform="skewX(-15)"/></svg>`,
  )).png().toFile(path.join(dir, 'sweep.png'));
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${args.join(' ')}`);
}

// Eased 0→1 progress over the shot, in zoompan's frame counter.
const ease = (n) => `(1-cos(PI*on/${n - 1}))/2`;
const lerp = ([a, b], n) => `(${a}+(${b - a})*${ease(n)})`;

function renderShot(fmt, dir, shot, i) {
  const { W, H } = FORMATS[fmt];
  const n = Math.round(shot.dur * FPS);
  const z = lerp(shot.z, n);
  const zp = `zoompan=z='${z}':x='${lerp(shot.cx, n)}*iw-iw/zoom/2':y='${lerp(shot.cy, n)}*ih-ih/zoom/2':d=1:s=${W}x${H}:fps=${FPS}`;
  const inputs = ['-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur), '-i', path.join(dir, `${shot.plate}.png`)];
  let graph = `[0:v]${zp},setsar=1${shot.grade ? ',' + shot.grade : ''},format=gbrp[base]`;
  if (shot.sweep) {
    const [s, e] = shot.sweep;
    inputs.push('-loop', '1', '-framerate', String(FPS), '-t', String(shot.dur), '-i', path.join(dir, 'sweep.png'));
    graph += `;color=black:s=${W}x${H}:r=${FPS}:d=${shot.dur}[blk];[1:v]format=rgba[band]` +
      `;[blk][band]overlay=x='-w+(W+w)*clip((t-${s})/${e - s},0,1)':y='(H-h)/2':eval=frame,format=gbrp[light]` +
      `;[base][light]blend=all_mode=screen:all_opacity=0.45,format=yuv444p[v]`;
  } else graph += ';[base]format=yuv444p[v]';
  ffmpeg([...inputs, '-filter_complex', graph, '-map', '[v]', '-frames:v', String(n), '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv444p', path.join(dir, `shot${i}.mp4`)]);
}

function assemble(fmt, dir) {
  const { crf } = FORMATS[fmt];
  const inputs = SHOTS.flatMap((_, i) => ['-i', path.join(dir, `shot${i}.mp4`)]);
  let graph = '', prev = '[0:v]', offset = 0;
  SHOTS.slice(1).forEach((_, k) => {
    offset += SHOTS[k].dur - FADE;
    const out = `[x${k}]`;
    graph += `${prev}[${k + 1}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}${out};`;
    prev = out;
  });
  const total = SHOTS.reduce((s, x) => s + x.dur, 0) - FADE * (SHOTS.length - 1);
  // Grade: deeper blacks, a touch warmer, vignette, fine moving grain; fade in and out of black so it loops.
  graph += `${prev}eq=contrast=1.06:saturation=0.94:gamma=0.97,colorbalance=rs=0.03:bs=-0.03:rh=0.02:bh=-0.02,` +
    `vignette=angle=PI/4.6,noise=alls=5:allf=t,fade=t=in:st=0:d=0.8,fade=t=out:st=${(total - 1).toFixed(2)}:d=1,format=yuv420p[v]`;
  const outFile = path.join(OUT, `hero-${fmt}.mp4`);
  ffmpeg([...inputs, '-filter_complex', graph, '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
    '-profile:v', 'high', '-movflags', '+faststart', outFile]);
  // Poster: the first shot at full brightness, for slow connections and reduced motion.
  ffmpeg(['-ss', '2.4', '-i', outFile, '-frames:v', '1', '-q:v', '3', path.join(OUT, `hero-${fmt}.jpg`)]);
  return total;
}

await mkdir(OUT, { recursive: true });
for (const fmt of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(FORMATS)) {
  const dir = path.join(root, 'assets', '.hero-build', fmt);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  console.log(`${fmt}: plates`);
  await makePlates(fmt, dir);
  SHOTS.forEach((s, i) => { console.log(`${fmt}: shot ${i + 1}/${SHOTS.length} (${s.plate})`); renderShot(fmt, dir, s, i); });
  const total = assemble(fmt, dir);
  await rm(dir, { recursive: true, force: true });
  console.log(`✓ client/public/video/hero-${fmt}.mp4  ${total.toFixed(1)} s`);
}
