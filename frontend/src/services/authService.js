const API_URL = import.meta.env.VITE_API_URL;

export async function login(email, password) {

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  if (!response.ok) {
    throw new Error("Login error");
  }

  return response.json();
}

// Paso 1: solicitar código de recuperación
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!response.ok) throw new Error("Error al enviar código");
  return response.json();
}

// Paso 2: confirmar nueva contraseña con el código
export async function confirmForgotPassword(email, code, newPassword) {
  const response = await fetch(`${API_URL}/auth/confirm-forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword })
  });
  if (!response.ok) throw new Error("Error al resetear contraseña");
  return response.json();
}

// Registro de nuevo usuario
export async function register(email, password, fullName) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  if (!response.ok) throw new Error("Error al registrarse");
  return response.json();
}