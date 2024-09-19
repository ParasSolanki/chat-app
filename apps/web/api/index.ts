import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "../env";
import { wss } from "./wss";

const BASE_URL = env.BASE_URL;

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    console.log(
      `Server is running on ${env.ENVIRONMENT === "development" ? `http://localhost:${info.port}` : BASE_URL}`
    );
  }
);

server.on("upgrade", async (request, socket, head) => {
  const url = new URL(request.url ?? "/", env.BASE_URL ?? "http://localhost");
  const workspace = url.searchParams.get("workspace");

  if (!workspace) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  } else {
    wss.handleUpgrade(request, socket, head);
  }
});
