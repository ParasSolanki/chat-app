import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { Toaster } from "~/components/ui/sonner";
import { useTheme } from "~/hooks/use-theme";
import nProgress from "nprogress";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: "intent",
});

router.subscribe("onBeforeLoad", () => {
  nProgress.start();
});

router.subscribe("onResolved", () => {
  nProgress.done();
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <ReactQueryDevtools position="left" buttonPosition="top-left" />
      <Toaster richColors className="font-sans" position="bottom-right" />
    </QueryClientProvider>
  );
}

function AppRoutes() {
  return <RouterProvider router={router} context={{ queryClient }} />;
}
