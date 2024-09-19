import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace")({
  beforeLoad: () => {
    // TODO: authorize user
  },
});
