import { cn } from "@chat/ui/cn";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { getInitials } from "~/utils/initials";
import * as React from "react";

type UserAvatarProps = {
  avatarUrl: string | null;
  username: string;
  name: string;
  className?: string;
};

export function UserAvatar(props: UserAvatarProps) {
  const initials = React.useMemo(() => {
    if (!props.name) return "";
    return getInitials(props.name);
  }, [props.name]);

  return (
    <Avatar className={cn("mr-1 size-5 rounded-md", props.className)}>
      {props.avatarUrl && (
        <AvatarImage src={props.avatarUrl} alt={`@${props.username}`} />
      )}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
