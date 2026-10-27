import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../lib/api.js';
import { Media } from '../components/Img.jsx';
import Reveal from '../components/Reveal.jsx';

export default function Personalisation() {
  const { products } = useStore();
  return (
    <>
      <section className="split split--rev">
        <div className="split__copy">
          <Reveal>
            <div className="eyebrow">Personalisation</div>
            <h1 className="display d-lg" style={{ marginTop: 20 }}>Your initials, beside ours.</h1>
            <p className="lede" style={{ marginTop: 26 }}>
              Up to three letters, on any bag in the collection. Choose gold foil, hot-stamped for contrast, or a blind deboss pressed into the leather in the same way as our D/F. It is complimentary, and you can preview it before you add the bag.
            </p>
          </Reveal>
        </div>
        <div className="split__media" style={{ flexGrow: 1.3 }}><Media name="leather-taupe-monogram" alt="Gold-foil monogram on taupe leather" ratio="r-43" sizes="(max-width: 900px) 100vw, 58vw" priority /></div>
      </section>

      <section className="section container">
        <div className="services narrow">
          <div className="service"><h3>Gold foil</h3><p>Hot-stamped in light gold to match the hardware. Best on cognac, ébène and noir.</p></div>
          <div className="service"><h3>Blind deboss</h3><p>Pressed without colour, for a tone-on-tone mark you notice only up close.</p></div>
          <div className="service"><h3>Made for you</h3><p>Stamped by hand before dispatch. Personalised pieces cannot be returned.</p></div>
        </div>
      </section>

      <section className="section section-b">
        <h2 className="display d-sm container" style={{ marginBottom: 40 }}>Choose a piece to personalise</h2>
        <div className="grid-2">
          {(products || []).map((p) => (
            <Link key={p.slug} to={`/bags/${p.slug}#personalise`} className="card">
              <Media name={p.colourways[0].images[0]} alt={p.title} sizes="(max-width: 900px) 100vw, 50vw" />
              <div className="card__meta caps">
                <div><div>{p.title}</div><div className="muted">{p.code} · {formatINR(p.priceINR)}</div></div>
                <span className="link">Personalise</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
