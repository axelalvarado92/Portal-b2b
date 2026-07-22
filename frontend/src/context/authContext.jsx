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
      console.log("INIT AUTH, TOKEN:", token?.substring(0, 50));

      if (!token) {
        setLoading(false);
        return;
      }

      try {

        const userData = await fetchCurrentUser();
        console.log("AUTH USER:", userData);
        setUser(userData);

      } catch (error) {

        console.error("Auth error:", error);

        logout();

      } finally {
        setLoading(false);
      }

    }

    initAuth();

  }, [token]);

  const login = (accessToken) => {
    console.log("SAVING TOKEN:", accessToken?.substring(0, 50));

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