import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // The client talks to /api/* and the dev server forwards to Express, so the
    // browser sees a single origin and cookies just work in development.
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split three.js into its own chunk: it is large and changes rarely, so
        // caching it separately keeps app rebuilds cheap for returning visitors.
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
