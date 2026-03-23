import useSWR, { SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err: any = new Error("请求失败");
    err.status = res.status;
    try { err.info = await res.json(); } catch {}
    throw err;
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "请求失败");
  }
  return json.data;
};

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  errorRetryCount: 3,
  dedupingInterval: 5000,
};

/** Current user auth state */
export function useAuthSWR() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/auth/login",
    fetcher,
    { ...defaultConfig, revalidateOnFocus: false, errorRetryCount: 0 }
  );
  return {
    user: data?.authenticated ? data.user : null,
    isLoggedIn: !!data?.authenticated,
    isLoading,
    error,
    mutate,
  };
}

/** User analysis history */
export function useHistorySWR(
  type: "content" | "account" | "keyword",
  isLoggedIn: boolean,
  limit = 5
) {
  const { data, error, isLoading, mutate } = useSWR(
    isLoggedIn ? `/api/user/history?type=${type}&limit=${limit}` : null,
    fetcher,
    defaultConfig
  );
  return {
    history: data?.analyses || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/** Dashboard stats */
export function useDashboardStats() {
  return useSWR("/api/dashboard/stats", fetcher, {
    ...defaultConfig,
    refreshInterval: 60_000,
  });
}

/** Personal dashboard */
export function useMyDashboard() {
  return useSWR("/api/dashboard/my", fetcher, defaultConfig);
}

/** Hotlist data by platform */
export function useHotlist(platform: string) {
  return useSWR(
    platform ? `/api/hotlist/${platform}` : null,
    fetcher,
    { ...defaultConfig, refreshInterval: 300_000 }
  );
}

/** Teams list */
export function useTeams(isLoggedIn: boolean) {
  return useSWR(
    isLoggedIn ? "/api/teams" : null,
    fetcher,
    defaultConfig
  );
}

/** Developer API keys */
export function useApiKeys(isLoggedIn: boolean) {
  return useSWR(
    isLoggedIn ? "/api/developer/keys" : null,
    fetcher,
    defaultConfig
  );
}

/** Batch job status */
export function useBatchJob(jobId: string | null) {
  return useSWR(
    jobId ? `/api/analysis/batch/${jobId}` : null,
    fetcher,
    {
      ...defaultConfig,
      refreshInterval: (data: any) =>
        data?.status === "completed" || data?.status === "failed" ? 0 : 3000,
    }
  );
}

/** Notification config */
export function useNotificationConfig(isLoggedIn: boolean) {
  return useSWR(
    isLoggedIn ? "/api/notifications" : null,
    fetcher,
    defaultConfig
  );
}

export { fetcher, defaultConfig };
