import { Link } from "react-router-dom";

import logoSNB from "../assets/logo-snb.png";
import heroImage from "../assets/login-hero.png";

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

          <Link to="/login">
            Comprar
          </Link>
          
          <Link
            to="/login"
            className="nav-login"
          >
            Ingresar
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

          <img
            src={logoSNB}
            alt="SNB"
            className="footer-logo"
          />

          <p>
            Ventas mayoristas
          </p>

        </div>

        <div>

          <p>
            📧 sebabranca@gmail.com
          </p>

          <p>
            📱 +54 9 221 611-6321
          </p>

        </div>

      </footer>

    </div>

  );

}