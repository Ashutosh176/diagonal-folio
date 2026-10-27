import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Media } from './Img.jsx';
import { formatINR } from '../lib/api.js';
import { smoothScroller } from './useSmoothScroll.js';

// Scroll the page smoothly (through Lenis when it is running).
const scrollPageTo = (y, immediate = false) => {
  const lenis = smoothScroller();
  lenis?.resize?.(); // the section height may just have changed
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: immediate ? 'instant' : 'smooth' });
};

// Start fetching three.js and the scene as soon as this module loads, not when the story mounts.
let sceneModule = null;
const loadScene = () => (sceneModule ??= import('../three/taglioScene.js'));
if (typeof window !== 'undefined') loadScene();

// The home-page opening: a pinned espresso stage with the Taglio in real-time 3D, in drifting
// gold dust. On arrival the bag assembles itself from its parts. Scrolling turns it through six
// chapters, including an exploded view with labels that track each part, while a giant outlined
// TAGLIO and a fine gold 15° line slide past at their own depths. The camera and every layer
// lean towards the pointer. The bag stands on a black-lacquer mirror under a spotlight that follows
// it; a hairline vitrine frame and a chapter counter hold the composition.
// Three.js loads after first paint; a studio render stands in until then.

// Camera poses along the scroll. p: 0→1 through the pinned section. explode: 0 whole → 1 apart.
const KEYS = [
  { p: 0.0, rotY: -0.62, rotX: 0.05, dist: 19, ty: 0.55, x: 1.9, explode: 0 },
  { p: 0.16, rotY: 0.0, rotX: 0.0, dist: 16.5, ty: 0.15, x: -1.7, explode: 0 },
  { p: 0.33, rotY: -0.58, rotX: 0.1, dist: 24, ty: 1.0, x: 1.5, explode: 1 },
  { p: 0.48, rotY: 0.2, rotX: -0.04, dist: 6.4, ty: -0.62, x: 1.25, explode: 0 },
  { p: 0.64, rotY: Math.PI, rotX: 0.04, dist: 16, ty: 0.15, x: 1.8, explode: 0 },
  { p: 0.8, rotY: Math.PI * 1.5, rotX: 0.03, dist: 15, ty: 0.15, x: -1.6, explode: 0 },
  { p: 1.0, rotY: Math.PI * 2 - 0.62, rotX: 0.05, dist: 21, ty: -1.55, x: 0, explode: 0 },
];
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) ** 3;
function poseAt(p, narrow) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = smooth(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
  const pose = {};
  for (const k of ['rotY', 'rotX', 'dist', 'ty', 'x', 'explode']) pose[k] = a[k] + (b[k] - a[k]) * t;
  if (narrow) { pose.x = 0; pose.dist *= 1.45; pose.ty -= 0.9; }
  return pose;
}

// Chapter windows (in p) and copy. The first is the hero.
const CHAPTERS = [
  { from: -1, to: 0.08, side: 'left', hero: true },
  { from: 0.1, to: 0.23, side: 'right', eyebrow: 'DF-01 · Taglio', title: <>Cut on <em>the diagonal.</em></>, text: 'A cognac box-calf flap laid across noir pebbled calf on a single 15° line: the same angle as the slash in our name.' },
  { from: 0.28, to: 0.39, side: 'left', low: true, eyebrow: 'The anatomy', title: <>Every part, <em>made by hand.</em></>, text: 'Hand-rolled handles, edges painted in three coats, and solid brass throughout, assembled around a padded sleeve for a 16-inch laptop.' },
  { from: 0.43, to: 0.54, side: 'left', low: true, eyebrow: 'The clasp', title: <>Engraved, <em>solid brass.</em></>, text: 'A push-clasp in light-gold PVD brass, engraved D/F, with a one-press release and sewn-in magnets.' },
  { from: 0.59, to: 0.71, side: 'left', eyebrow: 'The back', title: <>Made to <em>travel.</em></>, text: 'A leather sleeve across the back slides over a suitcase handle. Carry it by hand, on the shoulder or crossbody.' },
  { from: 0.75, to: 0.87, side: 'right', eyebrow: 'The gusset', title: <>110 to <em>150 mm.</em></>, text: 'Concealed zips open the gusset when the day asks for more, so the briefcase grows with the day.' },
  { from: 0.91, to: 2, side: 'center', cta: true },
];

