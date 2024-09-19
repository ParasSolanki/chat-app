import { WebSocketContext } from "~/contexts/ws";
import type {
  WebSocketContextProps,
  WebSocketContextStore,
} from "~/contexts/ws";
import * as React from "react";
import { useStore } from "zustand";

export function useWebSocketStore<T>(
  selector: (state: WebSocketContextProps) => T,
) {
  const store = React.useContext(WebSocketContext);
  if (!store) {
    throw new Error("Missing WebSocketProvider");
  }
  return useStore<WebSocketContextStore, T>(store, selector);
}

export function useWebSocketOnConnected(callback: (ws: WebSocket) => void) {
  const ws = useWebSocketStore((state) => state.ws);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  React.useEffect(() => {
    let called = false;
    if (!isConnected || !ws || !callback) return;

    if (!called) {
      callback(ws);
    }

    return () => {
      called = true;
    };
  }, [ws, isConnected, callback]);
}

type UseOnWebSocketMessageProps = {
  callback: (payload: unknown) => void;
  onError?: (e: unknown) => void;
};

export function useWebSocketOnMessage({
  callback,
  onError,
}: UseOnWebSocketMessageProps) {
  const ws = useWebSocketStore((state) => state.ws);

  React.useEffect(() => {
    function onMessage(event: MessageEvent<unknown>) {
      if (!event) return;
      if (!event.data) return;
      if (typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data);
        callback(payload);
      } catch (e) {
        onError?.(e);
      }
    }

    ws?.addEventListener("message", onMessage);

    return () => {
      ws?.removeEventListener("message", onMessage);
    };
  }, [ws, callback, onError]);
}
