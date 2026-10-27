import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container section section-b center" style={{ minHeight: '60vh' }}>
      <div className="eyebrow">404</div>
      <h1 className="display d-lg" style={{ marginTop: 20 }}>This page has been cut.</h1>
      <p className="lede" style={{ marginTop: 20 }}>It may have moved, or never existed.</p>
      <Link to="/bags" className="link" style={{ marginTop: 32 }}>Discover the collection</Link>
    </section>
  );
}
