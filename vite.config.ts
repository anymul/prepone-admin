import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])$/;

// Fails the build instead of shipping a bundle that sends admin tokens over plain HTTP,
// and warns when a production build still points at a local backend.
function checkApiUrl(apiUrl: string | undefined): Plugin {
  return {
    name: "prepone-check-api-url",
    apply: "build",
    buildStart() {
      if (!apiUrl || apiUrl.startsWith("/")) return; // same-origin path behind the reverse proxy
      let url: URL;
      try {
        url = new URL(apiUrl);
      } catch {
        this.error(`VITE_API_URL is not a valid URL: ${apiUrl}`);
      }
      if (LOCAL_HOST.test(url.hostname)) {
        this.warn(`VITE_API_URL points to ${url.hostname}; a production build needs the real API URL.`);
      } else if (url.protocol !== "https:") {
        this.error(`VITE_API_URL must use https:// in a production build (got ${url.protocol}//${url.host}).`);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const isProd = mode === "production";
  // A trailing slash (https://api.example.com/api/v1/) would turn every request into /api/v1//path.
  const apiUrl = env.VITE_API_URL ? env.VITE_API_URL.replace(/\/+$/, "") : undefined;

  return {
    server: {
      host: true,
      port: 5173,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: env.VITE_DEV_API_TARGET || "http://127.0.0.1:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      // Dev-only: tags DOM nodes with source locations. Never ship that metadata.
      !isProd && viteSourceLocator({ prefix: "mgx" }),
      react(),
      isProd && checkApiUrl(apiUrl),
    ].filter(Boolean),
    define: apiUrl ? { "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl) } : undefined,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: false,
      target: "es2020",
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
            katex: ["katex", "react-katex"],
            charts: ["recharts"],
          },
        },
      },
    },
    // Remove debug logging from production bundles (console.warn / console.error are kept).
    esbuild: isProd ? { pure: ["console.log", "console.debug", "console.info"], drop: ["debugger"] } : undefined,
  };
});
