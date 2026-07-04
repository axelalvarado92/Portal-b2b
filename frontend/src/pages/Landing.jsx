import { Link } from "react-router-dom";

import logoSNB from "../assets/logo-snb.png";
import heroImage from "../assets/login-hero.png";
import { Mail, Phone } from "lucide-react";

import "./Landing.css";

export default function Landing() {

  return (

    <div className="landing">

      <header className="landing-header">

        <img
          src={logoSNB}
          alt="SNB"
          className="landing-logo"
        />

        <nav className="landing-nav">

          <Link
            to="/"
            
          >
            Inicio
          </Link>

          <Link to="/login"
          className="nav-login"
          >
            Comprar
          </Link>

        </nav>

      </header>

      <section
        id="inicio"
        className="landing-hero"
        style={{
          backgroundImage: `url(${heroImage})`
        }}
      >
      
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