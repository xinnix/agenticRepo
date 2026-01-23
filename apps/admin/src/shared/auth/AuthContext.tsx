import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authProvider } from "./authProvider";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isInitialized = useRef(false);

  // Check auth function - use ref to track initialization
  const checkAuth = useCallback(async () => {
    // Prevent multiple simultaneous calls using ref only
    if (isInitialized.current) {
      return;
    }

    try {
      const identity = await authProvider.getIdentity?.();
      setUser(identity);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      isInitialized.current = true;
    }
  }, []); // Empty deps - function is stable

  useEffect(() => {
    checkAuth();
  }, []); // Run once on mount

  const login = useCallback(async (email: string, password: string) => {
    const result = await authProvider.login({ email, password });

    // Check if login failed
    if (!result.success) {
      throw new Error(result.error?.message || "登录失败");
    }

    // Update state directly
    const identity = await authProvider.getIdentity?.();
    setUser(identity);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authProvider.logout?.({});
    setIsAuthenticated(false);
    setUser(null);
    isInitialized.current = false;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, user, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
