import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext.jsx';

export function Logo() {
  return (
    <span className="logo-swap">
      <img className="logo logo--noir" src="/brand/DF_logo_horizontal_noir.svg" alt="The Diagonal Folio" width="113" height="34" />
      <img className="logo logo--ivory" src="/brand/DF_logo_horizontal_ivory.svg" alt="" aria-hidden="true" width="113" height="34" />
    </span>
  );
}

export const MenuIcon = () => (
  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M0 1h20M0 11h13" /></svg>
);
export const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" /></svg>
);

export default function Header({ onMenu, onSearch }) {
  const { pathname } = useLocation();
  const { count, setBagOpen } = useStore();
  const [hidden, setHidden] = useState(false);
  // Over a dark section (marked data-header="dark", e.g. the 3D story) the header stays
  // transparent with ivory type; once it has scrolled in, a soft dark scrim keeps it legible
  // when it reappears. Elsewhere it is the solid ivory bar. It hides on the way down past
  // 400 px and returns on the way up, in both modes.
  const [overDark, setOverDark] = useState(pathname === '/');
  const [scrim, setScrim] = useState(false);

  useEffect(() => {
    // Scroll events are batched to one update per frame, and React only re-renders the header
    // when one of its three states actually flips.
    let last = window.scrollY, raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const dark = document.querySelector('[data-header="dark"]');
      const r = dark?.getBoundingClientRect();
      const over = !!r && r.top < 40 && r.bottom > 84;
      setOverDark(over);
      setScrim(over && y > 40);
      setHidden((v) => (y > 400 && y > last + 4 ? true : y < last - 4 ? false : v));
      last = y;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [pathname]);

  return (
    <header className={`header ${overDark ? 'header--overlay' : ''} ${scrim ? 'header--scrim' : ''} ${hidden ? 'header--hidden' : ''}`}>
      <div className="header__row">
        <div className="header__side">
          <button type="button" className="header__btn" onClick={onMenu} aria-haspopup="dialog"><MenuIcon />Menu</button>
          <button type="button" className="header__btn hide-sm" onClick={onSearch}>Search</button>
        </div>
        <Link to="/" aria-label="The Diagonal Folio, home"><Logo /></Link>
        <div className="header__side header__side--end">
          <Link className="hide-sm" to="/appointments">Appointments</Link>
          <Link className="hide-sm" to="/client-care">Client care</Link>
          <button type="button" className="header__btn" onClick={() => setBagOpen(true)} aria-label={`Bag, ${count} items`}>Bag ({count})</button>
        </div>
      </div>
    </header>
  );
}
