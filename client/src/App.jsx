import { useCallback, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { BagDrawer, Menu, Search } from './components/Overlays.jsx';
import Home from './pages/Home.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmed from './pages/OrderConfirmed.jsx';
import Appointments from './pages/Appointments.jsx';
import House from './pages/House.jsx';
import ClientCare from './pages/ClientCare.jsx';
import Personalisation from './pages/Personalisation.jsx';
import NotFound from './pages/NotFound.jsx';

const TITLES = {
  '/': 'The Diagonal Folio — Leather goods cut on the diagonal',
  '/bags': 'Bags — The Diagonal Folio',
  '/checkout': 'Checkout — The Diagonal Folio',
  '/appointments': 'Private appointments — The Diagonal Folio',
  '/the-house': 'The house — The Diagonal Folio',
  '/client-care': 'Client care — The Diagonal Folio',
  '/personalisation': 'Personalisation — The Diagonal Folio',
};

function useRouteEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (TITLES[pathname]) document.title = TITLES[pathname];
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return pathname;
}

export default function App() {
  const pathname = useRouteEffects();
  const [panel, setPanel] = useState(null);
  const close = useCallback(() => setPanel(null), []);
  const minimal = pathname === '/checkout';

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      {!minimal && <Header onMenu={() => setPanel('menu')} onSearch={() => setPanel('search')} />}
      <main id="main" className={pathname === '/' || minimal ? '' : 'main--offset'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bags" element={<Collection />} />
          <Route path="/bags/:slug" element={<Product />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmed />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/the-house" element={<House />} />
          <Route path="/client-care" element={<ClientCare />} />
          <Route path="/personalisation" element={<Personalisation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!minimal && <Footer />}
      {panel === 'menu' && <Menu onClose={close} />}
      {panel === 'search' && <Search onClose={close} />}
      <BagDrawer />
    </>
  );
}
