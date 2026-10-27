import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { api, formatINR } from '../lib/api.js';
import { SITE } from '../config.js';
import { Logo } from '../components/Header.jsx';
import { BagLine } from '../components/Overlays.jsx';
import Field from '../components/Field.jsx';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const PAYMENTS = [
  ['upi', 'UPI', 'Any UPI app'],
  ['card', 'Credit or debit card', 'Visa · Mastercard · RuPay · Amex'],
  ['netbanking', 'Net banking', 'All major banks'],
];

export default function Checkout() {
  const navigate = useNavigate();
  const { lines, subtotal, setQty, clearBag, products } = useStore();
  const [form, setForm] = useState({
    email: '', phone: '', whatsapp: true,
    name: '', address: '', pin: '', city: '', state: '', method: 'standard',
    payment: 'upi', gift: false, note: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ busy: false, message: '' });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const delivery = form.method === 'express' ? SITE.delivery.expressINR : 0;
  const total = subtotal + delivery;

  async function submit(e) {
    e.preventDefault();
    setStatus({ busy: true, message: '' });
    setErrors({});
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: lines.map((l) => ({ slug: l.slug, colour: l.colour, qty: l.qty, initials: l.initials })),
          contact: { email: form.email, phone: form.phone, whatsapp: form.whatsapp },
          delivery: { name: form.name, address: form.address, pin: form.pin, city: form.city, state: form.state, method: form.method },
          payment: form.payment,
          gift: form.gift ? { note: form.note } : null,
        },
      });
      clearBag();
      navigate(`/order/${order.id}`);
    } catch (err) {
      setErrors(err.fields || {});
      setStatus({ busy: false, message: err.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <>
      <header style={{ height: 'var(--header)', padding: '0 var(--gutter)', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', borderBottom: '1px solid var(--line)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase' }}>
        <Link to="/bags" style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M15 5H1M5 1L1 5l4 4" /></svg>
          <span className="hide-sm">Continue shopping</span>
        </Link>
        <Link to="/" aria-label="The Diagonal Folio, home"><Logo /></Link>
        <span style={{ justifySelf: 'end', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="1" y="6" width="10" height="7" /><path d="M3 6V4a3 3 0 0 1 6 0v2" /></svg>
          <span className="hide-sm">Secure checkout</span>
        </span>
      </header>

      {products && lines.length === 0 ? (
        <section className="container section section-b center">
          <h1 className="display d-lg">Your bag is empty.</h1>
          <Link to="/bags" className="link" style={{ marginTop: 32 }}>Discover the collection</Link>
        </section>
      ) : (
        <section className="checkout">
          <form className="checkout__form" onSubmit={submit} noValidate>
            <h1 className="display d-lg">Checkout</h1>
            {status.message && <p className="notice notice--error" role="alert">{status.message}</p>}

            <fieldset>
              <legend>01 &nbsp; Contact</legend>
              <div className="form-grid">
                <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
                <Field label="Mobile (+91)" type="tel" autoComplete="tel-national" inputMode="numeric" value={form.phone} onChange={set('phone')} error={errors.phone} />
                <label className="check full"><input type="checkbox" checked={form.whatsapp} onChange={set('whatsapp')} />Send order updates on WhatsApp</label>
              </div>
            </fieldset>

            <fieldset>
              <legend>02 &nbsp; Delivery</legend>
              <div className="form-grid">
                <Field className="full" label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
                <Field className="full" label="Address" autoComplete="street-address" value={form.address} onChange={set('address')} error={errors.address} />
                <Field label="PIN code" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pin} onChange={set('pin')} error={errors.pin} />
                <Field label="City" autoComplete="address-level2" value={form.city} onChange={set('city')} error={errors.city} />
                <Field as="select" className="full" label="State" value={form.state} onChange={set('state')} error={errors.state}>
                  <option value="">Select</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </Field>
              </div>
              <div style={{ marginTop: 32 }}>
                <label className="option"><input type="radio" name="ship" checked={form.method === 'standard'} onChange={() => setForm((f) => ({ ...f, method: 'standard' }))} /><span className="option__label">Standard · {SITE.delivery.standardDays} working days</span><span className="option__aside">Complimentary</span></label>
                <label className="option"><input type="radio" name="ship" checked={form.method === 'express'} onChange={() => setForm((f) => ({ ...f, method: 'express' }))} /><span className="option__label">Express · {SITE.delivery.expressDays} working days</span><span className="option__aside">{formatINR(SITE.delivery.expressINR)}</span></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>03 &nbsp; Payment</legend>
              {PAYMENTS.map(([id, label, aside]) => (
                <label className="option" key={id}>
                  <input type="radio" name="pay" checked={form.payment === id} onChange={() => setForm((f) => ({ ...f, payment: id }))} />
                  <span className="option__label">{label}</span><span className="option__aside">{aside}</span>
                </label>
              ))}
              <p className="small muted" style={{ margin: '16px 0 0', fontSize: 12 }}>You’ll complete payment securely after placing the order. We never store card details.</p>
            </fieldset>

            <fieldset>
              <label className="check"><input type="checkbox" checked={form.gift} onChange={set('gift')} />This is a gift: add a handwritten note and hide prices</label>
              {form.gift && <Field as="textarea" label="Your note" maxLength={300} value={form.note} onChange={set('note')} className="full" style={{ marginTop: 20 }} />}
            </fieldset>

            <div>
              <button type="submit" className="btn" disabled={status.busy}>
                {status.busy ? <span className="spinner" /> : `Place order · ${formatINR(total)}`}
              </button>
              <p className="small muted" style={{ margin: '16px 0 0', fontSize: 12 }}>
                By placing your order you accept our <Link to="/client-care#terms" style={{ textDecoration: 'underline' }}>terms</Link> and <Link to="/client-care#privacy" style={{ textDecoration: 'underline' }}>privacy policy</Link>.
              </p>
            </div>
          </form>

          <aside className="checkout__aside" aria-label="Your order">
            <div className="caps" style={{ display: 'flex', justifyContent: 'space-between', letterSpacing: '.2em' }}>
              <span>Your bag ({lines.reduce((s, l) => s + l.qty, 0)})</span>
            </div>
            <div style={{ marginTop: 8 }}>
              {lines.map((l) => <BagLine key={l.key} line={l} setQty={setQty} />)}
            </div>
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
              <div><dt>Personalisation</dt><dd>Complimentary</dd></div>
              <div><dt>Delivery</dt><dd>{delivery ? formatINR(delivery) : 'Complimentary'}</dd></div>
              <div className="total"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
            </dl>
            <div className="small muted" style={{ marginTop: 8, fontSize: 11 }}>Inclusive of all taxes (GST)</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid #D9D4CC' }}>
              <img src="/brand/DF_monogram_noir.svg" alt="" width="40" height="40" style={{ flex: 'none', opacity: .85 }} />
              <p className="small" style={{ margin: 0, fontSize: 12 }}>Packed by hand in a D/F box, with its dust bag. Questions? <Link to="/client-care#contact" style={{ textDecoration: 'underline' }}>Contact client care</Link>.</p>
            </div>
          </aside>
        </section>
      )}
    </>
  );
}
