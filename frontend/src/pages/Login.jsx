import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { login as loginRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { fetchCurrentUser } from "../services/userService";

import { Mail, Phone, Eye, EyeOff } from "lucide-react";

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

const [showPassword, setShowPassword] = useState(false);

const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginRequest(email, password);
      login(data.data.access_token);

      // Obtener el usuario para saber el rol
      const { fetchCurrentUser } = await import("../services/userService");
      const userData = await fetchCurrentUser();

      // AQUÍ REALIZAMOS EL CAMBIO:
      if (userData?.role === "admin") {
        navigate("/admin/dashboard"); // O la ruta de administración que prefieras
      } else {
        navigate("/companies"); // <--- CAMBIA ESTO DE "/dashboard" a "/companies"
      }

    } catch (err) {
      console.error(err);
      setError("Contraseña o email incorrectos. Por favor, intente nuevamente.");
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
          placeholder="e-mail"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="login-input"
          required
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="contraseña"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="login-input"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

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

        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        
        <Link to="/register">¿No tenés usuario? Solicitalo acá</Link>

        </div>

      </form>

    </div>

  </main>

<footer className="landing-footer">

  <div className="footer-brand">
    <img src={logoSNB} alt="SNB" className="footer-logo" />
    <p>Ventas mayoristas</p>
  </div>

  <div>
    <p>
      <Mail size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "#6e1423" }} />
      sebabranca@gmail.com
    </p>
    <p>
      <Phone size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "#6e1423" }} />
      +54 9 221 611-6321
    </p>
  </div>

</footer>
</div>

);

};
