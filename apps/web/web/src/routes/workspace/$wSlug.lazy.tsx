import { cn } from "@chat/ui/cn";
import { Button } from "@chat/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@chat/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@chat/ui/components/dropdown-menu";
import { ScrollArea } from "@chat/ui/components/scroll-area";
import { Skeleton } from "@chat/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import {
  ChevronDown,
  HashIcon,
  Home,
  LockIcon,
  LogOut,
  Plus,
  User,
} from "@chat/ui/icons";
import { useQuery } from "@tanstack/react-query";
import {
  createLazyFileRoute,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { meQueries } from "~/common/keys/me";
import { AddChannelDialog } from "~/components/channels/add-channel-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { UserAvatar } from "~/components/user-avatar";
import { SessionProvider } from "~/contexts/session";
import {
  useWorkspaceContextStore,
  WorkspaceProvider,
} from "~/contexts/workspace";
import { WebSocketProvider } from "~/contexts/ws";
import { useSessionStore } from "~/hooks/use-session";
import { useSession } from "~/hooks/use-workspace";
import { getInitials } from "~/utils/initials";
import * as React from "react";

export const Route = createLazyFileRoute("/workspace/$wSlug")({
  component: WorkspacePage,
  pendingComponent: () => {
    return "loading...";
  },
});

function WorkspacePage() {
  const params = Route.useParams();

  return (
    <SessionProvider workspace={params.wSlug}>
      <WorkspaceProvider workspace={params.wSlug}>
        <WebSocketProvider workspace={params.wSlug}>
          <main className="flex h-screen max-h-screen flex-col overflow-y-hidden">
            <header className="h-9 flex-shrink-0 bg-background"> </header>
            <div className="flex max-h-[inherit] flex-grow">
              <WorkspaceSidebar />

              <ResizablePanelGroup
                autoSaveId={"chat-app-layout-persistance"}
                direction="horizontal"
                className="max-h-[inherit] overflow-hidden rounded-md border-l-2 border-t-2 border-border"
              >
                <ResizablePanel
                  tagName="aside"
                  defaultSize={22}
                  minSize={15}
                  maxSize={25}
                  className="flex flex-1 flex-col bg-zinc-50/60"
                >
                  <Sidebar />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel>
                  <Outlet />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </main>
        </WebSocketProvider>
      </WorkspaceProvider>
    </SessionProvider>
  );
}

function WorkspaceSidebar() {
  return (
    <aside className="flex w-16 flex-shrink-0 flex-col items-center justify-between pb-4 pt-2">
      <div className="flex flex-grow flex-col space-y-8">
        <WorkspaceMenu />
        <button className="group flex size-11 flex-col items-center justify-center">
          <span className="flex flex-col items-center justify-center rounded-md bg-muted p-2 transition-transform hover:bg-accent group-hover:scale-110">
            <Home className="size-4 md:size-5" />
          </span>
          <span className="mt-1 text-xs font-semibold">Home</span>
        </button>
      </div>
      <UserMenu />
    </aside>
  );
}

function WorkspaceMenu() {
  const workspace = useWorkspaceContextStore((state) => state.workspace);

  const initials = React.useMemo(() => {
    if (!workspace) return "";
    if (!workspace.name) return "";

    return getInitials(workspace.name);
  }, [workspace]);

  const name = workspace?.name ?? "";
  const description = workspace?.description ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex size-11 items-center justify-center rounded-md bg-muted">
          <span className="text-xl font-bold uppercase tracking-tight">
            {initials}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" side="bottom" align="start">
        <div className="p-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <div className="group space-x-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted group-hover:bg-accent">
                <span className="text-xs font-bold uppercase tracking-tight">
                  {initials}
                </span>
              </div>
              <div>
                <span className="font-medium">{name}</span>
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Plus className="mr-2 size-4" /> Add workspace
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const user = useSessionStore((state) => state.user);
  const workspaceName = useWorkspaceContextStore(
    (state) => state.workspace?.name,
  );

  const initials = React.useMemo(() => {
    if (!user) return "";
    if (!user.name) return "";

    return getInitials(user.name);
  }, [user]);

  const name = user?.name ?? "";
  const avatarUrl = user?.avatarUrl ?? "";
  const username = user?.username ?? "";
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Avatar className="rounded-md">
                <AvatarImage src={avatarUrl} alt={`@${username}`} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent align="center" side="right">
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-60" side="right" align="end">
        <div className="flex items-center space-x-2 p-2">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={avatarUrl} alt={`@${username}`} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 size-4" />
            Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <LogOut className="mr-2 size-4" /> Sign out of {workspaceName ?? ""}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar() {
  const workspaceName = useWorkspaceContextStore(
    (state) => state.workspace?.name,
  );
  return (
    <>
      <header className="sticky top-0 bg-transparent px-2 py-2">
        <h2>{workspaceName ?? ""}</h2>
      </header>
      <ScrollArea>
        <div className="space-y-4 px-2 py-6">
          <ChannelColllapsible />
          <DirectMessagesColllapsible />
        </div>
      </ScrollArea>
    </>
  );
}

function useChatRouteParams() {
  const params = Route.useParams();
  const matchRoute = useMatchRoute();
  const match = matchRoute({
    to: "/workspace/$wSlug/$slug",
    params: { wSlug: params.wSlug },
  });

  return match !== false ? { slug: match.slug, wSlug: match.wSlug } : {};
}

function ChannelColllapsible() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const chatParams = useChatRouteParams();

  const { data, isLoading } = useQuery(
    meQueries.channels({ workspace: params.wSlug }),
  );

  const channels = data?.data.channels ?? [];

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center space-x-1 px-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="group size-5 p-0">
            <ChevronDown className="size-4 transition-transform group-data-[state='closed']:-rotate-90" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
        <h4 className="text-sm font-medium">Channels</h4>
      </div>

      <CollapsibleContent>
        {isLoading &&
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="mb-1 h-6 w-full" />
          ))}

        {!isLoading &&
          !!channels.length &&
          channels.map((c) => (
            <SidebarColllapsibleItem
              key={c.id}
              data-status={c.slug === chatParams?.slug && "active"}
              onClick={() => {
                navigate({
                  to: "/workspace/$wSlug/$slug",
                  params: { wSlug: params.wSlug, slug: c.slug },
                });
              }}
            >
              <span className="mr-1 flex size-5 flex-shrink-0 items-center justify-center">
                {c.isPrivate ? (
                  <LockIcon className="size-4" />
                ) : (
                  <HashIcon className="size-4" />
                )}
              </span>
              <span className="">{c.name}</span>
            </SidebarColllapsibleItem>
          ))}

        <AddChannelDialog workspace={params.wSlug}>
          <button
            type="button"
            className="group inline-flex w-full select-none items-center rounded-md px-2 py-1 text-sm outline-none transition-colors hover:bg-muted"
          >
            <div className="mr-1 flex size-5 items-center justify-center rounded-md bg-secondary">
              <Plus className="size-4" />
            </div>
            Add channel
          </button>
        </AddChannelDialog>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DirectMessagesColllapsible() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const chatParams = useChatRouteParams();

  const { data: sessionData } = useSession(params.wSlug);
  const { data, isLoading } = useQuery(
    meQueries.dms({ workspace: params.wSlug }),
  );

  const user = React.useMemo(() => {
    if (!sessionData) return null;
    if (!sessionData.data.user) return null;

    return sessionData.data.user;
  }, [sessionData]);

  const dms = React.useMemo(() => {
    if (!data || !user) return [];
    if (!data.data.dms) return [];

    return data.data.dms.map((dm) => {
      const initials = getInitials(dm.name);

      return {
        ...dm,
        initials,
        isYou: dm.id === user.id,
      };
    });
  }, [data, user]);

  return (
    <Collapsible defaultOpen>
      <div className="flex items-center space-x-1 px-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="group size-5 p-0">
            <ChevronDown className="size-4 transition-transform group-data-[state='closed']:-rotate-90" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
        <h4 className="text-sm font-medium">Direct Messages</h4>
      </div>

      <CollapsibleContent>
        {isLoading &&
          Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="mb-1 h-6 w-full" />
          ))}

        {!isLoading &&
          !!dms.length &&
          dms.map((dm) => (
            <SidebarColllapsibleItem
              key={dm.id}
              data-status={dm.slug === chatParams?.slug && "active"}
              onClick={() => {
                navigate({
                  to: "/workspace/$wSlug/$slug",
                  params: { wSlug: params.wSlug, slug: dm.slug },
                });
              }}
            >
              <UserAvatar
                avatarUrl={dm.avatarUrl}
                username={dm.username}
                name={dm.name}
              />

              <span>
                {dm.name}
                {dm.isYou && <span className="ml-1 opacity-60">(You)</span>}
              </span>
            </SidebarColllapsibleItem>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

type SidebarColllapsibleItemProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

const SidebarColllapsibleItem = React.forwardRef<
  HTMLButtonElement,
  SidebarColllapsibleItemProps
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group inline-flex w-full select-none items-center rounded-md px-2 py-1 text-sm outline-none transition-colors hover:bg-muted data-[status=active]:bg-primary data-[status=active]:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
});
SidebarColllapsibleItem.displayName = "SidebarColllapsibleItem";
