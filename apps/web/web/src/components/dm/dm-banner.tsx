import { Button } from "@chat/ui/components/button.tsx";
import { Skeleton } from "@chat/ui/components/skeleton.tsx";
import { useQuery } from "@tanstack/react-query";
import { memberQueries } from "~/common/keys/member";
import { useSessionStore } from "~/hooks/use-session";
import { UserAvatar } from "../user-avatar";

function DMBannerSkeleton() {
  return (
    <div className="space-y-2 p-5">
      <div className="flex items-center space-x-2">
        <Skeleton className="size-20 lg:size-28" />
        <Skeleton className="h-4 w-24 md:w-32 lg:w-40" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}

type DMBannerProps = {
  context: { wSlug: string; slug: string };
};

export function DMBanner(props: DMBannerProps) {
  const userId = useSessionStore((state) => state.user?.id);
  const { data, isLoading } = useQuery(
    memberQueries.details({
      workspace: props.context.wSlug,
      member: props.context.slug,
    }),
  );
  const member = data?.data.member;

  if (isLoading) return <DMBannerSkeleton />;

  if (!member) return "no data";

  const isMe = member.id === userId;

  return (
    <div className="space-y-2 p-5">
      <div className="flex items-center space-x-2">
        <UserAvatar
          avatarUrl={member.avatarUrl}
          username={member.username}
          name={member.name}
          className="size-28"
        />
        <h2 className="text-2xl font-bold tracking-tight">
          {member.name} {isMe && <span className="opacity-60">(You)</span>}
        </h2>
      </div>
      {!isMe ? (
        <>
          <p className="text-lg text-muted-foreground">
            This conversation is just between{" "}
            <span className="bg-sky-400/20 text-sky-600">
              @{member.username}
            </span>{" "}
            and you. Check out their profile to learn more about them.
          </p>
          <Button variant="outline" size="sm">
            View Profile
          </Button>
        </>
      ) : (
        <>
          <p className="text-lg text-muted-foreground">
            <span className="font-medium">This is your space</span>. Draft
            messages, list your to-dos, or keep links and files handy. You can
            also talk to yourself here, but please bear in mind you'll have to
            supply both sides of the conversation.
          </p>
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
        </>
      )}
    </div>
  );
}
