import { Link } from 'react-router-dom';
import { SITE } from '../config.js';

export default function Services() {
  return (
    <section className="container section section-b">
      <div className="services narrow">
        <div className="service">
          <h3>Private appointments</h3>
          <p>See and hold every piece before you choose, in person or on a video call with a client advisor.</p>
          <Link to="/appointments" className="link" style={{ marginTop: 18 }}>Book</Link>
        </div>
        <div className="service">
          <h3>Client care</h3>
          <p>{SITE.phone ? `Call or WhatsApp us on ${SITE.phone}, ${SITE.hours}.` : `Write to us and a client advisor will reply, ${SITE.hours}.`}</p>
          <Link to="/client-care#contact" className="link" style={{ marginTop: 18 }}>Contact</Link>
        </div>
        <div className="service">
          <h3>Delivery in a D/F box</h3>
          <p>Complimentary across India in {SITE.delivery.standardDays} working days, packed by hand. Returns within {SITE.returnsDays} days.</p>
          <Link to="/client-care#delivery" className="link" style={{ marginTop: 18 }}>Details</Link>
        </div>
      </div>
    </section>
  );
}
