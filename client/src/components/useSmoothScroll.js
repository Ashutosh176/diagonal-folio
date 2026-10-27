import { useEffect } from 'react';
import Lenis from 'lenis';

// Smooth, inertial page scrolling (Lenis) across the site: mouse-wheel steps become one
// continuous glide, so the 3D story and the page move together. Inner panels marked
// data-lenis-prevent keep their own native scrolling. It pauses while an overlay
// (menu, search, bag) locks the body, and stays off for visitors who prefer reduced motion.
// The live instance, so other components can scroll the page smoothly (e.g. Go 3D / Exit 3D).
let current = null;
export const smoothScroller = () => current;

export default function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    const sync = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      lenis.destroy();
      if (current === lenis) current = null;
    };
  }, []);
}
