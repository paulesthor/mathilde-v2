import { useState, useEffect, useRef } from 'react';
import piece1 from '../../assets/piece_1.png';
import piece2 from '../../assets/piece_2.png';
import piece3 from '../../assets/piece_3.png';
import portraitMathilde from '../../assets/portrait_mathilde.png';

// 4 real images for the carousel
const CAROUSEL_IMAGES = [
  {
    src: piece1,
    alt: "Pièces sans fin — Colonne de tabourets empilables",
  },
  {
    src: piece2,
    alt: "Bridge Allison — Tissu Memphis d'inspiration rétro",
  },
  {
    src: piece3,
    alt: "Bridges Pauline — Léopard revisité et coloré",
  },
  {
    src: portraitMathilde,
    alt: "Mathilde, fondatrice de l'Atelier Gesta",
  },
];

const INTERVAL_MS = 3800;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

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
        setCurrent((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        setAnimating(false);
      }, 500);
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="hero-carousel-wrapper">
      <div className={`hero-carousel-img-container ${animating ? 'carousel-fade-out' : 'carousel-fade-in'}`}>
        <img
          src={CAROUSEL_IMAGES[current].src}
          alt={CAROUSEL_IMAGES[current].alt}
          className="hero-carousel-img"
        />
      </div>

      {/* Dots */}
      <div className="hero-carousel-dots">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`hero-carousel-dot ${i === current ? 'active' : ''}`}
            aria-label={`Image ${i + 1}`}
          />
        ))}
      </div>

      {/* Caption */}
      <p className="hero-carousel-caption">{CAROUSEL_IMAGES[current].alt}</p>
    </div>
  );
}
