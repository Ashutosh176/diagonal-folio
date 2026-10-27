import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../lib/api.js';
import { SITE } from '../config.js';
import { Media } from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';
import { SubscribeForm } from '../components/Footer.jsx';
import Services from '../components/Services.jsx';
import BagStory from '../components/BagStory.jsx';

export default function Home() {
  const { getProduct } = useStore();
  const taglio = getProduct('taglio');
  const cadre = getProduct('cadre');
  const orlo = getProduct('orlo');
  const lama = getProduct('lama');
  const piega = getProduct('piega');
  const fibbia = getProduct('fibbia');

  return (
    <div className="home">
      {/* OPENING: the Taglio in 3D, turned by the scroll */}
      <BagStory product={taglio} />

      {/* THE PIECES */}
      <section className="section">
        <Reveal className="center container">
          <div className="eyebrow">The Collection</div>
          <h2 className="display d-lg" style={{ marginTop: 20 }}>Six pieces. One line.</h2>
          <p className="lede" style={{ maxWidth: 520, margin: '24px auto 0' }}>
            Three for the office, two for her and one for the weekend, all in full-grain leather and all drawn from the same 15° diagonal.
          </p>
        </Reveal>
        <div className="grid-3" style={{ marginTop: 'clamp(56px, 6vw, 88px)' }}>
          {[taglio && { p: taglio, img: 'taglio-nc-07-mood' }, cadre && { p: cadre, img: 'cadre-cg-07-mood' }, orlo && { p: orlo, img: 'orlo-in-07-mood' }, lama && { p: lama, img: 'lama-tp-07-mood' }, piega && { p: piega, img: 'piega-bx-07-mood' }, fibbia && { p: fibbia, img: 'fibbia-mi-07-mood' }].filter(Boolean).map(({ p, img }, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 120}>
              <Link to={`/bags/${p.slug}`} className="card">
                <Media name={img} alt={`${p.title} in ${p.colourways[0].name}`} sizes="(max-width: 900px) 100vw, 33vw" dark>
                  <div className="card__overlay">
                    <div>
                      <div className="eyebrow eyebrow--light">{p.code}</div>
                      <div className="display" style={{ fontSize: 'clamp(40px, 4vw, 60px)', marginTop: 10 }}>{p.name}</div>
                      <div className="caps" style={{ marginTop: 8, color: 'var(--ivory-soft)' }}>{p.title.replace(p.name + ' ', '')}</div>
                    </div>
                    <span className="link">Discover</span>
                  </div>
                </Media>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TAGLIO */}
      {taglio && (
        <section className="section">
          <div className="banner">
            <Media name="taglio-banner" alt="Taglio convertible briefcase in Noir / Cognac" ratio="" sizes="100vw" />
            <Reveal className="banner__copy">
              <div className="eyebrow">DF-01 · Taglio · <em style={{ textTransform: 'none', letterSpacing: '.04em' }}>{taglio.pronunciation}</em></div>
              <h2 className="display d-md" style={{ marginTop: 22 }}>{taglio.tagline}</h2>
              <p className="lede" style={{ marginTop: 22 }}>{taglio.summary}</p>
              <Link to="/bags/taglio" className="link" style={{ marginTop: 32 }}>Discover Taglio</Link>
            </Reveal>
          </div>
          <div className="grid-3" style={{ marginTop: 2 }}>
            {taglio.colourways.map((c, i) => (
              <Reveal key={c.code} delay={i * 100}>
                <Link to={`/bags/taglio?colour=${c.code}`} className="card">
                  <Media name={c.images[0]} alt={`Taglio in ${c.name}`} sizes="(max-width: 900px) 100vw, 33vw" />
                  <div className="card__meta caps">
                    <div><div>{c.name}</div><div className="muted">{c.note}</div></div>
                    <span className="muted">{formatINR(taglio.priceINR)}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* THE LINE */}
      <section className="section">
        <div className="split panel">
          <div className="split__media"><Media name="leather-cognac-seam" alt="Cognac leather with a stitched diagonal seam" sizes="(max-width: 900px) 100vw, 55vw" /></div>
          <div className="split__copy">
            <Reveal>
              <div className="eyebrow">The line</div>
              <h2 className="display d-md" style={{ marginTop: 24 }}>Every piece is cut on a single diagonal.</h2>
              <p className="lede" style={{ marginTop: 28 }}>
                The same 15° angle as the slash in our name. It runs across each flap, each welt and each seam, so you can recognise a D/F piece without reading a label.
              </p>
              <Link to="/the-house" className="link" style={{ marginTop: 36 }}>Our story</Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CADRE */}
      {cadre && (
        <section className="section">
          <div className="banner">
            <Media name="cadre-banner" alt="Cadre frame bag in Cognac Patina" ratio="" sizes="100vw" />
            <Reveal className="banner__copy">
              <div className="eyebrow">DF-02 · Cadre · <em style={{ textTransform: 'none', letterSpacing: '.04em' }}>{cadre.pronunciation}</em></div>
              <h2 className="display d-md" style={{ marginTop: 22 }}>{cadre.tagline}</h2>
              <p className="lede" style={{ marginTop: 22 }}>{cadre.summary}</p>
              <Link to="/bags/cadre" className="link" style={{ marginTop: 32 }}>Discover Cadre</Link>
            </Reveal>
          </div>
          <div className="split dark" style={{ marginTop: 2 }}>
            <div className="split__copy">
              <Reveal>
                <div className="eyebrow eyebrow--light">The signature</div>
                <h2 className="display d-md" style={{ marginTop: 24 }}>The logo is the lock.</h2>
                <p className="lede lede--light" style={{ marginTop: 28 }}>
                  On the Cadre, the gold slash between D and F is a turn-lock. Rotate it, and the solid-brass frame opens 160 mm wide. Every patina is brushed by hand, then numbered and signed.
                </p>
                <Link to="/bags/cadre" className="link" style={{ marginTop: 36 }}>Shop Cadre · {formatINR(cadre.priceINR)}</Link>
              </Reveal>
            </div>
            <div className="split__media"><Media name="cadre-cg-05-lock" alt="The D/F slash turn-lock on the Cadre" sizes="(max-width: 900px) 100vw, 55vw" /></div>
          </div>
        </section>
      )}

      {/* ORLO */}
      {orlo && (
        <section className="section">
          <div className="banner">
            <Media name="orlo-banner" alt="Orlo top-handle bag in Ivoire / Noir edge" ratio="" sizes="100vw" />
            <Reveal className="banner__copy">
              <div className="eyebrow">DF-03 · Orlo · <em style={{ textTransform: 'none', letterSpacing: '.04em' }}>{orlo.pronunciation}</em></div>
              <h2 className="display d-md" style={{ marginTop: 22 }}>{orlo.tagline}</h2>
              <p className="lede" style={{ marginTop: 22 }}>{orlo.summary}</p>
              <Link to="/bags/orlo" className="link" style={{ marginTop: 32 }}>Discover Orlo</Link>
            </Reveal>
          </div>
          <div className="grid-3" style={{ marginTop: 2 }}>
            {orlo.colourways.map((c, i) => (
              <Reveal key={c.code} delay={i * 100}>
                <Link to={`/bags/orlo?colour=${c.code}`} className="card">
                  <Media name={c.images[0]} alt={`Orlo in ${c.name}`} sizes="(max-width: 900px) 100vw, 33vw" />
                  <div className="card__meta caps">
                    <div><div>{c.name}</div><div className="muted">{c.note}</div></div>
                    <span className="muted">{formatINR(orlo.priceINR)}</span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* SHOES */}
      <section id="shoes" className="section">
        <div className="hero" style={{ height: 'clamp(560px, 52vw, 760px)', background: 'var(--dark-2)' }}>
          <Media name="leather-mocha" alt="Smooth mocha calf leather with a curved stitched seam" ratio="" sizes="100vw" />
          <div className="hero__shade" style={{ background: 'rgba(14,13,12,.28)' }} aria-hidden="true" />
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
            <Reveal style={{ maxWidth: 460, width: '100%' }}>
              <div className="eyebrow eyebrow--light">{SITE.shoesSeason}</div>
              <h2 className="display" style={{ fontSize: 'clamp(44px, 5.6vw, 84px)', marginTop: 22 }}>Shoes, made<br /><em>the same way.</em></h2>
              <p className="caps" style={{ marginTop: 32, color: 'var(--ivory-soft)' }}>Register for first access</p>
              <SubscribeForm source="shoes" cta="Register" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* PERSONALISATION */}
      <section>
        <div className="split split--rev">
          <div className="split__copy">
            <Reveal>
              <div className="eyebrow">Personalisation</div>
              <h2 className="display d-md" style={{ marginTop: 24 }}>Your initials, beside ours.</h2>
              <p className="lede" style={{ marginTop: 28 }}>Hot-stamped in gold foil or pressed blind, on any bag in the collection. Up to three letters, complimentary.</p>
              <Link to="/personalisation" className="link" style={{ marginTop: 36 }}>Personalise a piece</Link>
            </Reveal>
          </div>
          <div className="split__media" style={{ flexGrow: 1.3 }}><Media name="leather-taupe-monogram" alt="Taupe leather with the D/F monogram in gold foil" ratio="r-43" sizes="(max-width: 900px) 100vw, 58vw" /></div>
        </div>
      </section>

      <Services />
    </div>
  );
}
