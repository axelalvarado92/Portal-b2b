import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import logoSNB from "../assets/logo-snb.png";
import "./Login.css";

export default function Register() {

  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError("No se pudo crear la cuenta. Verificá los datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      <header className="landing-header">
        <img src={logoSNB} alt="SNB" className="landing-logo" />
        <nav className="landing-nav">
          <Link to="/">Inicio</Link>
        </nav>
      </header>

      <main className="login-main">

        <Link to="/login" className="login-back">← Volver</Link>

        <div className="login-card">

          <h1 className="login-title">Solicitar cuenta</h1>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ color: "#6e1423", fontWeight: "600", marginBottom: "12px" }}>
                ✓ Solicitud enviada
              </p>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
                Revisá tu email para confirmar tu cuenta.
              </p>
              <button className="login-button" onClick={() => navigate("/login")}>
                Ir al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="login-form">
              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
              />
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Enviando..." : "Solicitar cuenta"}
              </button>
            </form>
          )}

        </div>

      </main>

    </div>
  );
}