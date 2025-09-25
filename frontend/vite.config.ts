import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: "src/*",
      exclude: ["node_modules", "tests", "dist", "coverage"],
      extension: [".js", ".ts", ".jsx", ".tsx"],
      requireEnv: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
