import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import { login as loginRequest, completeNewPassword } from "../services/authService";
import { useAuth } from "../context/AuthContext";

import { Mail, Phone, Eye, EyeOff } from "lucide-react";

import logoSNB from "../assets/logo-snb.png";

import "./Login.css";


function checkPassword(pass) {
  return {
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSymbol: /[!@#$%^&*]/.test(pass),
  };
}

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
  const [loadingNewPassword, setLoadingNewPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [challengeSession, setChallengeSession] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const reqs = checkPassword(newPassword);

    const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginRequest(email, password);


      const challenge = data?.data?.challenge || data?.challenge;
      const session = data?.data?.session || data?.session;

      if (challenge === "NEW_PASSWORD_REQUIRED") {

        setChallengeSession(session);
        return;
      }

      const token = data?.data?.access_token || data?.access_token;


      if (!token) {
        throw new Error("El backend no devolvió token. Revisá la consola.");
      }

      login(token);

    } catch (err) {

      setError("Usuario o contraseña inválidos. Intentá nuevamente.");
    }
  };

  const handleCompleteNewPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingNewPassword(true);

    if (newPassword !== confirmNewPassword) {
      setError("Las contraseñas no coinciden");
      setLoadingNewPassword(false);
      return;
    }

    try {
      const data = await completeNewPassword(email, newPassword, challengeSession);


      const token = data?.data?.access_token || data?.access_token;


      if (!token) {
        throw new Error("El backend no devolvió token después del challenge.");
      }

      login(token);

    } catch (err) {

      setChallengeSession(null); // Limpiar para forzar nuevo login
      setNewPassword("");
      setConfirmNewPassword("");
      setError(err.message || "Error al establecer la contraseña.");
    } finally {
      setLoadingNewPassword(false);
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

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0", fontSize: "13px", color: "#666" }}>
                <li style={{ color: reqs.minLength ? "#2e7d32" : "#666" }}>
                  {reqs.minLength ? "✓" : "○"} Mínimo 8 caracteres
                </li>
                <li style={{ color: reqs.hasUpper ? "#2e7d32" : "#666" }}>
                  {reqs.hasUpper ? "✓" : "○"} Al menos 1 mayúscula
                </li>
                <li style={{ color: reqs.hasNumber ? "#2e7d32" : "#666" }}>
                  {reqs.hasNumber ? "✓" : "○"} Al menos 1 número
                </li>
                <li style={{ color: reqs.hasSymbol ? "#2e7d32" : "#666" }}>
                  {reqs.hasSymbol ? "✓" : "○"} Al menos 1 símbolo (!@#$%^&*)
                </li>
              </ul>

              <div className="password-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="login-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && <p className="login-error">{error}</p>}

              <button 
                type="submit" 
                className="login-button"
                disabled={loadingNewPassword}
              >
                {loadingNewPassword ? "Guardando..." : "Establecer contraseña"}
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