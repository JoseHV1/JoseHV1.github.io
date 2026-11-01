import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import seoStatic from "./scripts/seo-static.mjs";

// Changes on every build: cache-busts the files whose names carry no hash (favicon, locales).
process.env.VITE_BUILD_ID = Date.now().toString(36);

export default defineConfig({
  base: "./",
  plugins: [react(), seoStatic()],
});
