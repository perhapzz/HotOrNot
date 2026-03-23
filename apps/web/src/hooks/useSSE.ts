"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEHandler = (data: any) => void;

/**
 * Hook for Server-Sent Events with auto-reconnect.
 */
export function useSSE(handlers: Record<string, SSEHandler>) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const es = new EventSource("/api/events", { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      console.log("[SSE] Connected:", JSON.parse(e.data));
    });

    // Register all event handlers
    const eventTypes = [
      "analysis_complete",
      "hotlist_update",
      "team_action",
      "achievement",
      "system",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e) => {
        const handler = handlersRef.current[type];
        if (handler) {
          try {
            handler(JSON.parse(e.data));
          } catch {
            // Invalid JSON
          }
        }
      });
    }

    es.onerror = () => {
      es.close();
      // Auto-reconnect after 3s
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);
}
