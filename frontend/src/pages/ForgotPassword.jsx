import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, confirmForgotPassword } from "../services/authService";
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

function getEmailProviderUrl(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain?.includes('gmail')) return { name: 'Gmail', url: 'https://mail.google.com' };
  if (domain?.includes('hotmail') || domain?.includes('outlook') || domain?.includes('live')) {
    return { name: 'Outlook', url: 'https://outlook.live.com' };
  }
  if (domain?.includes('yahoo')) return { name: 'Yahoo', url: 'https://mail.yahoo.com' };
  return null;
}

export default function ForgotPassword() {

  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: email, 2: código + nueva contraseña
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const reqs = checkPassword(newPassword);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    if (canResend) return;
    
    setResendTimer(60);
    setCanResend(false);
    
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [step]);

  const codeInputs = useRef([]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = code.split('');
    newCode[index] = value;
    const updatedCode = newCode.join('');
    setCode(updatedCode);
    
    // Si escribió un dígito, saltar al siguiente input
    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    // Si apreta Backspace y la caja está vacía, volver al anterior
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pasted);
    // Focus al input siguiente al último dígito pegado
    const focusIndex = Math.min(pasted.length, 5);
    setTimeout(() => codeInputs.current[focusIndex]?.focus(), 0);
  };

  async function handleSendCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep(2);
      setCanResend(false);
      setResendTimer(60);
    } catch (err) {
      setError("No se pudo enviar el código. Verificá el email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

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
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                Te enviamos un código a <strong>{email}</strong>
              </p>
              {(() => {
                const provider = getEmailProviderUrl(email);
                if (!provider) return null;
                return (
                  <button
                    type="button"
                    onClick={() => window.open(provider.url, '_blank')}
                    style={{
                      background: "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      color: "#333",
                      cursor: "pointer",
                      marginBottom: "16px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    📧 Abrir {provider.name}
                  </button>
                );
              })()}
              
              <div className="code-boxes-container">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    ref={(el) => (codeInputs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[i] || ''}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={handleCodePaste}
                    className="code-box-input"
                    required
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                  />
                ))}
              </div>

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
              </ul>

              <div className="password-wrapper" style={{ marginBottom: "12px" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="login-input"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="password-wrapper" style={{ marginBottom: "12px" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="login-input"
                  required
                  autoComplete="new-password"
                  onPaste={(e) => e.preventDefault()}
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
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>

              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px" }}>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendCode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6b1426",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Reenviar código
                  </button>
                ) : (
                  <span style={{ color: "#999" }}>
                    Reenviar código en {resendTimer}s
                  </span>
                )}
                <br />
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#666",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "12px",
                    marginTop: "8px"
                  }}
                >
                  ¿Es incorrecto tu email? Volver
                </button>
              </div>
            </form>
          )}

        </div>

      </main>

    </div>
  );
}