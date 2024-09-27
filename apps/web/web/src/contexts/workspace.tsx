import { useQuery } from "@tanstack/react-query";
import { workspaceQueries } from "~/common/keys/workspaces";
import * as React from "react";
import { createStore, StoreApi, useStore } from "zustand";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string | null;
  description: string | null;
  channelSlug: string | null;
  owner: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type WorkspaceContextProps = {
  workspace?: Workspace;
};

export type WorkspaceContextStore = StoreApi<WorkspaceContextProps>;

export const WorkspaceContext = React.createContext<
  WorkspaceContextStore | undefined
>(undefined);

type WorkspaceProviderProps = React.PropsWithChildren<{
  workspace: string;
}>;

export const WorkspaceProvider = ({
  workspace,
  children,
}: WorkspaceProviderProps) => {
  const storeRef = React.useRef<WorkspaceContextStore>();
  const { data } = useQuery(workspaceQueries.details({ workspace }));

  if (!storeRef.current) {
    storeRef.current = createStore(() => ({
      workspace: undefined,
    }));
  }

  storeRef.current.setState(() => ({
    workspace: data?.data.workspace,
  }));

  return (
    <WorkspaceContext.Provider value={storeRef.current}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspaceContextStore<T>(
  selector: (state: WorkspaceContextProps) => T,
) {
  const store = React.useContext(WorkspaceContext);
  if (!store) {
    throw new Error("Missing WorkspaceProvider");
  }
  return useStore<WorkspaceContextStore, T>(store, selector);
}
