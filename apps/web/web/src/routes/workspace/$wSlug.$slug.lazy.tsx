import { cn } from "@chat/ui/cn";
import { Badge } from "@chat/ui/components/badge";
import { Skeleton } from "@chat/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import {
  EllipsisVerticalIcon,
  Forward,
  MessageSquareText,
} from "@chat/ui/icons";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createLazyFileRoute, Navigate } from "@tanstack/react-router";
import { messagesKeys, messagesQueries } from "~/common/keys/messages";
import { ChannelBanner } from "~/components/channels/channel-banner";
import { DMBanner } from "~/components/dm/dm-banner";
import { Editor } from "~/components/editor/editor";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import {
  Menubar,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "~/components/ui/menubar";
import { UserAvatar } from "~/components/user-avatar";
import { LexicalProvider } from "~/contexts/lexical";
import { useSessionStore } from "~/hooks/use-session";
import { useWebSocketStore } from "~/hooks/use-ws";
import { BaseMessage, ChatMessageData, Message } from "~/types";
import { client } from "~/utils/api";
import {
  differenceInMinutes,
  format,
  isEqual,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
} from "date-fns";
import { LexicalEditor } from "lexical";
import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Virtuoso } from "react-virtuoso";
import { toast } from "sonner";

const DMToolbar = React.lazy(() => import("~/components/dm/dm-toolbar"));
const ChannelToolbar = React.lazy(
  () => import("~/components/channels/channel-toolbar"),
);

export const Route = createLazyFileRoute("/workspace/$wSlug/$slug")({
  component: Page,
  notFoundComponent: NotFound,
});

function Page() {
  return (
    <div
      className="relative flex max-h-[calc(100vh_-_44px)] min-h-0 min-w-0 flex-1 flex-col"
      role="group"
    >
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <React.Suspense fallback={<ToolbarLoading />}>
          <Toolbar />
        </React.Suspense>
      </ErrorBoundary>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1">
          <Chat />
        </div>
        <div className="relative z-50 flex-shrink-0 px-5">
          <div></div>
          <div>
            <ChatEditor />
          </div>
          <div className="flex flex-shrink-0 items-center justify-between p-1 text-xs text-muted-foreground">
            <p className="">{/* user is typing... */}</p>
            <p>
              <strong>
                <kbd>Shift</kbd> + <kbd>Enter</kbd>
              </strong>{" "}
              to add a new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  const slug = useSessionStore((state) => state.user?.slug);
  const params = Route.useParams();

  // Redirect to current user details if not found

  if (slug) {
    return (
      <Navigate
        to="/workspace/$wSlug/$slug"
        params={{ slug, wSlug: params.wSlug }}
      />
    );
  }

  return <div>Not found</div>;
}

function ToolbarLoading() {
  return (
    <div
      role="toolbar"
      aria-label="Actions"
      className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3"
    >
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-6 w-6" />
    </div>
  );
}

function chatKey(slug: string) {
  return slug.startsWith("D") ? "recipient" : "channel";
}

function useInvalidateChatMessages() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const key = chatKey(params.slug);

  const invalidate = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: messagesKeys.listInfinite({
        workspace: params.wSlug,
        [key]: params.slug,
      }),
    });
  }, [key, params.slug, params.wSlug, queryClient]);
  return invalidate;
}

function useChatMessages({
  workspace,
  slug,
}: {
  workspace: string;
  slug: string;
}) {
  const key = chatKey(slug);

  return useInfiniteQuery(
    messagesQueries.listInfinite({
      workspace,
      [key]: slug,
    }),
  );
}

function getFormattedTime(datetime: string) {
  const isoDatetime = parseISO(datetime);
  const time = format(isoDatetime, "hh:mm aa");

  if (isToday(isoDatetime)) return `Today at ${time}`;
  else if (isYesterday(isoDatetime)) return `Yesterday at ${time}`;

  return `${format(isoDatetime, "PPP")} at ${time}`;
}

const COMPACT_INTERVAL_MINUTES = 10;

function Toolbar() {
  const params = Route.useParams();
  const key = chatKey(params.slug);

  if (key === "recipient")
    return <DMToolbar workspace={params.wSlug} memberSlug={params.slug} />;

  return <ChannelToolbar workspace={params.wSlug} channelSlug={params.slug} />;
}

function Loading() {
  return (
    <p className="text-center text-xs text-muted-foreground">loading...</p>
  );
}

