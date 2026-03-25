import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.js"],
    passWithNoTests: true,
  },
  define: {
    "import.meta.env.BASE_URL": JSON.stringify("/tangible-values/"),
  },
});