// Exploded-view labels, in the order of the scene's anchors. A third entry pins the side.
const LABELS = [
  ['Cognac box-calf flap', 'Cut on a 15° line'],
  ['Push-clasp', 'Solid brass, engraved D/F', 'right'],
  ['Rolled handle', 'Over a braided rope core'],
  ['Shoulder strap', 'Detachable, cognac pad'],
  ['Pebbled calfskin', 'Full grain, 1.4–1.6 mm'],
  ['Trolley sleeve', 'Slides over a suitcase handle'],
];

export default function BagStory({ product }) {
  const section = useRef(null);
  const canvasRef = useRef(null);
  const wordRef = useRef(null);
  const lineRef = useRef(null);
  const beamRef = useRef(null);
  const countRef = useRef(null);
  const barRef = useRef(null);
  const chapterRefs = useRef([]);
  const labelRefs = useRef([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // 'hero': one screen tall; the bag turns slowly on its own and scrolling goes straight on to the
  // site. 'story': the visitor pressed Go 3D; the section grows and scrolling drives the chapters.
  const [mode, setMode] = useState('hero');
  const modeRef = useRef('hero');
  const controls = useRef(null);

  useEffect(() => {
    let scene = null, raf = 0, alive = true, cur = null, target = 0, visible = true, introAt = 0;
    const narrowMq = window.matchMedia('(max-width: 900px)');
    // In development, #nosmooth snaps straight to each pose (for checking frames).
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || (import.meta.env.DEV && location.hash === '#nosmooth');
    const pointer = { x: 0, y: 0 }, aim = { x: 0, y: 0 };

    // Section geometry is measured on resize only, so scrolling never forces a layout read.
    let top = 0, span = 1;
    const measure = () => {
      const r = section.current.getBoundingClientRect();
      top = r.top + window.scrollY;
      span = Math.max(1, r.height - window.innerHeight);
    };
    measure();
    const progress = () => (modeRef.current === 'story' ? Math.min(1, Math.max(0, (window.scrollY - top) / span)) : 0);
    const lastO = CHAPTERS.map(() => -1);
    const paintLayers = (p) => {
      CHAPTERS.forEach((c, i) => {
        const el = chapterRefs.current[i];
        if (!el) return;
        const o = Math.min(1, Math.max(0, Math.min((p - c.from) / 0.035, (c.to - p) / 0.035)));
        if (o === 0 && lastO[i] === 0) return;
        lastO[i] = o;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${(-pointer.x * 10).toFixed(1)}px, ${((1 - o) * 26 - pointer.y * 6).toFixed(1)}px, 0)`;
        el.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
        el.style.setProperty('--o', o.toFixed(3));
      });
      // Chapter counter and the gold progress hairline.
      const n = Math.max(1, CHAPTERS.findLastIndex((c) => p >= c.from - 0.02) + 1);
      const label = String(n).padStart(2, '0');
      if (countRef.current.textContent !== label) countRef.current.textContent = label;
      barRef.current.style.transform = `scaleY(${p.toFixed(4)})`;
      // The giant word sits deep (moves slowly, against the pointer); the gold line sits near.
      wordRef.current.style.transform = `translate3d(calc(${(18 - p * 95).toFixed(2)}vw + ${(-pointer.x * 26).toFixed(1)}px), ${(-pointer.y * 14).toFixed(1)}px, 0)`;
      lineRef.current.style.transform = `translate3d(${(pointer.x * 40 - p * 30).toFixed(1)}px, ${(pointer.y * 24 + p * 120).toFixed(1)}px, 0) rotate(-15deg)`;
    };
    // Each label runs away from the bag: left of its on-screen centre to the left, else right.
    const paintLabels = (anchors, explode) => {
      const o = Math.max(0, (explode - 0.55) / 0.45);
      if (!anchors) return;
      if (o === 0) {
        if (paintLabels.shown) { labelRefs.current.forEach((el) => el && (el.style.opacity = '0')); paintLabels.shown = false; }
        return;
      }
      paintLabels.shown = true;
      const mid = anchors.reduce((sum, a) => sum + a.x, 0) / anchors.length;
      anchors.forEach((a, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
        const side = LABELS[i][2] || (a.x < mid ? 'left' : 'right');
        if (el.dataset.side !== side) { el.dataset.side = side; el.className = `story__label story__label--${side}`; }
      });
    };

    // Easing is time-based, so the glide feels the same at 60, 90 or 120 frames a second.
    // While nothing moves (scroll settled, pointer at rest) the scene drops to ~30 fps for the dust.
    let last = 0, lastDraw = 0;
    const frame = (now) => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      const tgt = target;
      const prevCur = cur, prevPx = pointer.x, prevPy = pointer.y;
      cur = cur === null || calm ? tgt : cur + (tgt - cur) * (1 - Math.exp(-dt * 11)); // Lenis already glides the page
      if (Math.abs(tgt - cur) < 0.0002) cur = tgt;
      const k = 1 - Math.exp(-dt * 4);
      pointer.x += (aim.x - pointer.x) * k; pointer.y += (aim.y - pointer.y) * k;
      const turning = modeRef.current === 'hero' && !calm;
      const idle = !turning && cur === prevCur && Math.abs(pointer.x - prevPx) < 0.0005 && Math.abs(pointer.y - prevPy) < 0.0005 && !(introAt && now - introAt < 2700);
      if (idle && scene && now - lastDraw < 32) { if (visible && !calm) raf = requestAnimationFrame(frame); return; }
      lastDraw = now;
      paintLayers(cur);
      if (scene) {
        const pose = poseAt(cur, narrowMq.matches);
        // In hero mode the bag turns slowly on its own, like a piece on a display stand.
        if (turning) pose.rotY += Math.sin(now / 1000 * 0.32) * 0.34;
        const scrollExplode = pose.explode;
        // On arrival the parts fly in from apart and lock together.
        if (introAt && !calm) pose.explode = Math.max(pose.explode, 1 - easeOut(Math.min(1, (now - introAt) / 2600)));
        const anchors = scene.render(pose, pointer, calm ? 0 : now / 1000);
        paintLabels(anchors, scrollExplode);
        // The spotlight follows the bag across the stage.
        if (anchors?.center) beamRef.current.style.transform = `translate3d(${anchors.center.x.toFixed(1)}px, 0, 0)`;
      }
      // Keep drawing while the stage is on screen: the dust drifts and the pointer eases.
      if (visible && !calm) raf = requestAnimationFrame(frame);
      else if (cur !== tgt) raf = requestAnimationFrame(frame);
    };
    const wake = () => { target = progress(); if (!raf) raf = requestAnimationFrame(frame); };
    const onResize = () => { measure(); scene?.resize(); wake(); };
    controls.current = { refresh: () => { measure(); wake(); } };
    const onPointer = (e) => { aim.x = (e.clientX / window.innerWidth) * 2 - 1; aim.y = (e.clientY / window.innerHeight) * 2 - 1; };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); });
    io.observe(section.current);
    const onKey = (e) => { if (e.key === 'Escape' && modeRef.current === 'story') setMode('hero'); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', onResize);
    if (!calm && window.matchMedia('(hover: hover) and (pointer: fine)').matches) window.addEventListener('pointermove', onPointer, { passive: true });
    wake();

    // Build the bag (its textures are baked images), compile it in the background, and only then
    // start drawing, so the page never freezes.
    loadScene()
      .then(async (mod) => {
        if (!alive) return;
        const built = await mod.createTaglioScene(canvasRef.current);
        await built.warm();
        if (!alive) { built.dispose(); return; }
        scene = built;
        measure();
        cur = target = progress();
        introAt = performance.now();
        wake();
        requestAnimationFrame(() => alive && setReady(true));
        // then compile the premium materials in the background and swap them in
        built.upgrade().catch(() => {});
      })
      .catch(() => alive && setFailed(true));

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('keydown', onKey);
      scene?.dispose();
    };
  }, []);

  // Entering 3D: the section grows to its full scroll length and the page starts from its top.
  // Leaving: it shrinks back to one screen and the page glides on to the collection below.
  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    requestAnimationFrame(() => {
      controls.current?.refresh();
      const el = section.current;
      if (!el) return;
      // the section has just shrunk under the visitor, so jump straight to what follows it
      scrollPageTo(mode === 'story' ? el.offsetTop : el.offsetTop + el.offsetHeight, true);
    });
  }, [mode]);
  const goToSite = () => scrollPageTo(section.current.offsetTop + section.current.offsetHeight);

  return (
    <section ref={section} className={`story story--${mode}`} data-header="dark" aria-label="Taglio, in three dimensions">
      <div className="story__stage">
        <div ref={beamRef} className="story__beam" aria-hidden="true"><span /></div>
        <div ref={wordRef} className="story__word" aria-hidden="true">TAGLIO</div>
        {/* While the 3D prepares, the stage shows a quiet gold loader; the bag then assembles in.
            The studio photo appears only if WebGL is unavailable. */}
        {!ready && !failed && <div className="story__loader" aria-hidden="true"><span /></div>}
        {failed && (
          <div className="story__poster">
            <Media name="taglio-nc-07-mood" alt="" ratio="" sizes="100vw" priority dark />
          </div>
        )}
        {!failed && <canvas ref={canvasRef} className={`story__canvas ${ready ? 'is-ready' : ''}`} aria-hidden="true" />}
        <div ref={lineRef} className="story__line" aria-hidden="true" />
        <div className="story__frame" aria-hidden="true"><i /><i /><i /><i /></div>
        {mode === 'story' && (
          <button type="button" className="story__exit" onClick={() => setMode('hero')} aria-label="Exit 3D and continue to the site">
            <span aria-hidden="true">✕</span> Exit 3D
          </button>
        )}
        <div className="story__count" aria-hidden="true">
          <span ref={countRef} className="story__count-n">01</span>
          <span className="story__count-track"><span ref={barRef} className="story__count-bar" /></span>
          <span className="story__count-of">0{CHAPTERS.length}</span>
        </div>

        <div className="story__labels" aria-hidden="true">
          {LABELS.map(([name, note], i) => (
            <div key={name} ref={(el) => (labelRefs.current[i] = el)} className="story__label story__label--right" style={{ opacity: 0 }}>
              <span className="story__label-dot" />
              <span className="story__label-text"><span className="caps">{name}</span><span>{note}</span></span>
            </div>
          ))}
        </div>

        {CHAPTERS.map((c, i) => (
          <div key={i} ref={(el) => (chapterRefs.current[i] = el)} className={`story__chapter story__chapter--${c.side} ${c.low ? 'story__chapter--low' : ''}`} style={{ opacity: i === 0 ? 1 : 0 }}>
            {c.hero && (
              <>
                <div className="eyebrow eyebrow--light">The Collection · DF-01 to DF-06</div>
                <h1 className="display d-xl" style={{ marginTop: 18 }}>The Diagonal<br />Folio</h1>
                {mode === 'hero' ? (
                  <div className="story__actions">
                    <button type="button" className="story__go" onClick={() => setMode('story')} aria-label="Go 3D: explore the Taglio in three dimensions">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true"><path d="M12 2.5 21 7.5v9L12 21.5 3 16.5v-9z" /><path d="M3 7.5 12 12.5l9-5M12 12.5v9" /></svg>
                      <span>Go 3D</span>
                    </button>
                    <button type="button" className="link story__skip" onClick={goToSite}>Discover the collection</button>
                  </div>
                ) : (
                  <p className="story__hint caps">Scroll to take the Taglio apart</p>
                )}
              </>
            )}
            {c.title && (
              <>
                <div className="eyebrow eyebrow--light">{c.eyebrow}</div>
                <h2 className="display d-md" style={{ marginTop: 18 }}>{c.title}</h2>
                <p className="lede lede--light" style={{ marginTop: 20 }}>{c.text}</p>
              </>
            )}
            {c.cta && (
              <>
                <div className="eyebrow eyebrow--light">DF-01 · TAHL-yo</div>
                <h2 className="display d-lg" style={{ marginTop: 18 }}>Taglio</h2>
                <p className="caps" style={{ marginTop: 14, color: 'var(--ivory-soft)' }}>Convertible briefcase{product ? ` · ${formatINR(product.priceINR)}` : ''}</p>
                <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 30, flexWrap: 'wrap' }}>
                  <Link to="/bags/taglio" className="link">Discover Taglio</Link>
                  <Link to="/bags" className="link">The collection</Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
