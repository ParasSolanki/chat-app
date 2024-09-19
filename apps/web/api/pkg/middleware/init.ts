import { createMiddleware } from "hono/factory";
import { ConsoleLogger } from "../logger";
import type { LogSchema } from "../logger";
import { env } from "../../../env";
import { createDB } from "../db";

let logger: ConsoleLogger | null = null;

type LoggerOptions = {
  environment: LogSchema["environment"];
  requestId: LogSchema["requestId"];
};

function createOrGetConsoleLogger(opts: LoggerOptions) {
  if (logger) {
    logger.setRequestId(opts.requestId);
    return logger;
  }

  logger = new ConsoleLogger({
    environment: opts.environment,
    requestId: opts.requestId,
  });

  return logger;
}

export function init() {
  return createMiddleware(async (c, next) => {
    const start = performance.now();
    const pathname = new URL(c.req.url).pathname;
    const message = `${c.req.method} ${pathname}`;

    const requestId = crypto.randomUUID();

    const logger = createOrGetConsoleLogger({
      environment: env.ENVIRONMENT,
      requestId,
    });

    c.set("db", createDB());
    c.set("logger", logger);
    c.set("requestId", requestId);
    c.header("X-Request-Id", requestId);

    logger.info(message);

    await next();

    const status = (c.res.status / 100) | 0;
    const executionDuration = performance.now() - start;

    if (status >= 4) {
      logger.error(message, { executionDuration, statusCode: c.res.status });
    } else {
      logger.info(message, { executionDuration, statusCode: c.res.status });
    }
  });
}
