import { createFileRoute } from "@tanstack/react-router";
import { sessionQueries } from "~/common/keys/session";
import { workspaceQueries } from "~/common/keys/workspaces";
import { env } from "~/env";
import { HTTPError } from "ky";

export const Route = createFileRoute("/workspace/$wSlug")({
  loader: async ({ context: { queryClient }, params }) => {
    const session = await queryClient.ensureQueryData(
      sessionQueries.session({ workspace: params.wSlug }),
    );
    const workspace = await queryClient.ensureQueryData(
      workspaceQueries.details({ workspace: params.wSlug }),
    );

    return {
      user: session.data.user,
      workspace: workspace.data.workspace,
    };
  },
  onError: (error) => {
    if (error instanceof HTTPError && error.response.status === 403) {
      window.location.href = env.VITE_PUBLIC_WEBSITE_URL;
    }
  },
  meta: ({ loaderData }) => [{ title: loaderData.workspace.name }],
});
