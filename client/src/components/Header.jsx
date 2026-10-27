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
  const [scrollY, setScrollY] = useState(0);
  const [hidden, setHidden] = useState(false);
  const overlayCapable = pathname === '/';

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setHidden(y > 400 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  const overlay = overlayCapable && scrollY < 80;
  return (
    <header className={`header ${overlay ? 'header--overlay' : ''} ${hidden ? 'header--hidden' : ''}`}>
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
