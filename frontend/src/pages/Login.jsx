import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { login as loginRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";

import logoSNB from "../assets/logo-snb.png";

import "./Login.css";

export default function Login() {

const navigate = useNavigate();

const { login } = useAuth();

const [email, setEmail] =
useState("");

const [password, setPassword] =
useState("");

const [error, setError] =
useState("");

const handleLogin = async (e) => {


e.preventDefault();

setError("");

try {

  const data =
    await loginRequest(
      email,
      password
    );

  login(
    data.data.access_token
  );

  navigate(
    "/dashboard"
  );

} catch (err) {

  console.error(err);

  setError(
    "Credenciales inválidas"
  );

}


};

return (


<div className="login-page">

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

      <Link to="/">
        Comprar
      </Link>

    </nav>

  </header>

  <main className="login-main">

    <Link
      to="/"
      className="login-back"
    >
      ← Volver
    </Link>

    <div className="login-card">

      <h1 className="login-title">
        Iniciar Sesión
      </h1>

      <form
        onSubmit={handleLogin}
        className="login-form"
      >

        <input
          type="email"
          placeholder="Mail"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="login-input"
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className="login-input"
          required
        />

        {error && (

          <p className="login-error">
            {error}
          </p>

        )}

        <button
          type="submit"
          className="login-button"
        >
          Iniciar
        </button>

        <div className="login-links">

          <a href="#">
            ¿Olvidaste tu contraseña?
          </a>

          <a href="#">
            ¿No tenés usuario? Solicitalo acá
          </a>

        </div>

      </form>

    </div>

  </main>

  <footer className="landing-footer">

    <div className="footer-brand">

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
