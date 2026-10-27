import { useEffect, useRef, useState } from 'react';
import manifest from '../data/images.json';

// Responsive, high-resolution image: WebP srcset up to the source's full size,
// with a full-quality JPEG fallback and a soft fade-in once decoded.
export default function Img({ name, alt = '', sizes = '100vw', priority = false, position, className = '' }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const meta = manifest[name];

  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, [name]);

  if (!meta) return null;
  return (
    <img
      ref={ref}
      src={`/img/${name}.jpg`}
      srcSet={meta.widths.map((w) => `/img/${name}-${w}.webp ${w}w`).join(', ')}
      sizes={sizes}
      width={meta.w}
      height={meta.h}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      style={position ? { objectPosition: position } : undefined}
      className={`img ${loaded ? 'is-loaded' : ''} ${className}`}
    />
  );
}

export function Media({ name, alt, ratio = 'r-45', sizes, priority, position, dark, className = '', children }) {
  return (
    <div className={`media ${ratio} ${dark ? 'media--dark' : ''} ${className}`}>
      <Img name={name} alt={alt} sizes={sizes} priority={priority} position={position} />
      {children}
    </div>
  );
}
