import {
  createRouteHandler,
  createUploadthing,
  type FileRouter,
} from "uploadthing/server";
import { createApp } from "../pkg/create-app";
import { env } from "../../env";

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    "image/png": {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    "image/jpeg": {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    "image/webp": {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
  })
    .onUploadError((error) => {
      console.log("upload error", error);
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

const handlers = createRouteHandler({
  router: uploadRouter,
  config: {
    isDev: env.ENVIRONMENT === "development",
    token: env.UPLOADTHING_TOKEN,
  },
});

export const route = createApp().all("/", (c) => handlers(c.req.raw));
