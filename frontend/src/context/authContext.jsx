import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    localStorage.getItem("accessToken")
  );

  const login = (accessToken) => {

    localStorage.setItem(
      "accessToken",
      accessToken
    );

    setToken(accessToken);

  };

  const logout = () => {

    localStorage.removeItem("accessToken");

    setToken(null);

  };

  return (
    <AuthContext.Provider
      value={{
        token,
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