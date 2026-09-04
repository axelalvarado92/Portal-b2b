import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { fetchCurrentUser } from "../services/userService";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    localStorage.getItem("accessToken")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      console.log("🔵 INIT AUTH, token:", token ? token.substring(0, 50) + "..." : "NULL/UNDEFINED");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await fetchCurrentUser();
        console.log("🔵 USER DATA:", userData);
        setUser(userData);
      } catch (error) {
        console.error("🔴 FETCH USER FAILED:", error);
        logout(); // Esto borra el token y explica por qué "no pasa nada"
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [token]);

  const login = (accessToken) => {
    if (!accessToken || accessToken === "undefined") {
        console.error("❌ Login llamado con token inválido:", accessToken);
        return;
    }
    console.log("SAVING TOKEN:", accessToken.substring(0, 50) + "...");
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
  };
  
  const logout = () => {

    localStorage.removeItem("accessToken");

    setToken(null);
    setUser(null);

  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}