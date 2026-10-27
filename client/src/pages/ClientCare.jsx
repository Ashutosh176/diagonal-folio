import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatINR } from '../lib/api.js';
import { SITE } from '../config.js';
import Field from '../components/Field.jsx';

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'Product advice', order: '', message: '' });
  const [state, setState] = useState({ status: 'idle', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'busy', message: '' });
    try {
      await api('/contact', { method: 'POST', body: form });
      setState({ status: 'done', message: '' });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  if (state.status === 'done') {
    return <p className="notice" role="status">Thank you. A client advisor will reply by email, {SITE.hours}.</p>;
  }
  return (
    <form onSubmit={submit} noValidate>
      {state.status === 'error' && <p className="notice notice--error" role="alert" style={{ marginBottom: 28 }}>{state.message}</p>}
      <div className="form-grid">
        <Field label="Full name" autoComplete="name" value={form.name} onChange={set('name')} />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        <Field as="select" label="Topic" value={form.topic} onChange={set('topic')}>
          <option>Product advice</option><option>An existing order</option><option>Personalisation</option><option>Care &amp; repair</option><option>Something else</option>
        </Field>
        <Field label="Order number (optional)" value={form.order} onChange={set('order')} />
        <Field as="textarea" className="full" label="Message" value={form.message} onChange={set('message')} />
      </div>
      <button type="submit" className="btn" style={{ marginTop: 32, maxWidth: 320 }} disabled={state.status === 'busy'}>
        {state.status === 'busy' ? <span className="spinner" /> : 'Send'}
      </button>
    </form>
  );
}

function TrackOrder() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (id.trim()) navigate(`/order/${id.trim().toUpperCase()}`); }} style={{ maxWidth: 440 }}>
      <div className="inline-form">
        <label htmlFor="order-id" className="sr-only">Order number</label>
        <input id="order-id" placeholder="Order number, e.g. DF…" value={id} onChange={(e) => setId(e.target.value)} />
        <button type="submit">Track</button>
      </div>
    </form>
  );
}

const Block = ({ id, title, children }) => (
  <section id={id} style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 64px', padding: '64px 0', borderTop: '1px solid var(--line)', scrollMarginTop: 'calc(var(--header) + 24px)' }}>
    <h2 className="display d-sm" style={{ flex: '1 1 260px' }}>{title}</h2>
    <div className="prose" style={{ flex: '2 1 480px' }}>{children}</div>
  </section>
);

export default function ClientCare() {
  return (
    <div className="container">
      <section style={{ padding: 'clamp(56px, 6vw, 88px) 0' }}>
        <div className="eyebrow">Client services</div>
        <h1 className="display" style={{ fontSize: 'clamp(56px, 6vw, 88px)', lineHeight: .95, marginTop: 16 }}>Client care</h1>
        <p className="lede" style={{ marginTop: 24, maxWidth: 560 }}>
          Advice before you buy, care long after. {SITE.phone ? `Call or WhatsApp ${SITE.phone}, ` : 'Write to us, '}{SITE.hours}.
          {SITE.email && <> Or email <a href={`mailto:${SITE.email}`} style={{ textDecoration: 'underline' }}>{SITE.email}</a>.</>}
        </p>
      </section>

      <Block id="delivery" title="Delivery & returns">
        <p>Complimentary standard delivery across India in {SITE.delivery.standardDays} working days. Express delivery arrives in {SITE.delivery.expressDays} working days for {formatINR(SITE.delivery.expressINR)}. Every piece is packed by hand in its D/F box and dust bag.</p>
        <p>You can return an unused piece in its original packaging within {SITE.returnsDays} days of delivery. Personalised pieces are made for you and cannot be returned. Patina on a Cadre is unique to each bag and is not a defect.</p>
      </Block>

      <Block id="care" title="Care & repair">
        <p>Wipe your bag with a soft, dry cloth and keep it away from long periods of sunlight, heat and damp. Condition smooth calf two or three times a year with a neutral cream, and store it stuffed, in its dust bag.</p>
        <p>The Cadre’s patina deepens with use. Buff it with a soft cloth to bring back the shine, and re-wax it with a neutral beeswax cream. For edge repainting, re-stitching or hardware, contact us and we’ll arrange a repair in our atelier.</p>
      </Block>

      <Block id="track" title="Track an order">
        <p>Enter the order number from your confirmation.</p>
        <TrackOrder />
      </Block>

      <Block id="contact" title="Contact us">
        <ContactForm />
      </Block>

      <Block id="privacy" title="Privacy">
        <p>We use your details only to process your orders, appointments and requests, and to send letters from the atelier if you subscribe. We never sell your data, and we never store card details. Write to us at any time to see or delete what we hold.</p>
      </Block>

      <Block id="terms" title="Terms">
        <p>Prices are in Indian rupees and include GST. An order is confirmed once payment is received. Each piece is crafted by hand, so small variations in grain, patina and stitching are part of its character.</p>
      </Block>
      <div style={{ height: 'var(--section)' }} />
    </div>
  );
}
