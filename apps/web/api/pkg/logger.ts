import { z } from "zod";

const level = z.enum(["debug", "info", "warn", "error", "fatal"]);

const logSchema = z.object({
  type: z.literal("log"),
  level,
  requestId: z.string(),
  timestamp: z.string(),
  message: z.string(),
  environment: z.enum([
    "test",
    "development",
    "preview",
    "canary",
    "production",
    "unknown",
  ]),
  context: z.record(z.any()),
});

export type LogSchema = z.output<typeof logSchema>;

type Level = z.output<typeof level>;

class Log<TLog extends LogSchema> {
  public readonly log: TLog;

  constructor(log: TLog) {
    this.log = log;
  }

  public toString(): string {
    return JSON.stringify(this.log);
  }
}

type Fields = {
  [field: string]: unknown;
};

interface Logger {
  info(message: string, fields: Fields): void;
  debug(message: string, fields: Fields): void;
  warn(message: string, fields: Fields): void;
  error(message: string, fields: Fields): void;
  fatal(message: string, fields: Fields): void;
}

export class ConsoleLogger implements Logger {
  private requestId: LogSchema["requestId"];
  private readonly environment: LogSchema["environment"];
  private readonly defaultFields: Fields;

  constructor(opts: {
    requestId: LogSchema["requestId"];
    environment: LogSchema["environment"];
    defaultFields?: Fields;
  }) {
    this.requestId = opts.requestId;
    this.environment = opts.environment;
    this.defaultFields = opts.defaultFields ?? {};
  }

  private marshal(level: Level, message: string, fields?: Fields): string {
    return new Log({
      type: "log",
      level,
      environment: this.environment,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      message,
      context: { ...this.defaultFields, ...fields },
    }).toString();
  }

  public setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  public info(message: string, fields?: Fields): void {
    console.info(this.marshal("info", message, fields));
  }

  public debug(message: string, fields?: Fields): void {
    console.debug(this.marshal("debug", message, fields));
  }

  public warn(message: string, fields?: Fields): void {
    console.warn(this.marshal("warn", message, fields));
  }

  public error(message: string, fields?: Fields): void {
    console.error(this.marshal("error", message, fields));
  }

  public fatal(message: string, fields?: Fields): void {
    console.error(this.marshal("fatal", message, fields));
  }
}
