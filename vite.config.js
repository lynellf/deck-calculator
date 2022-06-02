import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import alias from "@rollup/plugin-alias";
import { resolve } from "path";

const asAlias = ([alias, path]) => ({
  find: alias,
  replacement: resolve(__dirname, path)
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    alias({
      entries: [
        ["@hooks", "src/hooks"],
        ["@components", "src/components"],
        ["@math", "src/math"],
        ["@views", "src/views"],
        ["@common", "src/common.js"]
      ].map(asAlias)
    })
  ]
});
