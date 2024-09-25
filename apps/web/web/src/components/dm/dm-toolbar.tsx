import { Button } from "@chat/ui/components/button";
import { Card, CardHeader, CardTitle } from "@chat/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@chat/ui/components/dialog";
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
} from "@chat/ui/components/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@chat/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@chat/ui/components/tooltip";
import { Clipboard, EllipsisVerticalIcon } from "@chat/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { memberQueries } from "~/common/keys/member";
import * as React from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { UserAvatar } from "../user-avatar";

type DMToolbarProps = {
  workspace: string;
  memberSlug: string;
};

export default function DMToolbar(props: DMToolbarProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, copy] = useCopyToClipboard();
  const [open, setOpen] = React.useState(false);
  const { data } = useSuspenseQuery(
    memberQueries.details({
      workspace: props.workspace,
      member: props.memberSlug,
    }),
  );

  const member = data.data.member;

  const handleCopyName = React.useCallback(() => {
    toast.promise(copy(member.name), {
      success: "Name copied",
      error: "Something went wrong",
    });
  }, [copy, member.name]);

  const handleCopyLink = React.useCallback(() => {
    toast.promise(copy(window.location.href), {
      success: "Link copied",
      error: "Something went wrong",
    });
  }, [copy]);

  const handleCopyMemberId = React.useCallback(() => {
    toast.promise(copy(member.slug), {
      success: "Member id copied",
      error: "Something went wrong",
    });
  }, [copy, member.slug]);

  return (
    <>
      <button
        type="button"
        className="flex items-center space-x-1 hover:bg-accent"
        onClick={() => setOpen(true)}
      >
        <UserAvatar
          avatarUrl={member.avatarUrl}
          username={member.username}
          name={member.name}
          className="size-6"
        />
        <h2 className="text-base font-bold tracking-tight">{member.name}</h2>
      </button>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 p-0">
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
              Open conversation details
            </DropdownMenuItem>
            <DropdownMenuItem>View full profile</DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <div className="flex items-center space-x-2">
              <UserAvatar
                avatarUrl={member.avatarUrl}
                username={member.username}
                name={member.name}
                className="size-16"
              />
              <DialogTitle className="text-lg font-bold tracking-tight lg:text-xl">
                {member.name}
              </DialogTitle>
              <DialogDescription className="hidden">
                {`${member.name}'s profile details`}
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs defaultValue="about" className="relative mr-auto w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6">
              <TabsTrigger
                value="about"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 text-sm font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                About
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="about"
              className="mt-0 space-y-4 bg-muted px-6 pb-6 pt-2"
            >
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">Email</CardTitle>
                  <a
                    href={`mailto:${member.email}`}
                    className="w-max text-sm text-muted-foreground text-sky-500 hover:underline hover:underline-offset-2 focus:underline focus:underline-offset-2"
                  >
                    {member.email}
                  </a>
                </CardHeader>
              </Card>

              <div className="flex items-center text-sm text-muted-foreground">
                <p>Member Id: {member.slug}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 size-3 p-0"
                  onClick={handleCopyMemberId}
                >
                  <Clipboard aria-hidden="true" className="size-3" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
