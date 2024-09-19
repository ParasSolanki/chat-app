import { Button } from "@chat/ui/components/button.tsx";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@chat/ui/components/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@chat/ui/components/dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@chat/ui/components/dropdown-menu.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@chat/ui/components/tabs.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip.tsx";
import { Clipboard, EllipsisVerticalIcon } from "@chat/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { channelQueries } from "~/common/keys/channel";
import { format } from "date-fns";
import * as React from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

type ChannelToolbarProps = {
  workspace: string;
  channelSlug: string;
};
export default function ChannelToolbar(props: ChannelToolbarProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, copy] = useCopyToClipboard();
  const [open, setOpen] = React.useState(false);
  const { data } = useSuspenseQuery(
    channelQueries.details({
      workspace: props.workspace,
      channel: props.channelSlug,
    }),
  );

  const channel = data.data.channel;

  const handleCopyName = React.useCallback(() => {
    toast.promise(copy(channel.name), {
      success: "Name copied",
      error: "Something went wrong",
    });
  }, [copy, channel.name]);

  const handleCopyLink = React.useCallback(() => {
    toast.promise(copy(window.location.href), {
      success: "Link copied",
      error: "Something went wrong",
    });
  }, [copy]);

  const handleCopyChannelId = React.useCallback(() => {
    toast.promise(copy(channel.slug), {
      success: "Channel id copied",
      error: "Something went wrong",
    });
  }, [copy, channel.slug]);

  return (
    <div
      role="toolbar"
      aria-label="Actions"
      className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3"
    >
      <button
        type="button"
        className="flex items-center space-x-1 hover:bg-accent"
        onClick={() => setOpen(true)}
      >
        <h2 className="text-base font-bold tracking-tight">{channel.name}</h2>
      </button>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 p-0">
                  <EllipsisVerticalIcon aria-hidden="true" className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>More actions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Open channel details
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Copy</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={handleCopyName}>
                    Copy name
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleCopyLink}>
                    Copy link
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>Open in new window</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-primary-foreground">
              Leave channel
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-lg font-bold tracking-tight lg:text-xl">
              {channel.name}
            </DialogTitle>
            <DialogDescription>{channel.description}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="about" className="relative mr-auto w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger
                value="about"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 text-sm font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 text-sm font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Members
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 text-sm font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="about"
              className="mt-0 space-y-3 bg-muted px-6 pb-6 pt-2"
            >
              <Card>
                <CardHeader className="space-y-0 p-4">
                  <CardTitle className="text-sm">Description</CardTitle>
                  <CardDescription>
                    {channel.description ?? "Add a description"}
                  </CardDescription>
                </CardHeader>
              </Card>

              {channel.createdBy && (
                <Card>
                  <CardHeader className="space-y-0 p-4">
                    <CardTitle className="text-sm">Created by</CardTitle>
                    <CardDescription>
                      {channel.createdBy.name} on{" "}
                      {format(channel.createdAt, "PPP")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <div className="flex items-center text-sm text-muted-foreground">
                <p>Channel Id: {channel.slug}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-3 p-0"
                  onClick={handleCopyChannelId}
                >
                  <Clipboard aria-hidden="true" className="size-3" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent
              value="members"
              className="mt-0 space-y-4 bg-muted px-6 pb-6 pt-2"
            >
              Members
            </TabsContent>
            <TabsContent
              value="settings"
              className="mt-0 space-y-4 bg-muted px-6 pb-6 pt-2"
            >
              <div>
                <Button variant="destructive" size="sm">
                  Archive channel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
