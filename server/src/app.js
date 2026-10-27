import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { products, findProduct, PERSONALISATION } from './catalog.js';
import { append, find } from './store.js';

// The Express app, shared by the local server (index.js) and the Vercel function (api/index.js).
const app = express();
const EXPRESS_DELIVERY_INR = 1500; // keep in sync with client/src/config.js
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);

app.use(cors());
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---- Catalogue -------------------------------------------------------------
app.get('/api/products', (_req, res) => res.json({ products, personalisation: PERSONALISATION }));

app.get('/api/products/:slug', (req, res) => {
  const product = findProduct(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
});

// ---- Orders ----------------------------------------------------------------
// Prices are always recomputed here from the catalogue; the client's totals are ignored.
function priceLines(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Your bag is empty.');
  return items.slice(0, 20).map((item) => {
    const product = findProduct(item.slug);
    const colour = product?.colourways.find((c) => c.code === item.colour);
    if (!product || !colour) throw new Error('An item in your bag is no longer available.');
    const qty = Math.min(Math.max(parseInt(item.qty, 10) || 1, 1), 5);
    let initials = null;
    if (item.initials?.letters) {
      const letters = clean(item.initials.letters, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const finish = PERSONALISATION.finishes.find((f) => f.id === item.initials.finish) ? item.initials.finish : 'gold';
      if (letters) initials = { letters, finish };
    }
    return {
      slug: product.slug,
      code: product.code,
      title: product.title,
      colour: colour.code,
      colourName: colour.name,
      qty,
      unitINR: product.priceINR,
      personalisationINR: initials ? PERSONALISATION.priceINR : 0,
      initials,
    };
  });
}

app.post('/api/orders', async (req, res) => {
  try {
    const { items, contact = {}, delivery = {}, payment, gift } = req.body || {};
    const lines = priceLines(items);

    const errors = {};
    if (!EMAIL.test(clean(contact.email))) errors.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(clean(contact.phone).replace(/\D/g, '').slice(-10))) errors.phone = 'Enter a 10-digit Indian mobile number.';
    if (!clean(delivery.name)) errors.name = 'Enter the recipient’s full name.';
    if (!clean(delivery.address)) errors.address = 'Enter the delivery address.';
    if (!/^\d{6}$/.test(clean(delivery.pin))) errors.pin = 'Enter a 6-digit PIN code.';
    if (!clean(delivery.city)) errors.city = 'Enter the city.';
    if (!clean(delivery.state)) errors.state = 'Choose a state.';
    if (!['upi', 'card', 'netbanking'].includes(payment)) errors.payment = 'Choose a payment method.';
    if (Object.keys(errors).length) return res.status(422).json({ error: 'Please check the highlighted fields.', fields: errors });

    const subtotal = lines.reduce((s, l) => s + (l.unitINR + l.personalisationINR) * l.qty, 0);
    const deliveryINR = delivery.method === 'express' ? EXPRESS_DELIVERY_INR : 0;
    const order = {
      id: `DF${Date.now().toString(36).toUpperCase()}${randomUUID().slice(0, 4).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'awaiting_payment', // set to 'paid' by the payment gateway webhook once integrated
      lines,
      totals: { subtotalINR: subtotal, deliveryINR, totalINR: subtotal + deliveryINR },
      contact: { email: clean(contact.email), phone: clean(contact.phone, 20), whatsapp: !!contact.whatsapp },
      delivery: {
        name: clean(delivery.name), address: clean(delivery.address, 400), pin: clean(delivery.pin, 6),
        city: clean(delivery.city), state: clean(delivery.state), method: delivery.method === 'express' ? 'express' : 'standard',
      },
      payment,
      gift: gift ? { note: clean(gift.note, 300) } : null,
    };
    await append('orders', order);
    res.status(201).json({ id: order.id, status: order.status, totals: order.totals });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await find('orders', (o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { id, createdAt, status, lines, totals, delivery } = order;
  res.json({ id, createdAt, status, lines, totals, delivery: { name: delivery.name, city: delivery.city, method: delivery.method } });
});

// ---- Client services --------------------------------------------------------
app.post('/api/newsletter', async (req, res) => {
  const email = clean(req.body?.email);
  if (!EMAIL.test(email)) return res.status(422).json({ error: 'Enter a valid email address.' });
  await append('subscribers', { email, source: clean(req.body?.source, 40) || 'footer', at: new Date().toISOString() });
  res.status(201).json({ ok: true });
});

app.post('/api/appointments', async (req, res) => {
  const b = req.body || {};
  const errors = {};
  if (!clean(b.name)) errors.name = 'Enter your name.';
  if (!EMAIL.test(clean(b.email))) errors.email = 'Enter a valid email address.';
  if (!['in-person', 'video'].includes(b.mode)) errors.mode = 'Choose how you’d like to meet.';
  if (!clean(b.date)) errors.date = 'Choose a preferred date.';
  if (Object.keys(errors).length) return res.status(422).json({ error: 'Please check the highlighted fields.', fields: errors });
  const record = {
    id: randomUUID(), at: new Date().toISOString(), name: clean(b.name), email: clean(b.email), phone: clean(b.phone, 20),
    mode: b.mode, city: clean(b.city), date: clean(b.date, 20), time: clean(b.time, 20), interest: clean(b.interest, 60), notes: clean(b.notes, 1000),
  };
  await append('appointments', record);
  res.status(201).json({ ok: true });
});

app.post('/api/contact', async (req, res) => {
  const b = req.body || {};
  if (!clean(b.name) || !EMAIL.test(clean(b.email)) || !clean(b.message)) {
    return res.status(422).json({ error: 'Please add your name, a valid email and a message.' });
  }
  await append('enquiries', {
    id: randomUUID(), at: new Date().toISOString(), name: clean(b.name), email: clean(b.email),
    topic: clean(b.topic, 60), order: clean(b.order, 40), message: clean(b.message, 2000),
  });
  res.status(201).json({ ok: true });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// ---- Serve the built client in production (on Vercel the CDN serves it instead) --
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (!process.env.VERCEL && existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '30d', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

export default app;
