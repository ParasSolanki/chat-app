import * as React from "react";
import { createStore, useStore } from "zustand";
import type { StoreApi } from "zustand";

export type RepliesContextProps = {
  isOpen: boolean;
  workspace: string;
  slug: string;
  parentSlug?: string;
  open: (slug: string) => void;
  close: () => void;
};

export type RepliesContextStore = StoreApi<RepliesContextProps>;

export const RepliesContext = React.createContext<
  RepliesContextStore | undefined
>(undefined);
RepliesContext.displayName = "RepliesContext";

export type RepliesContextProviderProps = React.PropsWithChildren<{
  slug: string;
  workspace: string;
  defaultOpen?: boolean;
  parentSlug?: string;
}>;

export function RepliesContextProvider(props: RepliesContextProviderProps) {
  const storeRef = React.useRef<RepliesContextStore>();

  if (!storeRef.current) {
    storeRef.current = createStore((set) => ({
      slug: props.slug,
      workspace: props.workspace,
      isOpen: props.defaultOpen ?? false,
      open: (slug) => set(() => ({ isOpen: true, parentSlug: slug })),
      close: () => set(() => ({ isOpen: false, parentSlug: undefined })),
    }));
  }

  return (
    <RepliesContext.Provider value={storeRef.current}>
      {props.children}
    </RepliesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRepliesContextStore<T>(
  selector: (state: RepliesContextProps) => T,
) {
  const store = React.useContext(RepliesContext);
  if (!store) {
    throw new Error("Missing RepliesContextProvider");
  }
  return useStore<RepliesContextStore, T>(store, selector);
}
