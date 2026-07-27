import { useState, useEffect, useRef } from 'react';
import piece1 from '../../assets/piece_1.webp';
import piece2 from '../../assets/piece_2.webp';
import piece3 from '../../assets/piece_3.webp';
import portraitMathilde from '../../assets/portrait_mathilde.webp';
import { fetchSiteContent, getItems } from '../../lib/siteContent';

// Fallback local si aucune image n'a été téléversée depuis l'admin pour cet emplacement
const FALLBACK_LOCAL_IMAGES = [piece1, piece2, piece3, portraitMathilde];

const DEFAULT_CAROUSEL_IMAGES = [
  { src: piece1, alt: "Pièces sans fin — Colonne de tabourets empilables" },
  { src: piece2, alt: "Bridge Allison — Tissu Memphis d'inspiration rétro" },
  { src: piece3, alt: "Bridges Pauline — Léopard revisité et coloré" },
  { src: portraitMathilde, alt: "Mathilde, fondatrice de l'Atelier Gesta" },
];

const INTERVAL_MS = 3800;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [images, setImages] = useState(DEFAULT_CAROUSEL_IMAGES);
  const timerRef = useRef(null);

  useEffect(() => {
    const loadImages = async () => {
      const { itemsBySection } = await fetchSiteContent('home');
      const items = getItems(itemsBySection, 'hero_carousel', null);
      if (!items) return;
      setImages(items.map((row, idx) => ({
        src: row.image_url || FALLBACK_LOCAL_IMAGES[idx] || FALLBACK_LOCAL_IMAGES[0],
        alt: row.title || 'Atelier Gesta',
      })));
    };
    loadImages();
  }, []);

  const goTo = (index) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 500);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % images.length);
        setAnimating(false);
      }, 500);
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="hero-carousel-wrapper">
      <div className={`hero-carousel-img-container ${animating ? 'carousel-fade-out' : 'carousel-fade-in'}`}>
        <img
          src={images[current].src}
          alt={images[current].alt}
          className="hero-carousel-img"
        />
      </div>

      {/* Dots */}
      <div className="hero-carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`hero-carousel-dot ${i === current ? 'active' : ''}`}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>

      {/* Caption */}
      <p className="hero-carousel-caption">{images[current].alt}</p>
    </div>
  );
}
