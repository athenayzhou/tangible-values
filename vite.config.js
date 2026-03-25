import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";

/** @param {string | undefined} raw */
function normalizeBase(raw) {
  if (raw == null || raw === "") return "/tangible-values/";
  const b = raw.startsWith("/") ? raw : `/${raw}`;
  return b.endsWith("/") ? b : `${b}/`;
}

export default defineConfig({
  server: {
    port: 3333,
  },
  plugins: [react(), glsl()],
  publicDir: "public",
  base: normalizeBase(process.env.VITE_BASE_PATH),
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: "docs",
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-vendor";
          }
          if (id.includes("@react-three/fiber")) return "react-vendor";
          if (id.includes("@react-three/drei")) return "react-vendor";
          if (id.includes("@react-three/rapier")) return "react-vendor";
        },
      },
    },
  },
});
