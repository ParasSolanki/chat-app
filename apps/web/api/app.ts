import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./pkg/create-app";
import type { UpgradeWebSocket } from "hono/ws";
import { route as redirectRoutes } from "./routes/redirect.route";
import { route as sessionRoutes } from "./routes/session.route";
import { route as workspaceRoutes } from "./routes/workspaces.route";
import { route as messagesRoutes } from "./routes/messages.route";
import { route as channelRoutes } from "./routes/channels.route";
import { route as memberRoutes } from "./routes/members.route";
import { route as meRoutes } from "./routes/me.route";

const upgradeWebsocket: UpgradeWebSocket = () =>
  async function (c, next) {
    if (c.req.header("upgrade") !== "websocket") {
      // Not websocket
      await next();
      return;
    }

    return new Response();
  };

export const app = createApp()
  .route("/ssb/redirect", redirectRoutes)
  .route("/api/me", meRoutes)
  .route("/api/session", sessionRoutes)
  .route("/api/workspaces", workspaceRoutes)
  .route("/api/messages", messagesRoutes)
  .route("/api/channels", channelRoutes)
  .route("/api/members", memberRoutes)
  .get("/api/health", (c) => c.json({ ok: true, code: "OK" }, 200))
  .get(
    "/ws",
    upgradeWebsocket(() => {
      return {
        onClose: () => {},
        onMessage: () => {},
        onOpen: () => {},
        onError: () => {},
      };
    })
  );

app.get(
  "/static/*",
  serveStatic({
    root: "./",
    rewriteRequestPath: (path) => path.replace(/^\/static/, "/public"),
  })
);

app.get("*", serveStatic({ root: "./web/dist" }));
app.get("*", serveStatic({ path: "./web/dist/index.html" }));

export type AppType = typeof app;
