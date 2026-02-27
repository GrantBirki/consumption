import { resolve } from "node:path";

import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// Prevent Vite's built-in HTML env replacement from warning when these are unset.
process.env.VITE_SITE_URL = process.env.VITE_SITE_URL || "";
process.env.VITE_BASE = process.env.VITE_BASE || "/";

const htmlPlugin = (env) => ({
  name: "html-transform",
  transformIndexHtml(html) {
    return html.replace(/%(.*?)%/g, (_match, key) => {
      const value = env[key];
      return value === undefined ? "" : value;
    });
  },
});

export default defineConfig(({ mode }) => {
  const projectRoot = process.cwd();
  const env = Object.fromEntries(
    Object.entries(loadEnv(mode, projectRoot, "")).filter(([key]) => key.startsWith("VITE_"))
  );
  const base = env.VITE_BASE || "/";
  const isTest = mode === "test";

  env.VITE_BASE = base;
  env.VITE_SITE_URL = env.VITE_SITE_URL || "";

  return {
    base,
    plugins: [svelte(), htmlPlugin(env)],
    resolve: isTest
      ? {
          alias: [
            { find: /^svelte$/, replacement: resolve(projectRoot, "node_modules/svelte/src/index-client.js") },
          ],
        }
      : undefined,
    ssr: {
      resolve: {
        conditions: ["browser"],
        externalConditions: ["browser"],
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./test/setup.js"],
      pool: "forks",
      execArgv: ["--conditions", "browser", "--conditions", "svelte"],
      server: {
        deps: {
          inline: ["svelte", "@testing-library/svelte", "@testing-library/svelte-core"],
        },
      },
      coverage: {
        provider: "v8",
        reporter: ["text"],
        include: ["src/**/*.{js,svelte}"],
        exclude: ["src/vite-env.d.ts"],
      },
    },
    build: {
      outDir: resolve(projectRoot, "dist"),
      emptyOutDir: true,
    },
  };
});
