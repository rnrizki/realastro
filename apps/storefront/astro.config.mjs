import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  site: process.env.SITE_URL || "https://example.com",
  output: "static",
  trailingSlash: "never",
  prefetch: {
    defaultStrategy: "viewport",
  },
  adapter: cloudflare(),
  integrations: [preact({ compat: true }), tailwind(), sitemap()],
  vite: {
    plugins: [visualizer()],
    ssr: {
      noExternal: ["@medusajs/js-sdk"],
    },
  },
  image: {
    remotePatterns: [{ protocol: "https" }, { protocol: "http" }],
  },
});
