import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../lib/api.js';
import { Media } from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';

const FILTERS = [
  ['all', 'All'],
  ['briefcases', 'Briefcases'],
  ['frame-bags', 'Frame bags'],
  ['top-handle', 'Top-handle bags'],
  ['totes', 'Totes'],
  ['travel', 'Travel'],
];

export default function Collection() {
  const { products, loadError } = useStore();
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.some(([id]) => id === params.get('type')) ? params.get('type') : 'all';

  const tiles = (products || [])
    .filter((p) => filter === 'all' || p.category === filter)
    .flatMap((p) => p.colourways.map((c) => ({ p, c })));

  return (
    <>
      <section className="page-head">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
          <div>
            <div className="eyebrow">The Collection</div>
            <h1 className="display" style={{ fontSize: 'clamp(56px, 6vw, 88px)', lineHeight: .95, marginTop: 16 }}>Bags</h1>
          </div>
          <div className="filters" role="group" aria-label="Filter">
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setParams(id === 'all' ? {} : { type: id })}>{label}</button>
            ))}
            <span className="muted">{tiles.length} {tiles.length === 1 ? 'piece' : 'pieces'}</span>
          </div>
        </div>
      </section>

      {loadError && <p className="container notice notice--error" style={{ marginTop: 40 }}>{loadError}</p>}

      <section style={{ padding: '40px 0 var(--section)' }}>
        <div className="grid-3" style={{ rowGap: 56 }}>
          {tiles.map(({ p, c }, i) => (
            <Reveal key={c.code} delay={(i % 3) * 90}>
              <Link to={`/bags/${p.slug}?colour=${c.code}`} className="card">
                <Media name={c.images[0]} alt={`${p.title} in ${c.name}`} sizes="(max-width: 900px) 100vw, 33vw" />
                <div className="card__meta caps">
                  <div>
                    <div>{p.name} <span className="muted">· {p.code}</span></div>
                    <div className="muted">{c.name} · {formatINR(p.priceINR)}</div>
                  </div>
                  <span style={{ display: 'flex', gap: 6, paddingTop: 6 }} aria-hidden="true">
                    {c.swatch.map((hex) => <span key={hex} className="swatch" style={{ background: hex, boxShadow: 'none' }} />)}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
          {filter === 'all' && tiles.length > 0 && (
            <Link to="/personalisation" className="card" style={{ gridColumn: '1 / -1', position: 'relative', color: 'var(--ivory)' }}>
              <Media name="leather-taupe-monogram" alt="Taupe leather with the D/F monogram in gold foil" ratio="" className="wide-tile" sizes="100vw">
                <div style={{ position: 'absolute', left: 'var(--gutter)', bottom: 'clamp(24px, 3vw, 48px)' }}>
                  <div className="eyebrow" style={{ color: '#E2DCD2' }}>Personalisation</div>
                  <div className="display d-md" style={{ marginTop: 12 }}>Your initials, beside ours.</div>
                </div>
              </Media>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
