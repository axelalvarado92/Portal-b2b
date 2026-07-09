import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import logoSNB from "../assets/logo-snb.png";
import heroImage1 from "../assets/login-hero.png";
import heroImage2 from "../assets/login-hero-2.png"; // ajustá el nombre real
import { Mail, Phone } from "lucide-react";

import "./Landing.css";

const heroImages = [heroImage1, heroImage2];

export default function Landing() {

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (

    <div className="landing">

      <header className="landing-header">

        <img
          src={logoSNB}
          alt="SNB"
          className="landing-logo"
        />

        <nav className="landing-nav">

          <Link to="/">
            Inicio
          </Link>

          <Link to="/login" className="nav-login">
            Comprar
          </Link>

        </nav>

      </header>

      <section id="inicio" className="landing-hero">

        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`landing-hero-slide ${index === currentSlide ? "active" : ""}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}

        <div className="landing-hero-dots">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`landing-hero-dot ${index === currentSlide ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>

      </section>

      <footer className="landing-footer">

        <div>
          <img src={logoSNB} alt="SNB" className="footer-logo" />
          <p>Ventas mayoristas</p>
        </div>

        <div>
          <p>
            <a href="mailto:sebabranca@gmail.com" style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center" }}>
              <Mail size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "#6e1423" }} />
              sebabranca@gmail.com
            </a>
          </p>
          <p>
            <a href="https://wa.me/5492216116321" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", display: "inline-flex", alignItems: "center" }}>
              <Phone size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "#6e1423" }} />
              +54 9 221 611-6321
            </a>
          </p>
        </div>

      </footer>

    </div>

  );

}