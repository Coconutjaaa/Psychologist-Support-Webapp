import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.PORT || 8443);
  return {
    // URL path the site is served from. "/" for Docker and `pnpm dev`; the GitHub Pages workflow sets
    // BASE_PATH=/<repo>/ because a project site lives at https://<user>.github.io/<repo>/.
    base: env.BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port,
      // Dev only: forward /api/* to a local backend so the browser sees a single origin (no CORS setup needed).
      // Use with VITE_API_URL=/api and API_PROXY_TARGET=http://localhost:3000 in .env.
      proxy: env.API_PROXY_TARGET ? { "/api": { target: env.API_PROXY_TARGET, changeOrigin: true } } : undefined,
    },
    preview: { port },
  };
});
