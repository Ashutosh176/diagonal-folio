import { Link } from 'react-router-dom';
import { Media } from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';

const CRAFT = [
  ['Hand-painted edges', 'Every raw edge is painted, sanded and burnished, three coats on the Taglio, four on the Cadre and six on the Orlo’s sellier edge.'],
  ['Saddle stitching', 'The Cadre’s diagonal welt is hand-stitched in waxed ivory linen. Machine seams run at 7 to 8 stitches per inch, without a single skip.'],
  ['Solid brass', 'All hardware is solid brass with a light-gold PVD finish, nickel-free, and tested for 48 hours in salt spray without corrosion.'],
  ['Tested, quietly', 'Each handle holds 25 kg for a minute without deforming. Straps and rings hold 30 kg. Zips and clasps are cycled 5,000 times.'],
  ['Hand patina', 'Each Cadre starts as undyed vegetable-tanned crust. One artisan brushes the colour on in layers, then waxes and polishes it, numbers it and signs it.'],
  ['Responsibly tanned', 'Body leather comes from an LWG-rated tannery: full-grain calf, never corrected or embossed to hide the grain.'],
];

export default function House() {
  return (
    <>
      <section className="hero" style={{ height: 'clamp(560px, 80svh, 860px)' }}>
        <img src="/brand/DF_monogram_ivory.svg" alt="" aria-hidden="true" style={{ position: 'absolute', right: '-4vw', top: '50%', transform: 'translateY(-50%)', height: '120%', opacity: .05 }} />
        <div className="hero__copy">
          <div>
            <div className="eyebrow eyebrow--light">The house</div>
            <h1 className="display d-xl">A name with<br /><em>a line through it.</em></h1>
          </div>
        </div>
      </section>

      <section className="section container">
        <Reveal className="prose" style={{ margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 2.6vw, 34px)', fontWeight: 300, lineHeight: 1.35, color: 'var(--ink)' }}>
            D/F stands for The Diagonal Folio. The slash between the letters is drawn at 15°, and every piece we make is cut along that same line.
          </p>
          <p>
            We began with a single question: what would an office bag look like if one line did all the talking? No busy panels, no loud logos. Just full-grain leather, a 15° diagonal, and a monogram that is pressed rather than printed.
          </p>
          <p>
            Each piece takes its name from the European craft vocabulary, after the detail that defines it. The first six are below. The next names are already chosen, waiting for the pieces that will earn them.
          </p>
        </Reveal>
      </section>

      <section className="section">
        <div className="grid-3">
          <Reveal>
            <Link to="/bags/taglio" className="card">
              <Media name="taglio-nc-01-hero" alt="Taglio convertible briefcase" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-01 · TAHL-yo</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Taglio, <em>the cut.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>Italian, named after the flap cut on the 15° diagonal. A convertible briefcase in noir pebbled calf and cognac box calf.</p>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Link to="/bags/cadre" className="card">
              <Media name="cadre-cg-01-hero" alt="Cadre frame bag" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-02 · KAH-druh</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Cadre, <em>the frame.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>French, named after the hinged brass frame. In English, a cadre is also a small group of leaders.</p>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={240}>
            <Link to="/bags/orlo" className="card">
              <Media name="orlo-in-01-hero" alt="Orlo top-handle bag" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-03 · OR-lo</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Orlo, <em>the edge.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>Italian, named after the hand-stitched, painted edge that traces its 15° silhouette.</p>
              </div>
            </Link>
          </Reveal>
          <Reveal>
            <Link to="/bags/lama" className="card">
              <Media name="lama-tp-01-hero" alt="Lama top-handle bag" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-04 · LAH-ma</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Lama, <em>the blade.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>Italian, named after the solid-brass blade that pivots on the D/F plate and locks the flap.</p>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Link to="/bags/piega" className="card">
              <Media name="piega-bx-01-hero" alt="Piega structured tote" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-05 · pee-EH-gah</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Piega, <em>the fold.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>Italian, named after the front panel folded over the rim to show the Cognac calf inside.</p>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={240}>
            <Link to="/bags/fibbia" className="card">
              <Media name="fibbia-mi-01-hero" alt="Fibbia weekender" sizes="(max-width: 900px) 100vw, 33vw" />
              <div className="card__meta" style={{ display: 'block' }}>
                <div className="eyebrow">DF-06 · FEEB-bya</div>
                <div className="display d-sm" style={{ marginTop: 12 }}>Fibbia, <em>the buckle.</em></div>
                <p className="small" style={{ maxWidth: '44ch' }}>Italian, named after the engraved D/F box buckles that close its two leaning belts.</p>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="craft" className="section">
        <div className="dark section section-b container">
          <div className="narrow">
            <div className="eyebrow eyebrow--light">The craft</div>
            <h2 className="display d-lg" style={{ marginTop: 20, maxWidth: 720 }}>Made slowly, checked twice.</h2>
            <div className="highlights" style={{ marginTop: 64 }}>
              {CRAFT.map(([t, d], i) => (
                <Reveal key={t} delay={(i % 3) * 90}>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="split">
        <div className="split__media"><Media name="leather-noir-monogram" alt="The D/F monogram hot-stamped in gold" ratio="r-43" sizes="(max-width: 900px) 100vw, 55vw" /></div>
        <div className="split__copy">
          <Reveal>
            <div className="eyebrow">Quiet signature</div>
            <h2 className="display d-md" style={{ marginTop: 24 }}>The monogram is pressed, never printed.</h2>
            <p className="lede" style={{ marginTop: 28 }}>D/F appears only as a blind deboss and an engraved clasp. If you ask for your initials, they sit beside ours.</p>
            <Link to="/personalisation" className="link" style={{ marginTop: 36 }}>Personalisation</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
