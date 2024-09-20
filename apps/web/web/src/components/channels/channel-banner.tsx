import { Skeleton } from "@chat/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { channelQueries } from "~/common/keys/channel";
import type { ChatMessageData } from "~/types";
import { format } from "date-fns";
import type { Components as VirtuosoComponents } from "react-virtuoso";

function ChannelBannerSkeleton() {
  return (
    <div className="space-y-2 p-5">
      <div className="flex items-center space-x-2">
        <Skeleton className="size-8" />
        <Skeleton className="h-8 w-24 md:w-32 lg:w-40" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

type Props = {
  wSlug: string;
  slug: string;
};

type ChannelBannerComponent = VirtuosoComponents<
  ChatMessageData,
  Props
>["Header"];

export const ChannelBanner: ChannelBannerComponent = (props) => {
  const { data, isLoading } = useQuery(
    channelQueries.details({
      workspace: props.context!.wSlug,
      channel: props.context!.slug,
    }),
  );

  if (isLoading) return <ChannelBannerSkeleton />;

  const channel = data?.data.channel;

  if (!channel) return "no data";

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold tracking-tight">
        <span className="mr-0.5">#</span> {channel.name}
      </h2>
      <p className="mt-1 text-lg text-muted-foreground">
        @{channel.createdBy?.username} created this channel on{" "}
        {format(channel.createdAt, "PPP")}. This is the very beginning of the{" "}
        {channel.name} channel. {channel.description} (Edit description)
      </p>
    </div>
  );
};
