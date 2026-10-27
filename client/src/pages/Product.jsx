import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../lib/api.js';
import { SITE } from '../config.js';
import { Media } from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';
import NotFound from './NotFound.jsx';

const DETAIL_LABELS = { body: 'Body', flap: 'Flap & trim', fold: 'Fold & lining', belts: 'Belts', filet: 'Gold filet', lining: 'Lining', thread: 'Thread', edge: 'Edges', hardware: 'Hardware' };

function Accordion({ sections, initial }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="accordion">
      {sections.map((s) => {
        const isOpen = open === s.id;
        return (
          <div className="accordion__item" key={s.id}>
            <button type="button" className="accordion__btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              {s.title}<span aria-hidden="true">{isOpen ? '–' : '+'}</span>
            </button>
            {isOpen && <div className="accordion__panel">{s.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

export default function Product() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { products, getProduct, addToBag, personalisation } = useStore();
  const product = getProduct(slug);

  const [personalise, setPersonalise] = useState(() => window.location.hash === '#personalise');
  const [letters, setLetters] = useState('');
  const [finish, setFinish] = useState('gold');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) document.title = `${product.title} · ${product.code} — The Diagonal Folio`;
  }, [product]);

  if (!products) return <div style={{ minHeight: '80vh' }} />;
  if (!product) return <NotFound />;

  const colour = product.colourways.find((c) => c.code === params.get('colour')) || product.colourways[0];
  const signature = product.colourways[0];
  // Colourways with a single render borrow the signature colourway's detail shots, labelled as such.
  const gallery = colour.images.length > 1
    ? colour.images.map((name) => ({ name }))
    : [{ name: colour.images[0] }, ...signature.images.slice(1, 7).map((name) => ({ name, caption: `Shown in ${signature.name}` }))];
  const clean = letters.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const other = products.find((p) => p.slug !== product.slug);

  function add() {
    if (personalise && !clean) return setError('Enter up to three letters, or turn off personalisation.');
    setError('');
    addToBag({ slug: product.slug, colour: colour.code, initials: personalise ? { letters: clean, finish } : null });
  }

  const sections = [
    { id: 'details', title: 'Details', body: <ul>{product.highlights.map(([t, d]) => <li key={t}><strong style={{ fontWeight: 400, color: 'var(--ink)' }}>{t}.</strong> {d}</li>)}</ul> },
    { id: 'dims', title: 'Dimensions & weight', body: <dl style={{ margin: 0 }}>{product.specs.map(([k, v]) => <div className="spec-row" key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl> },
    { id: 'materials', title: 'Materials', body: <ul>{product.materials.map((m) => <li key={m}>{m}</li>)}</ul> },
    { id: 'build', title: `This colourway · ${colour.code}`, body: <dl style={{ margin: 0 }}>{Object.entries(colour.build).map(([k, v]) => <div className="spec-row" key={k}><dt>{DETAIL_LABELS[k] || k}</dt><dd>{v}</dd></div>)}</dl> },
    { id: 'care', title: 'Care', body: <ul>{product.care.map((m) => <li key={m}>{m}</li>)}</ul> },
    {
      id: 'delivery', title: 'Delivery, returns & packaging', body: (
        <ul>
          <li>Complimentary delivery across India in {SITE.delivery.standardDays} working days. Express in {SITE.delivery.expressDays} working days for {formatINR(SITE.delivery.expressINR)}.</li>
          <li>Returns within {SITE.returnsDays} days, unused and in original packaging. Personalised pieces are made for you and cannot be returned.</li>
          <li>{product.packaging}</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <section className="pdp">
        <div className="pdp__gallery">
          {gallery.map((g, i) => (
            <figure key={g.name + i}>
              <Media name={g.name} alt={`${product.title}, view ${i + 1}`} sizes={i === 0 ? '(max-width: 900px) 88vw, 62vw' : '(max-width: 900px) 88vw, 31vw'} priority={i === 0} />
              {g.caption && <figcaption>{g.caption}</figcaption>}
            </figure>
          ))}
        </div>

        <div className="pdp__info">
          <nav aria-label="Breadcrumb" className="eyebrow"><Link to="/bags">Bags</Link> / <Link to={`/bags?type=${product.category}`}>{product.categoryLabel}</Link></nav>
          <h1 className="display" style={{ fontSize: 'clamp(56px, 4.6vw, 76px)', lineHeight: .92, marginTop: 28 }}>{product.name}</h1>
          <div className="display" style={{ fontStyle: 'italic', fontSize: 24, marginTop: 10 }}>{product.title.replace(product.name + ' ', '')} · {product.code}</div>
          <div className="small muted" style={{ marginTop: 6 }}>{product.pronunciation} · {product.meaning}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 22, fontSize: 14, letterSpacing: '.08em' }}>
            <span>{formatINR(product.priceINR)}</span><span className="muted" style={{ fontSize: 11 }}>Inclusive of all taxes</span>
          </div>
          <p className="lede" style={{ marginTop: 24, maxWidth: '42ch', fontSize: 14 }}>{product.summary}</p>

          <div className="caps" style={{ marginTop: 36, letterSpacing: '.2em' }}><span className="muted">Colour</span> <span style={{ marginLeft: 8 }}>{colour.name}</span></div>
          <div className="colour-pick" role="group" aria-label="Colour">
            {product.colourways.map((c) => (
              <button key={c.code} type="button" aria-label={c.name} aria-pressed={c.code === colour.code} onClick={() => setParams({ colour: c.code }, { replace: true })}>
                <img src={`/img/${c.images[0]}-640.webp`} alt="" width="76" height="95" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>

          <div id="personalise" style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <label className="check" style={{ justifyContent: 'space-between', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              <span>Add your initials · Complimentary</span>
              <input type="checkbox" checked={personalise} onChange={(e) => setPersonalise(e.target.checked)} />
            </label>
            {personalise && (
              <div style={{ animation: 'rise .5s var(--ease)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 20, marginTop: 18 }}>
                  <label className="field" style={{ flex: '0 0 140px' }}>Up to {personalisation?.maxLetters || 3} letters
                    <input className="initials-input" type="text" maxLength={3} value={letters} onChange={(e) => setLetters(e.target.value)} placeholder="ABC" autoCapitalize="characters" />
                  </label>
                  <div className="seg" role="group" aria-label="Finish">
                    <button type="button" aria-pressed={finish === 'gold'} onClick={() => setFinish('gold')}>Gold</button>
                    <button type="button" aria-pressed={finish === 'blind'} onClick={() => setFinish('blind')}>Blind</button>
                  </div>
                </div>
                <div
                  className={`monogram-preview monogram-preview--${finish}`}
                  style={{ backgroundColor: colour.leather, backgroundImage: 'radial-gradient(120% 140% at 30% 20%, rgba(255,255,255,.16), rgba(0,0,0,.28))' }}
                  aria-label="Preview"
                >
                  {clean ? clean.split('').join('.') + '.' : 'A.B.'}
                </div>
                <p className="small muted" style={{ margin: '10px 0 0', fontSize: 12 }}>{finish === 'gold' ? 'Hot-stamped in gold foil' : 'Pressed blind into the leather'}, beside the D/F. Personalised pieces cannot be returned.</p>
              </div>
            )}
          </div>

          {error && <p className="field__err" role="alert">{error}</p>}
          <button type="button" className="btn" style={{ marginTop: 28 }} onClick={add}>Add to bag</button>
          <Link to={`/appointments?interest=${product.slug}`} className="btn btn--outline" style={{ marginTop: 8 }}>Book an appointment to see it</Link>
          <p className="small muted" style={{ margin: '18px 0 0', fontSize: 12 }}>
            Complimentary delivery in {SITE.delivery.standardDays} working days · Returns within {SITE.returnsDays} days · Arrives in a D/F box
          </p>

          <div style={{ marginTop: 32 }}>
            <Accordion sections={sections} initial="details" />
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="section container">
        <Reveal className="narrow" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 80px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 320px' }}>
            <div className="eyebrow">{product.code} · {product.meaning}</div>
            <h2 className="display d-lg" style={{ marginTop: 20 }}>{product.tagline}</h2>
          </div>
          <p className="lede" style={{ flex: '1 1 420px', fontSize: 16 }}>{product.story}</p>
        </Reveal>
      </section>

      {/* SIGNATURE DETAILS */}
      <section className="section">
        <h2 className="display d-sm container" style={{ marginBottom: 44 }}>The details</h2>
        <div className="feature-grid">
          {product.signatures.map((s, i) => (
            <Reveal key={s.title} delay={(i % 4) * 90}>
              <Media name={s.image} alt={s.title} sizes="(max-width: 900px) 100vw, 25vw" ratio="r-11" />
              <div style={{ padding: '20px clamp(16px, 2vw, 28px) 0' }}>
                <h3 className="caps" style={{ margin: 0, fontWeight: 500, letterSpacing: '.2em' }}>{s.title}</h3>
                <p className="small" style={{ margin: '8px 0 0', maxWidth: '36ch' }}>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CARRIED WITH */}
      {other && (
        <section className="section">
          <div className="banner">
            <Media name={`${other.slug}-banner`} alt={`${other.title}`} ratio="" sizes="100vw" />
            <Reveal className="banner__copy">
              <div className="eyebrow">Also in the collection · {other.code}</div>
              <h2 className="display d-md" style={{ marginTop: 22 }}>{other.name}</h2>
              <p className="lede" style={{ marginTop: 18 }}>{other.tagline} {other.summary}</p>
              <Link to={`/bags/${other.slug}`} className="link" style={{ marginTop: 32 }}>Discover {other.name} · {formatINR(other.priceINR)}</Link>
            </Reveal>
          </div>
        </section>
      )}
      <div style={{ height: 'var(--section)' }} />
    </>
  );
}
