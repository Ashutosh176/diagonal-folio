// Builds responsive, high-quality WebP variants (plus a full-size JPEG fallback)
// from assets/originals into client/public/img, and writes a manifest the
// client uses to build srcset attributes.
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets', 'originals');
const OUT = path.join(root, 'client', 'public', 'img');
const MANIFEST = path.join(root, 'client', 'src', 'data', 'images.json');
const WIDTHS = [640, 1080, 1600, 2400];

await mkdir(OUT, { recursive: true });
await mkdir(path.dirname(MANIFEST), { recursive: true });

const manifest = {};
for (const file of (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
  const name = file.replace(/\.[^.]+$/, '');
  const input = sharp(path.join(SRC, file));
  const { width, height } = await input.metadata();
  const widths = [...new Set(WIDTHS.filter((w) => w < width).concat(width))];

  for (const w of widths) {
    await sharp(path.join(SRC, file))
      .resize({ width: w })
      .webp({ quality: 88, smartSubsample: true, effort: 5 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  await sharp(path.join(SRC, file))
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(path.join(OUT, `${name}.jpg`));

  manifest[name] = { w: width, h: height, widths };
  console.log(`✓ ${name}  ${width}×${height}  → ${widths.join(', ')}`);
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${Object.keys(manifest).length} images written to client/public/img`);
