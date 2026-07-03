import { useState, useEffect } from "react";
import { Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import logoSNB from "../../assets/logo-snb.png";
import bannerImg1 from "../../assets/banner-1.jpg";
import bannerImg2 from "../../assets/banner-2.jpg";
import "./HomePage.css";

const bannerImages = [bannerImg1, bannerImg2];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  function goToPrev() {
    setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  }

  function goToNext() {
    setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
  }

  return (
    <div className="home-container">
      {/* Banner Principal */}
      <section className="hero-banner">
        <div className="hero-carousel">
          {bannerImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Banner ${index + 1}`}
              className={`hero-slide ${index === currentSlide ? "active" : ""}`}
            />
          ))}
        </div>

        <button className="hero-arrow hero-arrow-left" onClick={goToPrev} aria-label="Anterior">
          <ChevronLeft size={28} />
        </button>

        <button className="hero-arrow hero-arrow-right" onClick={goToNext} aria-label="Siguiente">
          <ChevronRight size={28} />
        </button>

        <div className="hero-dots">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Footer integrado como sección de contacto */}
      <footer className="home-footer">
        <div className="footer-brand">
          <img src={logoSNB} alt="SNB" className="footer-logo" />
          <p>Ventas mayoristas</p>
        </div>

        <div className="footer-contact">
          <p>
            <a href="mailto:sebabranca@gmail.com" className="contact-link">
              <Mail size={16} className="contact-icon" />
              sebabranca@gmail.com
            </a>
          </p>
          <p>
            <a href="https://wa.me/5492216116321" target="_blank" rel="noopener noreferrer" className="contact-link">
              <Phone size={16} className="contact-icon" />
              +54 9 221 611-6321
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}