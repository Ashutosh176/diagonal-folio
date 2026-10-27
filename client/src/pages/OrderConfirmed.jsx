import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatINR } from '../lib/api.js';

export default function OrderConfirmed() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Thank you — The Diagonal Folio';
    api(`/orders/${encodeURIComponent(id)}`).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  return (
    <section className="container section section-b">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {error ? (
          <>
            <h1 className="display d-lg">We couldn’t find that order.</h1>
            <p className="lede" style={{ marginTop: 20 }}>Check the order number and try again, or contact client care.</p>
            <Link to="/client-care#track" className="link" style={{ marginTop: 32 }}>Track an order</Link>
          </>
        ) : !order ? (
          <div style={{ minHeight: '40vh' }} />
        ) : (
          <>
            <img src="/brand/DF_monogram_noir.svg" alt="" width="56" height="56" />
            <div className="eyebrow" style={{ marginTop: 32 }}>Order {order.id}</div>
            <h1 className="display d-lg" style={{ marginTop: 16 }}>Thank you, {order.delivery.name.split(' ')[0]}.</h1>
            <p className="lede" style={{ marginTop: 22 }}>
              Your order has been received. A client advisor will be in touch shortly to confirm the details and complete payment.
              Your pieces will then be packed by hand in their D/F box{order.lines.some((l) => l.initials) ? ', after your initials are stamped' : ''}.
            </p>
            <div style={{ marginTop: 48, borderTop: '1px solid var(--ink)' }}>
              {order.lines.map((l, i) => (
                <div key={i} className="caps" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '18px 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div>{l.title} × {l.qty}</div>
                    <div className="muted">{l.code} · {l.colourName}{l.initials ? ` · Initials ${l.initials.letters}` : ''}</div>
                  </div>
                  <div>{formatINR((l.unitINR + l.personalisationINR) * l.qty)}</div>
                </div>
              ))}
              <dl className="totals">
                <div><dt>Delivery · {order.delivery.method}</dt><dd>{order.totals.deliveryINR ? formatINR(order.totals.deliveryINR) : 'Complimentary'}</dd></div>
                <div className="total"><dt>Total</dt><dd>{formatINR(order.totals.totalINR)}</dd></div>
              </dl>
            </div>
            <div style={{ display: 'flex', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
              <Link to="/bags" className="link">Continue shopping</Link>
              <Link to="/client-care#contact" className="link">Contact client care</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
