const API_URL = import.meta.env.VITE_API_URL;

export async function login(email, password) {

  console.log("API_URL:", API_URL);
  console.log("EMAIL:", email);

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

  const data = await response.json();

  console.log("LOGIN RESPONSE:", data);

  return data;
}