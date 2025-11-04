/**
 * flash.ai - Configuration
 * n8n webhook URLs and API endpoints
 *
 * IMPORTANT: Update these URLs after deploying your n8n workflow
 */

const WEBHOOK_URLS = {
    // All emergency types use local proxy endpoint (no CORS issues)
    // The Bun server at localhost:5001 proxies requests to n8n webhook
    // emergencyType field in payload determines the type (fire, hospital, police)
    fire: 'http://localhost:5001/emergency',

    // Same endpoint for all types
    ambulance: 'http://localhost:5001/emergency',

    // Single unified endpoint
    police: 'http://localhost:5001/emergency'
};

/**
 * ARCHITECTURE:
 *
 * UI (localhost:5001) → Bun Server /emergency endpoint → n8n webhook (cloud)
 *
 * All emergency requests go through the local Bun server proxy to avoid CORS issues.
 * The n8n webhook URL is configured in server.ts (N8N_WEBHOOK_URL constant).
 *
 * To update the n8n webhook URL:
 * 1. Open server.ts
 * 2. Find the N8N_WEBHOOK_URL constant in the /emergency endpoint
 * 3. Update it with your n8n webhook URL
 * 4. Restart the Bun server: bun run server.ts
 *
 * NOTE: All three emergency types use the SAME local endpoint.
 * The emergencyType field in the POST payload determines which type it is.
 */

// Google Maps API Configuration
const GOOGLE_MAPS_CONFIG = {
    // Replace with your Google Maps API key
    // This is used in dashboard.html for map visualization
    apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
};

// Demo mode configuration
const DEMO_MODE = {
    // Set to true to use mock responses instead of real n8n webhooks
    // Useful for testing UI without backend
    enabled: false,

    // Mock response delay (milliseconds)
    delay: 2000
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.WEBHOOK_URLS = WEBHOOK_URLS;
    window.GOOGLE_MAPS_CONFIG = GOOGLE_MAPS_CONFIG;
    window.DEMO_MODE = DEMO_MODE;
}
