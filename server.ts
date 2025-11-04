import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
const envFile = readFileSync(join(__dirname, ".env"), "utf-8");
const envVars: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join("=").trim();
    }
  }
});

const GOOGLE_MAPS_APIKEY = envVars.GOOGLE_MAPS_APIKEY;

if (!GOOGLE_MAPS_APIKEY) {
  console.error("ERROR: GOOGLE_MAPS_APIKEY not found in .env file");
  process.exit(1);
}

console.log("✓ Google Maps API Key loaded from .env");

const PORT = 5000;
const UI_DIR = join(__dirname, "ui");

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Default to index.html for root path
    if (pathname === "/") {
      pathname = "/index.html";
    }

    // Construct file path
    const filePath = join(UI_DIR, pathname);

    try {
      // Special handling for dashboard.html - inject API key
      if (pathname === "/dashboard.html") {
        let content = readFileSync(filePath, "utf-8");
        content = content.replace(
          /YOUR_GOOGLE_MAPS_API_KEY/g,
          GOOGLE_MAPS_APIKEY
        );

        return new Response(content, {
          headers: {
            "Content-Type": "text/html",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // For EmergencyCenters.json in root directory
      if (pathname === "/EmergencyCenters.json") {
        const jsonPath = join(__dirname, "EmergencyCenters.json");
        const content = readFileSync(jsonPath, "utf-8");
        return new Response(content, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Serve other static files
      const file = Bun.file(filePath);
      const exists = await file.exists();

      if (!exists) {
        return new Response("404 Not Found", { status: 404 });
      }

      // Determine content type
      const ext = pathname.split(".").pop() || "";
      const contentTypeMap: Record<string, string> = {
        html: "text/html",
        css: "text/css",
        js: "application/javascript",
        json: "application/json",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        svg: "image/svg+xml",
        ico: "image/x-icon",
      };

      const contentType = contentTypeMap[ext] || "application/octet-stream";

      return new Response(file, {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error(`Error serving ${pathname}:`, error);
      return new Response("500 Internal Server Error", { status: 500 });
    }
  },
});

console.log(`
┌─────────────────────────────────────────────────┐
│  🚨 flash.ai Emergency Response System          │
│                                                 │
│  Server running on http://localhost:${PORT}     │
│  Ngrok URL: https://deanna-wardless-hubbly.ngrok-free.dev
│                                                 │
│  📍 Dashboard: http://localhost:${PORT}/dashboard.html
│  📍 Emergency: http://localhost:${PORT}/index.html
│                                                 │
│  Press Ctrl+C to stop                           │
└─────────────────────────────────────────────────┘
`);
