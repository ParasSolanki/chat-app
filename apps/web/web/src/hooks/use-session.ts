import { SessionContext } from "~/contexts/session";
import type {
  SessionContextProps,
  SessionContextStore,
} from "~/contexts/session";
import * as React from "react";
import { useStore } from "zustand";

export function useSessionStore<T>(
  selector: (state: SessionContextProps) => T,
) {
  const store = React.useContext(SessionContext);
  if (!store) {
    throw new Error("Missing SessionProvider");
  }
  return useStore<SessionContextStore, T>(store, selector);
}
