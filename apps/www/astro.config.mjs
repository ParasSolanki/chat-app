import { defineConfig } from "astro/config";
import { FontaineTransform } from "fontaine";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

const options = {
  fallbacks: ["ui-sans-serif", "Segoe UI", "Arial"],
  resolvePath: (id) => new URL("./public" + id, import.meta.url),
};

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  security: {
    checkOrigin: true,
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    plugins: [FontaineTransform.vite(options)],
  },
});
