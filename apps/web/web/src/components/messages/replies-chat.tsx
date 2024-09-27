import { cn } from "@chat/ui/cn";
import { Button } from "@chat/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import { EllipsisVerticalIcon, Forward, XIcon } from "@chat/ui/icons";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { messagesKeys, messagesQueries } from "~/common/keys/messages";
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
import { DropContextProvider } from "~/contexts/drop";
import { useRepliesContextStore } from "~/contexts/replies";
import { useSessionStore } from "~/hooks/use-session";
import { Message } from "~/types";
import { client } from "~/utils/api";
import {
  differenceInMinutes,
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { CLEAR_EDITOR_COMMAND } from "lexical";
import type { LexicalEditor } from "lexical";
import * as React from "react";
import type { Components as VirtuosoComponents } from "react-virtuoso";
import { Virtuoso } from "react-virtuoso";
import { toast } from "sonner";
import { Editor } from "../editor/editor";
import { LexicalProvider } from "../editor/lexical";
import { UserAvatar } from "../user-avatar";

function chatKey(slug: string) {
  return slug.startsWith("D") ? "recipient" : "channel";
}

function getFormattedTime(datetime: string) {
  const isoDatetime = parseISO(datetime);
  const time = format(isoDatetime, "hh:mm aa");

  if (isToday(isoDatetime)) return `Today at ${time}`;
  else if (isYesterday(isoDatetime)) return `Yesterday at ${time}`;

  return `${format(isoDatetime, "PPP")} at ${time}`;
}

function useRepliesChatMessages({
  workspace,
  slug,
  parentSlug,
}: {
  workspace: string;
  slug: string;
  parentSlug?: string;
}) {
  const key = chatKey(slug);

  return useInfiniteQuery(
    messagesQueries.repliesInfinite({
      workspace,
      parentSlug,
      [key]: slug,
    }),
  );
}

function useInvalidateRepliesChatMessages() {
  const queryClient = useQueryClient();
  const workspace = useRepliesContextStore((state) => state.workspace);
  const slug = useRepliesContextStore((state) => state.slug);
  const parentSlug = useRepliesContextStore((state) => state.parentSlug);

  const key = chatKey(slug);

  const invalidate = React.useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: messagesKeys.repliesInfinite({
        workspace,
        parentSlug,
        [key]: slug,
      }),
    });
  }, [key, slug, workspace, queryClient, parentSlug]);

  return invalidate;
}

export function RepliesChatView() {
  const close = useRepliesContextStore((state) => state.close);

  return (
    <DropContextProvider noClick>
      {({ getRootProps, isDragActive }) => (
        <div
          {...getRootProps({
            className: "relative flex min-h-0 flex-1 flex-col",
          })}
        >
          <div
            role="toolbar"
            aria-label="Actions"
            className="relative z-50 flex h-14 flex-shrink-0 items-center justify-between border-b border-border px-4 py-3"
          >
            <h2 className="text-lg font-bold tracking-tight">Thread</h2>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 p-0"
                    onClick={() => close()}
                    aria-label="Close thread"
                  >
                    <XIcon className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span>Close</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <RepliesChat />

          {isDragActive && (
            <div
              data-state={isDragActive ? "open" : "closed"}
              className="absolute inset-0 flex h-full w-full items-center justify-center bg-background/95 data-[state=open]:visible data-[state=closed]:z-[-1px] data-[state=open]:z-50 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            >
              <h3 className="text-bold text-2xl tracking-tight">
                Upload to workspace
              </h3>
            </div>
          )}
        </div>
      )}
    </DropContextProvider>
  );
}

const COMPACT_INTERVAL_MINUTES = 10;

type HeaderProps = {
  parent: Message;
  replies: number;
};

type HeaderComponent = VirtuosoComponents<
  Array<Message>,
  HeaderProps
>["Header"];

