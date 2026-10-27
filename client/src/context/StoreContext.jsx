import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const StoreContext = createContext(null);
const BAG_KEY = 'df-bag-v1';

function loadBag() {
  try {
    const raw = JSON.parse(localStorage.getItem(BAG_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

const lineKey = (i) => [i.slug, i.colour, i.initials?.letters || '', i.initials?.finish || ''].join('|');

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [personalisation, setPersonalisation] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [bag, setBag] = useState(loadBag);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    api('/products')
      .then((d) => { setProducts(d.products); setPersonalisation(d.personalisation); })
      .catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch { /* storage unavailable */ }
  }, [bag]);

  const addToBag = useCallback((item) => {
    setBag((prev) => {
      const key = lineKey(item);
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, 5) } : l));
      return [...prev, { ...item, key, qty: 1 }];
    });
    setBagOpen(true);
  }, []);

  const setQty = useCallback((key, qty) => {
    setBag((prev) => (qty < 1 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 5) } : l))));
  }, []);

  const clearBag = useCallback(() => setBag([]), []);

  // Resolve bag lines against the live catalogue (drops anything no longer sold).
  const lines = useMemo(() => {
    if (!products) return [];
    return bag.flatMap((l) => {
      const product = products.find((p) => p.slug === l.slug);
      const colour = product?.colourways.find((c) => c.code === l.colour);
      if (!product || !colour) return [];
      const unit = product.priceINR + (l.initials ? personalisation?.priceINR || 0 : 0);
      return [{ ...l, product, colour, unit, total: unit * l.qty }];
    });
  }, [bag, products, personalisation]);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  const value = {
    products, personalisation, loadError,
    lines, count, subtotal,
    addToBag, setQty, clearBag,
    bagOpen, setBagOpen,
    getProduct: (slug) => products?.find((p) => p.slug === slug),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
