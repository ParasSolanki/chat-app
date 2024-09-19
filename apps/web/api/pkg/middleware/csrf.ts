import { createMiddleware } from "hono/factory";
import { verifyRequestOrigin } from "oslo/request";
import { forbiddenError } from "../errors/http";
import { env } from "../../../env";

export function csrf() {
  return createMiddleware(async (c, next) => {
    if (c.req.method === "GET") {
      return next();
    }

    const originHeader = c.req.header("Origin") ?? null;
    const hostHeader = c.req.header("Host") ?? null;

    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader, env.BASE_URL])
    ) {
      return forbiddenError(c);
    }

    return next();
  });
}