const Header: HeaderComponent = (props) => {
  const message = props.context!.parent;
  const replies = props.context!.replies;

  return (
    <div>
      <RepliesChatMessage message={message} compact={false} />

      {replies > 0 && (
        <div
          role="presentation"
          data-orientation="horizontal"
          className="my-1 flex items-center gap-x-2 text-sm capitalize text-muted-foreground before:h-[1px] after:h-[1px] after:flex-1 after:bg-muted-foreground/30"
        >
          {replies > 1 ? `${replies} replies` : `${replies} reply`}
        </div>
      )}
    </div>
  );
};

function RepliesChat() {
  const workspace = useRepliesContextStore((state) => state.workspace);
  const slug = useRepliesContextStore((state) => state.slug);
  const parentSlug = useRepliesContextStore((state) => state.parentSlug);

  const { data, isLoading, fetchPreviousPage } = useRepliesChatMessages({
    workspace,
    slug,
    parentSlug,
  });

  const messages = React.useMemo(() => {
    if (!data) return [];
    if (!data.pages.length) return [];

    const allMessages = data.pages.flatMap((page) => page.data.messages);

    return allMessages.map((m, index) => {
      const prevMessage = allMessages[index - 1];
      const isCompact =
        prevMessage &&
        prevMessage.sender?.id === m.sender?.id &&
        differenceInMinutes(
          new Date(m.createdAt),
          new Date(prevMessage.createdAt),
        ) <= COMPACT_INTERVAL_MINUTES;

      const message = Object.assign({}, m, { isCompact });
      return message;
    });
  }, [data]);

  const context = React.useMemo(() => {
    if (!data) return undefined;
    if (!data.pages.length) return undefined;

    return {
      parent: data.pages[0].data.parent,
      replies: data.pages[0].data.replies,
    };
  }, [data]);

  if (isLoading) return "loading...";

  return (
    <Virtuoso
      style={{ height: "100%" }}
      overscan={400}
      data={messages}
      context={context}
      components={{
        Header,
        Footer,
      }}
      itemContent={(_, m) => (
        <RepliesChatMessage message={m} compact={m.isCompact} />
      )}
    />
  );
}

function Footer() {
  const workspace = useRepliesContextStore((state) => state.workspace);
  const slug = useRepliesContextStore((state) => state.slug);
  const parentSlug = useRepliesContextStore((state) => state.parentSlug);
  const key = chatKey(slug);

  const invalidate = useInvalidateRepliesChatMessages();
  const editorRef = React.useRef<LexicalEditor | null>(null);

  const { mutate } = useMutation({
    mutationKey: ["messages", key, "create", { workspace, slug, parentSlug }],
    mutationFn: async (body: string) => {
      const response = await client.api.messages.messages.$post({
        query: {
          workspace,
        },
        json: {
          [key]: slug,
          parentMessage: parentSlug,
          message: {
            type: "message",
            body,
          },
        },
      });

      if (!response.ok) throw new Error("Something went wrong");

      return await response.json();
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => {
      toast.error("Something went wrong while sending message");
    },
  });

  const handleOnMount = React.useCallback((editor: LexicalEditor) => {
    editorRef.current = editor;
  }, []);

  const handleOnSave = React.useCallback(
    (json: string) => {
      mutate(json);
      editorRef.current?.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      editorRef.current?.focus();
    },
    [mutate],
  );

  return (
    <div className="relative z-50 flex-shrink-0 px-4">
      <div></div>
      <div>
        <LexicalProvider>
          <Editor onMount={handleOnMount} onSave={handleOnSave} />
        </LexicalProvider>
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
  );
}

type RepliesChatMessageProps = {
  message: Message;
  compact?: boolean;
};

const RepliesChatMessage = React.memo(function Message(
  props: RepliesChatMessageProps,
) {
  const workspace = useRepliesContextStore((state) => state.workspace);
  const userId = useSessionStore((state) => state.user?.id);
  const [mode, setMode] = React.useState<"view" | "edit">("view");

  const editorRef = React.useRef<LexicalEditor | null>(null);

  const invalidate = useInvalidateRepliesChatMessages();

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
          workspace,
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
          workspace,
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
              <DropContextProvider>
                <Editor
                  mode={mode}
                  placeholder="Reply"
                  onMount={handleOnMount}
                  onSave={handleOnSave}
                  onCancel={handleOnCancel}
                />
              </DropContextProvider>
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
