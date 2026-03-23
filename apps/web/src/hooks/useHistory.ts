import { useState, useEffect } from "react";

/**
 * Load user analysis history for a specific type.
 * Fetches when user is logged in, clears when logged out.
 */
export function useHistory(
  type: "content" | "account" | "keyword",
  isLoggedIn: boolean,
  isCheckingAuth: boolean,
  limit = 5
) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn || isCheckingAuth) {
      setHistory([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/user/history?type=${type}&limit=${limit}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setHistory(data.data?.analyses || []);
        }
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isLoggedIn, isCheckingAuth, type, limit]);

  const refresh = () => {
    if (!isLoggedIn || isCheckingAuth) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/user/history?type=${type}&limit=${limit}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setHistory(data.data?.analyses || []);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
  };

  return { history, isLoading, refresh };
}
