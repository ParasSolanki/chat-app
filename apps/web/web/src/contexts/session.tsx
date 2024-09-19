import { useQuery } from "@tanstack/react-query";
import { sessionQueries } from "~/common/keys/session";
import * as React from "react";
import { createStore, StoreApi } from "zustand";

type SessionUser = {
  email: string;
  name: string;
  id: string;
  avatarUrl: string | null;
  slug: string;
  username: string;
  role: {
    name: string;
    id: string;
  };
};

export type SessionContextProps = {
  user?: SessionUser;
};

export type SessionContextStore = StoreApi<SessionContextProps>;

export const SessionContext = React.createContext<
  SessionContextStore | undefined
>(undefined);

type SessionProviderProps = React.PropsWithChildren<{
  workspace: string;
}>;

export const SessionProvider = ({
  workspace,
  children,
}: SessionProviderProps) => {
  const storeRef = React.useRef<SessionContextStore>();
  const { data } = useQuery(sessionQueries.session({ workspace }));

  if (!storeRef.current) {
    storeRef.current = createStore(() => ({
      user: undefined,
    }));
  }

  storeRef.current.setState(() => ({
    user: data?.data.user,
  }));

  return (
    <SessionContext.Provider value={storeRef.current}>
      {children}
    </SessionContext.Provider>
  );
};
