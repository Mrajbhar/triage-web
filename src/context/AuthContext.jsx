import { createContext, useContext, useMemo, useState } from "react";
import { saveToken, getToken, clearToken } from "../lib/tokenStorage";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);


function decodeJwt(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());

  
  const user = useMemo(() => {
    if (!token) return null;
    const c = decodeJwt(token);
    if (!c) return null;
    return {
      userId: c.sub ?? "",
      name: c.name ?? "",
      email: c.email ?? "",
      role: c.role ?? "",
      company: c.company ?? "",
      tenantId: c.tenant_id ?? "",
    };
  }, [token]);

  // remember = true keeps the session after the browser closes.
  const signIn = (jwt, remember = false) => {
    saveToken(jwt, remember);
    setToken(jwt);
  };

  const signOut = () => {
    clearToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthed: !!token, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}