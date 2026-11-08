import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Static preview of the reorganised counselor planning tab (no data access).
export default defineConfig({
  root: path.resolve(__dirname, "demo-plan"),
  base: "./",
  plugins: [react()],
  resolve: { alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }] },
  build: { outDir: path.resolve(__dirname, "dist-demo-plan"), emptyOutDir: true },
});
