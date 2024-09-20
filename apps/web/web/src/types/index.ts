import type { ParseRoute, RegisteredRouter } from "@tanstack/react-router";

export type RegisteredRouterPaths = ParseRoute<
  RegisteredRouter["routeTree"]
>["fullPath"];

export type BaseMessage = {
  id: string;
  type: "message";
  slug: string;
  body: string | null;
  createdAt: string;
  updatedAt: string | null;
  workspace: {
    id: string;
    slug: string;
    name: string;
  } | null;
  channel: {
    id: string;
    slug: string;
    name: string;
  } | null;
  sender: {
    id: string;
    slug: string;
    name: string;
    avatarUrl: string | null;
    username: string;
  } | null;
  recipient: {
    id: string;
    slug: string;
    name: string;
    avatarUrl: string | null;
    username: string;
  } | null;
};

export type Message = BaseMessage & { isCompact: boolean };

export type Group = { id: string; type: "group"; date: string };

export type ChatMessageData = Message | Group;
