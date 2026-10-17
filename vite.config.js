import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { BASE_PATH } from "./src/config/site.js";

// Vite 8 (rolldown): manualChunks — только функцией!
export default defineConfig({
  // GitHub Pages отдаёт сайт из подпапки /tiankami/ — без этого все ассеты уйдут в корень.
  base: BASE_PATH + "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || /\/node_modules\/(react|scheduler)\//.test(id))
            return "react";
          if (id.includes("react-router")) return "router";
          if (id.includes("react-icons")) return "icons";
          if (id.includes("papaparse")) return "papa";
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
