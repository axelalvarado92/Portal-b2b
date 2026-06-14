import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";

import logoSNB from "../assets/logo-snb.png";
import "./Login.css";

export default function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();
    setError("");

    try {

      const data = await loginRequest(
        email,
        password
      );

      login(data.data.access_token);

      navigate("/dashboard");

    } catch (err) {

      console.error(err);
      setError("Credenciales inválidas");

    }

  };

  return (
    <div className="login-container">

      <div className="login-image-side"></div>

      <div className="login-form-side">

        <img
          src={logoSNB}
          alt="SNB"
          className="login-logo"
        />

        <h1 className="login-title">Portal B2B</h1>
        <p className="login-subtitle">Ingresá a tu cuenta</p>

        <form onSubmit={handleLogin} className="login-form">

          <label className="login-label">Email</label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />

          <label className="login-label">Contraseña</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />

          {error && (
            <p className="login-error">{error}</p>
          )}

          <button type="submit" className="login-button">
            Ingresar
          </button>

        </form>

      </div>

    </div>
  );
}