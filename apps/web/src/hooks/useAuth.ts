import { useState, useEffect, useCallback } from "react";

interface AuthState {
  user: any;
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
}

/**
 * Shared auth hook used across multiple pages.
 * Checks login status on mount, provides logout handler.
 */
export function useAuth(): AuthState & { handleLogout: () => Promise<void> } {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.data.authenticated) {
          setUser(data.data.user);
          setIsLoggedIn(true);
        }
      } catch {
        // Not logged in
      } finally {
        setIsCheckingAuth(false);
      }
    })();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("登出失败:", error);
    }
  }, []);

  return { user, isLoggedIn, isCheckingAuth, handleLogout };
}
