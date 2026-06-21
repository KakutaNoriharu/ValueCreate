import { useCallback, useEffect, useRef } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const WS_BASE = BASE_URL.replace(/^http/, 'ws');

export function useWebSocket(path: string, onMessage: (data: unknown) => void) {
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    function connect() {
      if (!alive) return;
      try {
        ws = new WebSocket(`${WS_BASE}${path}`);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string);
            cbRef.current(data);
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          if (alive) {
            retryTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (alive) {
          retryTimer = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      alive = false;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
    };
  }, [path]);
}
