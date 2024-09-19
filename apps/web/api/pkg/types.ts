import type { Env as _Env } from "hono";
import type { Database } from "./db";
import { ConsoleLogger } from "./logger";
import type { User, Session } from "lucia";

type Bindings = {};
type Variables = {
  requestId: string;
  logger: ConsoleLogger;
  db: Database;
};

declare module "hono" {
  interface ContextVariableMap extends Variables {}
}

export interface PublicEnv extends _Env {
  Bindings: Bindings;
  Variables: Variables;
}

type Workspace = {
  id: string;
  slug: string;
};

type Member = {
  id: string;
  email: string;
  name: string;
  slug: string;
  username: string;
  avatarUrl: string | null;
  role: {
    id: string;
    name: string;
  };
};

interface ProtectedVariables extends Variables {
  user: User;
  session: Session;
  workspace: Workspace;
  member: Member;
}

export interface ProtectedEnv extends PublicEnv {
  Variables: ProtectedVariables;
}
