import { createFileRoute, notFound } from "@tanstack/react-router";
import { channelQueries } from "~/common/keys/channel";
import { memberQueries } from "~/common/keys/member";

export const Route = createFileRoute("/workspace/$wSlug/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const isDM = params.slug.startsWith("D");
    const isChannel = params.slug.startsWith("C");

    if (!isDM && !isChannel) {
      throw notFound({ _global: false });
    }

    if (isDM) {
      await queryClient.ensureQueryData(
        memberQueries.details({
          workspace: params.wSlug,
          member: params.slug,
        }),
      );
    }

    if (isChannel) {
      await queryClient.ensureQueryData(
        channelQueries.details({
          workspace: params.wSlug,
          channel: params.slug,
        }),
      );
    }
  },
});
