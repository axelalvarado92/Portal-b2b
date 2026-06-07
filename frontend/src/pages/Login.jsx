import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginRequest } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const data = await loginRequest(
        email,
        password
      );

      console.log("LOGIN COMPLETO");
      console.log(data);

      login(data.data.access_token);

      navigate("/dashboard");

    } catch (err) {

      console.error(err);

      alert("Credenciales inválidas");

    }

  };

  return (
    <div style={{ padding: "40px" }}>

      <h1>Portal B2B</h1>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <br /><br />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <br /><br />

        <button type="submit">
          Ingresar
        </button>

      </form>

    </div>
  );
}