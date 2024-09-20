import { createLazyFileRoute, Navigate } from "@tanstack/react-router";
import { useSessionStore } from "~/hooks/use-session";

export const Route = createLazyFileRoute("/workspace/$wSlug/")({
  component: WorkspacePage,
});

function WorkspacePage() {
  const slug = useSessionStore((state) => state.user?.slug);
  const params = Route.useParams();

  if (slug) {
    return (
      <Navigate
        to="/workspace/$wSlug/$slug"
        params={{ slug, wSlug: params.wSlug }}
      />
    );
  }

  return <div>Workspace</div>;
}
