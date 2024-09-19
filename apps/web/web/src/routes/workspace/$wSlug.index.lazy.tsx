import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/workspace/$wSlug/")({
  component: WorkspacePage,
});

function WorkspacePage() {
  return <div>Workspace</div>;
}
