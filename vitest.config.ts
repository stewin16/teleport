import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/client"),
      "@server": path.resolve(__dirname, "./src/server")
    }
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["refrences/**", "node_modules/**", "dist/**"],
    globals: true
  }
});

