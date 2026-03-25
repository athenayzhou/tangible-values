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
  build: {
    outDir: "docs",
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          if (id.includes("@react-three/rapier")) return "rapier";
          if (id.includes("@react-three/drei")) return "drei";
          if (id.includes("@react-three/fiber")) return "fiber";
        },
      },
    },
  },
});
