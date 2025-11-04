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

const PORT = 5001;
const UI_DIR = join(__dirname, "ui");

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Handle /emergency endpoint - proxy to n8n webhook
    if (pathname === "/emergency" && req.method === "POST") {
      try {
        const body = await req.json();

        // n8n webhook URL
        const N8N_WEBHOOK_URL = "https://quantumcoder27.app.n8n.cloud/webhook/877296c1-8f75-4255-90d2-aa32bba052ee";

        // Forward request to n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        // Get response from n8n
        const data = await response.json();

        // Return n8n's response to the UI
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (error) {
        console.error("Error proxying to n8n:", error);
        return new Response(
          JSON.stringify({ error: "Failed to connect to n8n webhook", details: String(error) }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

    // Handle CORS preflight for /calculate endpoint
    if (pathname === "/calculate" && req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Handle /calculate endpoint
    if (pathname === "/calculate" && req.method === "POST") {
      try {
        const body = await req.json();
        const { latitude, longitude, emergencyType } = body;

        // Validate input
        if (!latitude || !longitude || !emergencyType) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: latitude, longitude, emergencyType" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // Map emergencyType to requestType for Python script
        // "hospital" stays as "hospital", everything else stays the same
        const requestType = emergencyType;

        // Call Python script using Bun's spawn
        const proc = Bun.spawn([
          "python",
          "GISanalyser.py"
        ], {
          stdin: "pipe",
          stdout: "pipe",
          stderr: "pipe",
          env: { ...process.env },
        });

        // Create a modified Python script inline to pass arguments
        const pythonCode = `
import sys
import json
sys.path.insert(0, '${__dirname.replace(/\\/g, '\\\\')}')
from GISanalyser import calculate_driving_distance

result = calculate_driving_distance(${latitude}, ${longitude}, '${requestType}')
print(result)
`;

        // Write Python code to stdin
        proc.stdin.write(pythonCode);
        proc.stdin.end();

        // Read output
        const output = await new Response(proc.stdout).text();
        const stderr = await new Response(proc.stderr).text();

        if (stderr) {
          console.error("Python stderr:", stderr);
        }

        await proc.exited;

        // Parse the JSON output from Python
        const unitsData = JSON.parse(output.trim());

        // Load EmergencyCenters.json to get unit coordinates
        const emergencyCentersPath = join(__dirname, "EmergencyCenters.json");
        const emergencyCenters = JSON.parse(readFileSync(emergencyCentersPath, "utf-8"));

        // Find the nearest unit (minimum duration)
        let nearestUnit = null;
        let minDuration = Infinity;

        for (const [unitName, unitInfo] of Object.entries(unitsData)) {
          // Parse duration string (e.g., "5 mins" -> 5)
          const durationStr = (unitInfo as any).duration;
          const durationMatch = durationStr.match(/(\d+)/);
          if (durationMatch) {
            const durationMinutes = parseInt(durationMatch[1]);
            if (durationMinutes < minDuration) {
              minDuration = durationMinutes;
              nearestUnit = {
                name: unitName,
                distance: (unitInfo as any).distance,
                duration: durationStr,
                location: emergencyCenters[requestType][unitName]
              };
            }
          }
        }

        if (!nearestUnit) {
          return new Response(
            JSON.stringify({ error: "Could not find nearest unit" }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // Format response as expected by n8n workflow
        const response = {
          emergencyType: emergencyType,
          nearestUnit: nearestUnit.name,
          distance: nearestUnit.distance,
          eta: nearestUnit.duration,
          unitLocation: nearestUnit.location,
          incidentLocation: { lat: latitude, lng: longitude }
        };

        return new Response(JSON.stringify(response), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });

      } catch (error) {
        console.error("Error in /calculate endpoint:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error", details: String(error) }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }
    }

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
