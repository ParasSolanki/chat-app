import path from "node:path";
import { fileURLToPath } from "node:url";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { FontaineTransform } from "fontaine";
import million from "million/compiler";
import { defineConfig, loadEnv } from "vite";

const options = {
  fallbacks: ["ui-sans-serif", "Segoe UI", "Arial"],
  resolvePath: (id: string) => new URL("./public" + id, import.meta.url),
};

const envDir = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

// https://vitejs.dev/config/
export default defineConfig((params) => {
  const env = loadEnv(params.mode, envDir);
  const processEnv = {} as Record<string, string>;

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("VITE_PUBLIC")) {
      processEnv[key] = value;
    }
  }

  return {
    envDir,
    plugins: [
      million.vite({ auto: false }),
      react(),
      TanStackRouterVite(),
      FontaineTransform.vite(options),
    ],
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    define: {
      "process.env": processEnv,
    },
    preview: {
      port: 5173,
    },
  };
});
