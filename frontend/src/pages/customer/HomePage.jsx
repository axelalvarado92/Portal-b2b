import { Mail, Phone } from "lucide-react";
import logoSNB from "../../assets/logo-snb.png"; // Asegúrate de que la ruta sea correcta
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">
      {/* Banner Principal */}
      <section className="hero-banner">
        <h1>Bienvenido a nuestra plataforma</h1>
        <p>Representante comercial de artículos de cotillón, temporada y repostería.</p>
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