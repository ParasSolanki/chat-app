import * as React from "react";
import { createStore, useStore } from "zustand";
import type { StoreApi } from "zustand";

export type ThreadContextProps = {
  isOpen: boolean;
  workspace: string;
  slug: string;
  messageSlug?: string;
  open: (slug: string) => void;
  close: () => void;
};

export type ThreadContextStore = StoreApi<ThreadContextProps>;

export const ThreadContext = React.createContext<
  ThreadContextStore | undefined
>(undefined);
ThreadContext.displayName = "ThreadContext";

export type ThreadContextProviderProps = React.PropsWithChildren<{
  slug: string;
  workspace: string;
  defaultOpen?: boolean;
  messageSlug?: string;
}>;

export function ThreadContextProvider(props: ThreadContextProviderProps) {
  const storeRef = React.useRef<ThreadContextStore>();

  if (!storeRef.current) {
    storeRef.current = createStore((set) => ({
      slug: props.slug,
      workspace: props.workspace,
      isOpen: props.defaultOpen ?? false,
      open: (slug) => set(() => ({ isOpen: true, messageSlug: slug })),
      close: () => set(() => ({ isOpen: false, messageSlug: undefined })),
    }));
  }

  return (
    <ThreadContext.Provider value={storeRef.current}>
      {props.children}
    </ThreadContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThreadContextStore<T>(
  selector: (state: ThreadContextProps) => T,
) {
  const store = React.useContext(ThreadContext);
  if (!store) {
    throw new Error("Missing ThreadContextProvider");
  }
  return useStore<ThreadContextStore, T>(store, selector);
}
