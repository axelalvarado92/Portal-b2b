import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { login as loginRequest, completeNewPassword } from "../services/authService";
import { useAuth } from "../context/AuthContext";

import { Mail, Phone, Eye, EyeOff } from "lucide-react";

import logoSNB from "../assets/logo-snb.png";

import "./Login.css";

export default function Login() {

  const navigate = useNavigate();
  const { login, user } = useAuth();

  useEffect(() => {

    if (!user) return;
  
    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/companies");
    }
  
  }, [user, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [challengeSession, setChallengeSession] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();
  
    setError("");
  
    try {
  
      const data = await loginRequest(email, password);
  
      if (data.data?.challenge === "NEW_PASSWORD_REQUIRED") {
        setChallengeSession(data.data.session);
        return;
      }
  
      login(data.data.access_token);
  
    } catch (err) {
  
      console.error(err);
  
      setError("Contraseña o email incorrectos. Por favor, intente nuevamente.");
  
    }
  
  };

  const handleCompleteNewPassword = async (e) => {
    e.preventDefault();
    setError("");
  
    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
  
    try {
      const data = await completeNewPassword(email, newPassword, challengeSession);
      // Temporal para debug
      console.log("COMPLETE NEW PASSWORD RESPONSE:", data);
      console.log("ACCESS TOKEN:", data.data?.access_token);
      login(data.data.access_token);
      // El useEffect se encarga de redirigir según el rol
  
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo establecer la nueva contraseña");
    }
  };

  return (
    <div className="login-page">

      <header className="landing-header">
        <img src={logoSNB} alt="SNB" className="landing-logo" />
        <nav className="landing-nav">
          <Link to="/">Inicio</Link>
          <Link to="/">Comprar</Link>
        </nav>
      </header>

      <main className="login-main">

        <Link to="/" className="login-back">
          ← Volver
        </Link>

        <div className="login-card">

          <h1 className="login-title">
            {challengeSession ? "Establecer contraseña" : "Iniciar Sesión"}
          </h1>

          {challengeSession ? (

            <form onSubmit={handleCompleteNewPassword} className="login-form">

              <p style={{ marginBottom: "16px", color: "#555", fontSize: "14px" }}>
                Es tu primer inicio de sesión. Establecé tu contraseña definitiva.
              </p>

              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input"
                required
              />

              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="login-input"
                required
              />

              {error && <p className="login-error">{error}</p>}

              <button type="submit" className="login-button">
                Establecer contraseña
              </button>

            </form>

          ) : (

            <form onSubmit={handleLogin} className="login-form">

              <input
                type="email"
                placeholder="e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />

              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              <button type="submit" className="login-button">
                Iniciar
              </button>

              <div className="login-links">
                <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
                <Link to="/register">¿No tenés usuario? Solicitalo acá</Link>
              </div>

            </form>

          )}

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