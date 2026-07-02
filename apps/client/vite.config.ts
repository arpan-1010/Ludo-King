import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),

      "@repo/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:3000",
      "/game": "http://localhost:3000",
      "/ws":   {
          target:    "ws://localhost:3000",
          ws:        true,
          changeOrigin: true,
        },
    },
  },
});