function Chat() {
  const params = Route.useParams();

  const { isLoading, data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useChatMessages({
      workspace: params.wSlug,
      slug: params.slug,
    });

  const groups = React.useMemo(() => {
    if (!data) return [];
    if (!data.pages.length) return [];

    const messages = data.pages.flatMap((page) => page.data.messages).reverse();
    const groups = [] as Array<ChatMessageData>;
    let currentDate = null;

    for (let index = 0; index < messages.length; index++) {
      const m = messages[index] as BaseMessage;
      const messageDate = startOfDay(new Date(m.createdAt));

      if (!currentDate || !isEqual(currentDate, messageDate)) {
        currentDate = messageDate;
        groups.push({
          type: "group",
          date: format(messageDate, "yyyy-MM-dd"),
          id: `group-${format(messageDate, "yyyy-MM-dd")}`,
        });
      }

      const prevMessage = messages[index - 1];
      const isCompact =
        prevMessage &&
        prevMessage.sender?.id === m.sender?.id &&
        differenceInMinutes(
          new Date(m.createdAt),
          new Date(prevMessage.createdAt),
        ) <= COMPACT_INTERVAL_MINUTES;

      const message = Object.assign({}, m, { isCompact });
      groups.push(message);
    }

    return groups;
  }, [data]);

  const firstItemIndex = React.useMemo(() => {
    if (!groups.length) return Number.MAX_SAFE_INTEGER;

    return Number.MAX_SAFE_INTEGER - groups.length;
  }, [groups]);

  const Header = React.useMemo(() => {
    if (!isLoading && !hasNextPage && !isFetchingNextPage) {
      const key = chatKey(params.slug);
      return key === "recipient" ? DMBanner : ChannelBanner;
    }

    return Loading;
  }, [hasNextPage, isLoading, isFetchingNextPage, params.slug]);

  return (
    <Virtuoso
      key={params.slug}
      style={{ height: "100%" }}
      overscan={400}
      components={{ Header }}
      alignToBottom
      data={groups}
      context={{ wSlug: params.wSlug, slug: params.slug }}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={groups.length - 1}
      startReached={() => fetchNextPage()}
      itemContent={(_, m) => {
        if (m.type === "message") {
          return <ChatMessage message={m} compact={m.isCompact} />;
        }

        return (
          <div>
            <div className="my-1 flex items-center text-sm uppercase text-muted-foreground before:h-[1px] before:flex-1 before:bg-muted-foreground/30 after:h-[1px] after:flex-1 after:bg-muted-foreground/30">
              <Badge variant="outline">{m.date}</Badge>
            </div>
          </div>
        );
      }}
    />
  );
}

type ChatMessageProps = {
  message: Message;
  compact?: boolean;
};

const ChatMessage = React.memo(function Message(props: ChatMessageProps) {
  const params = Route.useParams();
  const invalidate = useInvalidateChatMessages();
  const [mode, setMode] = React.useState<"view" | "edit">("view");
  const userId = useSessionStore((state) => state.user?.id);
  const editorRef = React.useRef<LexicalEditor | null>(null);

  const { mutate, isPending } = useMutation({
    mutationKey: [
      "messages",
      "update",
      { slug: props.message.slug, id: props.message.id },
    ],
    mutationFn: async (body: string) => {
      const response = await client.api.messages.messages[":slug"].$put({
        param: {
          slug: props.message.slug,
        },
        query: {
          workspace: params.wSlug,
        },
        json: {
          type: "message",
          body,
        },
      });

      if (!response.ok) throw new Error("Something went wrong");

      return await response.json();
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      toast.error("Something went wrong while updating message");
    },
  });

  const { mutate: mutateDelete } = useMutation({
    mutationKey: [
      "messages",
      "delete",
      { slug: props.message.slug, id: props.message.id },
    ],
    mutationFn: async () => {
      const response = await client.api.messages.messages[":slug"].$delete({
        param: {
          slug: props.message.slug,
        },
        query: {
          workspace: params.wSlug,
        },
      });

      if (!response.ok) throw new Error("Something went wrong");

      return await response.json();
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      toast.error("Something went wrong while deleting message");
    },
  });

  const handleOnCancel = React.useCallback(() => {
    setMode("view");
    editorRef.current?.setEditable(false);

    if (props.message.body) {
      editorRef.current?.setEditorState(
        editorRef.current?.parseEditorState(props.message.body),
      );
    }
  }, [props.message.body]);

  const handleOnEditMessage = React.useCallback(() => {
    setMode("edit");
    editorRef.current?.setEditable(true);
  }, []);

  const handleOnMount = React.useCallback((editor: LexicalEditor) => {
    editorRef.current = editor;
  }, []);

  const handleOnSave = React.useCallback(
    (json: string) => {
      setMode("view");
      editorRef.current?.setEditable(false);
      mutate(json);
    },
    [mutate],
  );

  const isMe = React.useMemo(() => {
    return props.message.sender?.id === userId;
  }, [props.message.sender?.id, userId]);

  const formattedUpdatedAt = React.useMemo(() => {
    if (!props.message.updatedAt) return "";

    return getFormattedTime(props.message.updatedAt);
  }, [props.message.updatedAt]);

  return (
    <HoverCard openDelay={10} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div
          id={props.message.slug}
          className={cn(
            "group flex items-start space-x-2 px-5",
            props.compact ? "py-0.5" : "py-1.5",
            mode === "view" && "hover:bg-muted",
            mode === "edit" && "bg-primary/5",
          )}
        >
          <div className="w-10 flex-shrink-0">
            {!props.compact && props.message.sender ? (
              <UserAvatar
                username={props.message.sender.username}
                avatarUrl={props.message.sender?.avatarUrl}
                name={props.message.sender.name}
                className="size-10"
              />
            ) : (
              <ChatMessageTime
                datetime={props.message.createdAt}
                className="mt-0.5 text-center opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
          </div>
          <div className="flex-grow">
            {!props.compact && (
              <div className="flex items-center space-x-1">
                <p className="text-sm font-black tracking-tight">
                  {props.message.sender?.name}
                </p>
                <ChatMessageTime datetime={props.message.createdAt} />
              </div>
            )}
            <LexicalProvider
              initialConfig={{
                editable: false,
                namespace: props.message.id,
                onError(error) {
                  console.log(error);
                },
                editorState(editor) {
                  if (props.message.body) {
                    editor.setEditorState(
                      editor.parseEditorState(props.message.body),
                    );
                  }
                },
              }}
            >
              {isPending && (
                <p className="text-xs text-muted-foreground">updating...</p>
              )}
              <Editor
                mode={mode}
                placeholder="Add message"
                onMount={handleOnMount}
                onSave={handleOnSave}
                onCancel={handleOnCancel}
              />
              {props.message.updatedAt && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs leading-normal text-muted-foreground">
                        (edited)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formattedUpdatedAt}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </LexicalProvider>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="end"
        alignOffset={20}
        sideOffset={-20}
        className="w-max"
        asChild
      >
        <Menubar className="w-max p-1">
          <MenubarMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarTrigger className="p-2">
                    <MessageSquareText className="size-4" />
                  </MenubarTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reply in Thread</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </MenubarMenu>
          <MenubarMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarTrigger className="p-2">
                    <Forward className="size-4" />
                  </MenubarTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Forward message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </MenubarMenu>
          <MenubarMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MenubarTrigger className="p-2">
                    <EllipsisVerticalIcon className="size-4" />
                  </MenubarTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More actions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <MenubarContent>
              <MenubarItem>Copy link</MenubarItem>

              {isMe && (
                <MenubarGroup>
                  <MenubarSeparator />
                  <MenubarItem onSelect={handleOnEditMessage}>
                    Edit message
                  </MenubarItem>
                  <MenubarItem
                    className="text-destructive focus:bg-destructive focus:text-primary-foreground"
                    onSelect={() => mutateDelete()}
                  >
                    Delete
                  </MenubarItem>
                </MenubarGroup>
              )}
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </HoverCardContent>
    </HoverCard>
  );
});

const ChatMessageTime = React.memo(function Time(props: {
  datetime: string;
  className?: string;
}) {
  const text = React.useMemo(() => {
    return getFormattedTime(props.datetime);
  }, [props.datetime]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p
            className={cn(
              "text-xs text-muted-foreground hover:underline hover:underline-offset-2",
              props.className,
            )}
          >
            {format(new Date(props.datetime), "hh:mm")}
          </p>
        </TooltipTrigger>
        <TooltipContent>
          <span>{text}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

function ChatEditor() {
  const params = Route.useParams();
  const queryClient = useQueryClient();
  const key = chatKey(params.slug);
  const ws = useWebSocketStore((state) => state.ws);
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const { mutate } = useMutation({
    mutationKey: [
      "messages",
      key,
      "create",
      { workspace: params.wSlug, slug: params.slug },
    ],
    mutationFn: async (body: string) => {
      const response = await client.api.messages.messages.$post({
        query: {
          workspace: params.wSlug,
        },
        json: {
          [key]: params.slug,
          message: {
            type: "message",
            body,
          },
        },
      });

      if (!response.ok) throw new Error("Something went wrong");

      return await response.json();
    },
    onSuccess: (data) => {
      if (!isConnected || !ws) return;
      const message = data.data.message;

      if (!message.body) return;

      queryClient.invalidateQueries({
        queryKey: messagesKeys.listInfinite({
          workspace: params.wSlug,
          [key]: params.slug,
        }),
      });

      ws.send(
        JSON.stringify({
          type: "chat-message",
          workspace: params.wSlug,
          message: {
            id: message.id,
            slug: message.slug,
            body: message.body,
            "client-message-id": crypto.randomUUID(),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          },
        }),
      );
    },
  });

  return (
    <LexicalProvider>
      <Editor onSave={(json) => mutate(json)} />
    </LexicalProvider>
  );
}
