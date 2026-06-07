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