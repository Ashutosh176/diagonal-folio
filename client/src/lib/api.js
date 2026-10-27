export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Please try again.');
    err.fields = data.fields || {};
    throw err;
  }
  return data;
}

export const formatINR = (n) => (n == null ? '' : `₹ ${Math.round(n).toLocaleString('en-IN')}`);
