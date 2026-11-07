import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Builds a self-contained demo of the mock interview with in-memory sample data.
export default defineConfig({
  root: path.resolve(__dirname, "demo-mi"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/integrations/supabase/client", replacement: path.resolve(__dirname, "demo-mi/mock.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  build: { outDir: path.resolve(__dirname, "dist-demo-mi"), emptyOutDir: true },
});
