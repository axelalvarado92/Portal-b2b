import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, confirmForgotPassword } from "../services/authService";
import logoSNB from "../assets/logo-snb.png";
import "./Login.css";

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: email, 2: código + nueva contraseña
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
    } catch (err) {
      setError("No se pudo enviar el código. Verificá el email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      navigate("/login");
    } catch (err) {
      setError("Código inválido o contraseña incorrecta.");
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

          <h1 className="login-title">
            {step === 1 ? "Recuperar contraseña" : "Nueva contraseña"}
          </h1>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="login-form">
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                Ingresá tu email y te enviamos un código de recuperación.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Enviando..." : "Enviar código"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="login-form">
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                Revisá tu email e ingresá el código junto a tu nueva contraseña.
              </p>
              <input
                type="text"
                placeholder="Código de verificación"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="login-input"
                required
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input"
                required
              />
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>
          )}

        </div>

      </main>

    </div>
  );
}