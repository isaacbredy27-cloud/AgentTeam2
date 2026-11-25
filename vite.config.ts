import { defineConfig } from "vite";
import { resolve } from "node:path";

const r = (p: string) => resolve(import.meta.dirname, p);

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: r("index.html"),
        agents: r("agents/index.html"),
        how: r("how-it-works/index.html"),
        resources: r("resources/index.html"),
        guide: r("guide/index.html"),
        offline: r("offline.html"),
      },
    },
  },
  server: { port: 5173 },
});
