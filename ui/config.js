/**
 * flash.ai - Configuration
 * n8n webhook URLs and API endpoints
 *
 * IMPORTANT: Update these URLs after deploying your n8n workflow
 */

const WEBHOOK_URLS = {
    // Fire Emergency Webhook
    // Replace with actual n8n webhook URL after importing workflow
    fire: 'https://quantumcoder27.app.n8n.cloud/webhook/877296c1-8f75-4255-90d2-aa32bba052ee',

    // Ambulance/Medical Emergency Webhook
    // Replace with actual n8n webhook URL after importing workflow
    ambulance: 'https://quantumcoder27.app.n8n.cloud/webhook/d53a9096-f144-4329-9699-301a93c86593',

    // Police Emergency Webhook
    // Replace with actual n8n webhook URL after importing workflow
    police: 'https://quantumcoder27.app.n8n.cloud/webhook/0e722cb1-b963-495e-934e-f3150aeff6de'
};

/**
 * HOW TO GET WEBHOOK URLs:
 *
 * 1. Login to n8n cloud: https://nofps.app.n8n.cloud
 * 2. Import the workflow: My workflow (1).json
 * 3. Open each webhook node (FireEmergency, AmbulanceEmergency, PoliceEmergency)
 * 4. Copy the webhook URL (looks like: https://nofps.app.n8n.cloud/webhook/abc-123-xyz)
 * 5. Paste the URLs above, replacing the REPLACE_WITH_* placeholders
 * 6. Save this file
 *
 * ALTERNATIVE - Local n8n:
 * If using local n8n instead of cloud, URLs will look like:
 * http://localhost:5678/webhook/abc-123-xyz
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
