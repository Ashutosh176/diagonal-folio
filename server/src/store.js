// Minimal JSON-file persistence. Swap for a real database when the store goes live.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// On Vercel the deployment is read-only, so records go to the function's temporary /tmp: fine
// for a preview, but they do not persist. Use a real database before taking live orders.
const DATA_DIR = process.env.VERCEL
  ? '/tmp/df-data'
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const queues = new Map();

async function read(name) {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, `${name}.json`), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

// Serialise writes per collection so concurrent requests don't clobber each other.
export function append(name, record) {
  const prev = queues.get(name) || Promise.resolve();
  const next = prev.then(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const rows = await read(name);
    rows.push(record);
    await writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(rows, null, 2));
    return record;
  });
  queues.set(name, next.catch(() => {}));
  return next;
}

export async function find(name, predicate) {
  return (await read(name)).find(predicate);
}
