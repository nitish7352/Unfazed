import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI, registerAPI, getMeAPI } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("unfazed_token");
    const stored = localStorage.getItem("unfazed_user");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("unfazed_token");
    localStorage.removeItem("unfazed_user");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  // Listen for 401s fired by the axios interceptor — navigate without a hard reload
  useEffect(() => {
    const handler = () => {
      setUser(null);
      navigate("/login", {
        replace: true,
        state: { reason: "session_expired" },
      });
    };
    window.addEventListener("unfazed:unauthorized", handler);
    return () => window.removeEventListener("unfazed:unauthorized", handler);
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const { data } = await loginAPI({ email, password });
    localStorage.setItem("unfazed_token", data.data.token);
    localStorage.setItem("unfazed_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerAPI(payload);
    localStorage.setItem("unfazed_token", data.data.token);
    localStorage.setItem("unfazed_user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await getMeAPI();
      const updatedUser = data.data.user;
      localStorage.setItem("unfazed_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch {
      /* token invalid — axios interceptor handles redirect */
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;
