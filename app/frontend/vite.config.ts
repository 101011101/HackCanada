import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

/** Load key=value pairs from .env in dir (no quotes/comment handling, simple) */
function loadEnvFile(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const file = path.join(dir, ".env");
  if (!fs.existsSync(file)) return out;
  const content = fs.readFileSync(file, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname);
  const projectRoot = path.resolve(__dirname, "../..");
  const fromFile = loadEnvFile(projectRoot);
  const fromVite = loadEnv(mode, projectRoot, "");
  const env = { ...process.env, ...fromFile, ...fromVite };
  const apiKey =
    (env.VITE_GOOGLE_MAPS_API_KEY ?? env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();
  const mapId = (env.VITE_MAP_ID ?? env.NEXT_PUBLIC_MAP_ID ?? "").trim() || undefined;

  return {
    plugins: [react()],
    root,
    server: {
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    define: {
      "process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": JSON.stringify(apiKey),
      "process.env.NEXT_PUBLIC_MAP_ID": JSON.stringify(mapId ?? ""),
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(apiKey),
      "import.meta.env.VITE_MAP_ID": JSON.stringify(mapId ?? ""),
    },
  };
});
