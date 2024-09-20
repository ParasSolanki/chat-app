import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { env } from "~/env";
import * as React from "react";

const TanStackRouterDevtools =
  env.ENVIRONMENT === "production"
    ? () => null // Render nothing in production
    : React.lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: Root,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <>
      <Outlet />

      <React.Suspense>
        <TanStackRouterDevtools position="top-left" />
      </React.Suspense>
    </>
  );
}

function NotFound() {
  console.log("not found here");
  return <div>Not found global</div>;
}
