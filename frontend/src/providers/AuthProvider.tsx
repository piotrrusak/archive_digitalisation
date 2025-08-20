import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    sessionStorage.getItem("authToken")
  );

  const login = (newToken: string) => {
    sessionStorage.setItem("authToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    sessionStorage.removeItem("authToken");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
