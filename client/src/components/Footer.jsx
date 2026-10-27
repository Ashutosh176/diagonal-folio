import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { SITE } from '../config.js';

export function SubscribeForm({ source = 'footer', cta = 'Subscribe', label = 'Email address' }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  async function submit(e) {
    e.preventDefault();
    setState({ status: 'busy', message: '' });
    try {
      await api('/newsletter', { method: 'POST', body: { email, source } });
      setState({ status: 'done', message: 'Thank you. You’re on the list.' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="inline-form" style={{ marginTop: 24 }}>
        <label htmlFor={`email-${source}`} className="sr-only">{label}</label>
        <input id={`email-${source}`} type="email" required placeholder={label} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <button type="submit" disabled={state.status === 'busy'}>{state.status === 'busy' ? '…' : cta}</button>
      </div>
      <p role="status" style={{ minHeight: 20, margin: '12px 0 0', fontSize: 12, opacity: .8 }}>{state.message}</p>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__news">
          <div className="caps" style={{ letterSpacing: '.22em' }}>Letters from the atelier</div>
          <p className="small" style={{ color: 'var(--ivory-muted)', margin: '14px 0 0', fontSize: 14 }}>New pieces, first. A few times a year.</p>
          <SubscribeForm />
        </div>
        <nav className="footer__nav" aria-label="Footer">
          <div>
            <h2>Shop</h2>
            <Link to="/bags">All bags</Link>
            <Link to="/bags/taglio">Taglio · DF-01</Link>
            <Link to="/bags/cadre">Cadre · DF-02</Link>
            <Link to="/bags/orlo">Orlo · DF-03</Link>
            <Link to="/bags/lama">Lama · DF-04</Link>
            <Link to="/bags/piega">Piega · DF-05</Link>
            <Link to="/bags/fibbia">Fibbia · DF-06</Link>
            <Link to="/personalisation">Personalisation</Link>
          </div>
          <div>
            <h2>Client services</h2>
            <Link to="/appointments">Private appointments</Link>
            <Link to="/client-care#delivery">Delivery &amp; returns</Link>
            <Link to="/client-care#care">Care &amp; repair</Link>
            <Link to="/client-care#track">Track an order</Link>
            <Link to="/client-care#contact">Contact</Link>
          </div>
          <div>
            <h2>The house</h2>
            <Link to="/the-house">Our story</Link>
            <Link to="/the-house#craft">The craft</Link>
            {SITE.social.instagram && <a href={SITE.social.instagram} target="_blank" rel="noreferrer">Instagram</a>}
            {SITE.social.linkedin && <a href={SITE.social.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
          </div>
        </nav>
      </div>
      <div className="footer__mark">
        <img src="/brand/DF_logo_stacked_ivory.svg" alt="The Diagonal Folio" loading="lazy" />
      </div>
      <div className="footer__base">
        <span>© {new Date().getFullYear()} The Diagonal Folio</span>
        <span><span>{SITE.country}</span><Link to="/client-care#privacy">Privacy</Link><Link to="/client-care#terms">Terms</Link></span>
      </div>
    </footer>
  );
}
