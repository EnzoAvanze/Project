import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        // Keep the browser-facing host (including a phone's LAN address).
        // Vite's string shorthand enables changeOrigin and breaks API origin checks.
        changeOrigin: false,
      },
    },
  },
});
