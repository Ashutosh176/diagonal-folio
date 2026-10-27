import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../lib/api.js';
import { SITE } from '../config.js';
import { Logo, CloseIcon } from './Header.jsx';
import Img, { Media } from './Img.jsx';

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
}

export function Menu({ onClose }) {
  useEscape(onClose);
  const { count } = useStore();
  return (
    <div className="menu" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="menu__head">
        <button type="button" className="header__btn" onClick={onClose} style={{ justifySelf: 'start' }}><CloseIcon />Close</button>
        <Link to="/" onClick={onClose} aria-label="The Diagonal Folio, home"><Logo /></Link>
        <span style={{ justifySelf: 'end' }}>Bag ({count})</span>
      </div>
      <div className="menu__body">
        <nav className="menu__nav" aria-label="Main">
          <ul className="menu__list">
            <li><Link to="/bags" onClick={onClose}>Bags</Link></li>
            <li><Link to="/bags/taglio" onClick={onClose}>Taglio</Link><span className="menu__sub">DF-01 · Convertible briefcase</span></li>
            <li><Link to="/bags/cadre" onClick={onClose}>Cadre</Link><span className="menu__sub">DF-02 · Frame bag</span></li>
            <li><Link to="/bags/orlo" onClick={onClose}>Orlo</Link><span className="menu__sub">DF-03 · Top-handle bag</span></li>
            <li><Link to="/bags/lama" onClick={onClose}>Lama</Link><span className="menu__sub">DF-04 · Ladies’ top-handle bag</span></li>
            <li><Link to="/bags/piega" onClick={onClose}>Piega</Link><span className="menu__sub">DF-05 · Structured tote</span></li>
            <li><Link to="/bags/fibbia" onClick={onClose}>Fibbia</Link><span className="menu__sub">DF-06 · Weekender</span></li>
            <li><Link to="/personalisation" onClick={onClose}>Personalisation</Link></li>
            <li><Link to="/#shoes" onClick={onClose}>Shoes</Link><span className="menu__sub">{SITE.shoesSeason}</span></li>
            <li><Link to="/the-house" onClick={onClose}><em>The house</em></Link></li>
          </ul>
          <div className="menu__foot">
            <div>
              <Link to="/appointments" onClick={onClose}>Book an appointment</Link>
              <Link to="/client-care" onClick={onClose}>Client care</Link>
              <Link to="/client-care#track" onClick={onClose}>Track an order</Link>
            </div>
            <div className="muted">
              <span>{SITE.country}</span>
              {SITE.phone && <span>{SITE.phone}</span>}
            </div>
          </div>
        </nav>
        <Link to="/bags/lama" onClick={onClose} className="menu__feature">
          <Media name="lama-tp-07-mood" alt="Lama top-handle bag in Taupe" ratio="" sizes="40vw" dark />
          <div className="menu__feature-cap caps"><div style={{ color: 'var(--ivory-soft)' }}>New</div><div>Lama in Taupe</div></div>
        </Link>
      </div>
    </div>
  );
}

export function Search({ onClose }) {
  useEscape(onClose);
  const { products } = useStore();
  const [q, setQ] = useState('');
  const input = useRef(null);
  useEffect(() => input.current?.focus(), []);

  const results = useMemo(() => {
    if (!products) return [];
    const term = q.trim().toLowerCase();
    return products.flatMap((p) =>
      p.colourways
        .filter((c) => !term || [p.name, p.title, p.code, p.categoryLabel, c.name, c.code].join(' ').toLowerCase().includes(term))
        .map((c) => ({ p, c }))
    );
  }, [q, products]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Search">
      <button type="button" className="overlay__scrim" onClick={onClose} aria-label="Close search" />
      <div className="search">
        <div className="search__bar">
          <label htmlFor="search" className="sr-only">Search the collection</label>
          <input id="search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Lama, Piega, Fibbia, Cognac…" autoComplete="off" />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close search"><CloseIcon /></button>
        </div>
        <p className="eyebrow" style={{ margin: '28px 0' }}>{results.length ? `${results.length} ${results.length === 1 ? 'piece' : 'pieces'}` : 'Nothing matches that search'}</p>
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '32px 2px' }}>
          {results.map(({ p, c }) => (
            <Link key={c.code} to={`/bags/${p.slug}?colour=${c.code}`} onClick={onClose} className="card">
              <Media name={c.images[0]} alt={`${p.title} in ${c.name}`} sizes="240px" />
              <div className="caps" style={{ paddingTop: 12 }}>
                <div>{p.name} · {c.name}</div>
                <div className="muted">{formatINR(p.priceINR)}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BagDrawer() {
  const { bagOpen, setBagOpen, lines, subtotal, setQty } = useStore();
  if (!bagOpen) return null;
  return <BagDrawerInner close={() => setBagOpen(false)} lines={lines} subtotal={subtotal} setQty={setQty} />;
}

function BagDrawerInner({ close, lines, subtotal, setQty }) {
  useEscape(close);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Your bag">
      <button type="button" className="overlay__scrim" onClick={close} aria-label="Close bag" />
      <aside className="drawer">
        <div className="drawer__head">
          <span>Your bag</span>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close" style={{ marginRight: -12 }}><CloseIcon /></button>
        </div>
        <div className="drawer__body">
          {lines.length === 0 ? (
            <div style={{ padding: '48px 0' }}>
              <p className="display d-sm">Your bag is empty.</p>
              <Link to="/bags" onClick={close} className="link" style={{ marginTop: 28 }}>Discover the collection</Link>
            </div>
          ) : (
            lines.map((l) => <BagLine key={l.key} line={l} setQty={setQty} onNavigate={close} />)
          )}
        </div>
        {lines.length > 0 && (
          <div className="drawer__foot">
            <dl className="totals" style={{ margin: '0 0 20px' }}>
              <div><dt>Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
              <div><dt>Delivery</dt><dd>Complimentary</dd></div>
            </dl>
            <Link to="/checkout" onClick={close} className="btn">Checkout</Link>
            <button type="button" className="btn btn--outline" style={{ marginTop: 8 }} onClick={close}>Continue shopping</button>
            <p className="small muted" style={{ margin: '16px 0 0', fontSize: 12 }}>Inclusive of all taxes. Delivered across India in a D/F box.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export function BagLine({ line, setQty, onNavigate, compact }) {
  const { product, colour } = line;
  return (
    <div className="line-item">
      <Link to={`/bags/${product.slug}?colour=${colour.code}`} onClick={onNavigate} className="line-item__img">
        <div className="media r-45"><Img name={colour.images[0]} alt="" sizes="104px" /></div>
      </Link>
      <div className="line-item__body caps">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{product.title}</span>
          <span>{formatINR(line.total)}</span>
        </div>
        <div className="muted">{product.code} · {colour.name}</div>
        {line.initials && <div className="muted">Initials {line.initials.letters.split('').join('.')}. · {line.initials.finish === 'gold' ? 'Gold foil' : 'Blind'}</div>}
        {compact ? (
          <div className="muted">Qty {line.qty}</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="qty" aria-label="Quantity">
              <button type="button" onClick={() => setQty(line.key, line.qty - 1)} aria-label="Decrease quantity">−</button>
              <span>{line.qty}</span>
              <button type="button" onClick={() => setQty(line.key, line.qty + 1)} aria-label="Increase quantity" disabled={line.qty >= 5}>+</button>
            </div>
            <button type="button" className="text-btn" style={{ marginTop: 12 }} onClick={() => setQty(line.key, 0)}>Remove</button>
          </div>
        )}
      </div>
    </div>
  );
}
