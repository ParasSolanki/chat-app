import { createWebsocketConnection } from "~/utils/api";
import * as React from "react";
import { createStore, StoreApi } from "zustand";

export type WebSocketContextProps = {
  ws?: WebSocket;
  isConnected: boolean;
};

export type WebSocketContextStore = StoreApi<WebSocketContextProps>;

export const WebSocketContext = React.createContext<
  WebSocketContextStore | undefined
>(undefined);

type WebSocketProviderProps = React.PropsWithChildren<{
  workspace: string;
}>;

export const WebSocketProvider = ({
  workspace,
  children,
}: WebSocketProviderProps) => {
  const storeRef = React.useRef<WebSocketContextStore>();

  if (!storeRef.current) {
    storeRef.current = createStore(() => ({
      ws: undefined,
      isConnected: false,
    }));
  }

  React.useEffect(() => {
    const state = storeRef.current?.getState();
    let ws = state?.ws;

    if (!ws) {
      ws = createWebsocketConnection(workspace);
      storeRef.current?.setState({ ws });
    }

    function setIsConnected() {
      storeRef.current?.setState({ isConnected: true });
    }
    function unsetIsConnected() {
      storeRef.current?.setState({ isConnected: false, ws: undefined });
    }

    ws?.addEventListener("open", setIsConnected);
    ws?.addEventListener("close", unsetIsConnected);

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
        unsetIsConnected();
      }

      ws?.removeEventListener("open", setIsConnected);
      ws?.removeEventListener("close", unsetIsConnected);
    };
  }, [workspace]);

  return (
    <WebSocketContext.Provider value={storeRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
};
