import { defineConfig } from "vite";

const frontendPort = Number(process.env.LONGSHOT_WEB_PORT) || 5173;
const apiPort = Number(process.env.LONGSHOT_API_PORT) || 4174;
const basePath = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  server: {
    host: "127.0.0.1",
    port: frontendPort,
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${apiPort}`
    }
  }
});
