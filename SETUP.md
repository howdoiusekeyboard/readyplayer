# flash.ai - Complete Setup Guide

This guide will walk you through setting up the entire flash.ai emergency response system from scratch.

## Prerequisites

- Windows 11 (your current setup)
- Python 3.12
- `uv` package manager (installed)
- `bun` (installed)
- Node.js (for n8n)
- Ollama (installed)
- Google Maps API Key (in `.env` file)

---

## Phase 1: Python Environment Setup (10 minutes)

### 1.1 Create Virtual Environment

```bash
cd E:\Github\GISHackathon

# Create virtual environment using uv
uv venv

# Activate virtual environment
.venv\Scripts\activate
```

### 1.2 Install Python Dependencies

```bash
# Install all required packages
uv pip install -r requirements.txt

# Verify installation
python -c "import googlemaps; print('✓ googlemaps installed')"
python -c "import dotenv; print('✓ python-dotenv installed')"
```

### 1.3 Test GIS Calculator

```bash
# Test the GIS calculator
python GISanalyser.py

# Expected output: Distance matrix with Dubai fire stations
```

**Troubleshooting:**
- If `EmergencyCenters.json` error: File should already exist in project root
- If API key error: Check `.env` file has `GOOGLE_MAPS_APIKEY=your_key_here`
- If import errors: Re-run `uv pip install -r requirements.txt`

---

## Phase 2: Ollama Setup (15 minutes)

### 2.1 Verify Ollama Installation

```bash
# Check Ollama is installed
ollama --version

# List installed models
ollama list
```

### 2.2 Pull Required Model

For the hackathon, you need an open-source model. Recommended options:

**Option A: Llama 2 (Recommended for speed)**
```bash
ollama pull llama2

# Test the model
ollama run llama2 "You are an emergency dispatcher. A fire has been reported at coordinates 25.2048, 55.2708. Which station should respond?"
```

**Option B: Mistral (Better quality)**
```bash
ollama pull mistral

# Test the model
ollama run mistral "Analyze this emergency: fire at 25.2048, 55.2708"
```

**Option C: Smaller/Faster Models**
```bash
# For faster demos on limited hardware
ollama pull llama2:7b-chat
# or
ollama pull phi
```

### 2.3 Keep Ollama Running

Ollama needs to be running in the background. Either:
- Keep the terminal open where you ran `ollama run`
- Or install as a Windows service (Ollama should do this automatically)

Test API access:
```bash
curl http://localhost:11434/api/generate -d "{\"model\": \"llama2\", \"prompt\": \"test\"}"
```

---

## Phase 3: Langflow Setup (30-45 minutes)

### 3.1 Install Langflow

```bash
# Install Langflow globally
pip install langflow

# Or with uv
uv pip install langflow

# Verify installation
langflow --version
```

### 3.2 Start Langflow

```bash
# Start Langflow server
langflow run

# Default URL: http://localhost:7860
```

Open browser to: **http://localhost:7860**

### 3.3 Create Emergency Response Flow

**Step 1: Create New Flow**
1. Click "New Flow"
2. Name it: "Emergency Response Agent"

**Step 2: Add Ollama LLM Component**
1. From left sidebar, search "Ollama"
2. Drag "Ollama" component to canvas
3. Configure:
   - **Base URL**: `http://localhost:11434`
   - **Model**: `llama2` (or your chosen model)
   - **Temperature**: `0.3` (for consistent responses)

**Step 3: Add Prompt Template**
1. Search "Prompt" in sidebar
2. Drag "Prompt Template" to canvas
3. Configure template:
   ```
   You are an AI emergency dispatcher for Dubai.

   Emergency Type: {emergency_type}
   Location: Latitude {latitude}, Longitude {longitude}
   Current Address: {current_location}

   Your task:
   1. Analyze the emergency type and location
   2. Determine the optimal emergency responder
   3. Use the GIS calculation tool to find distances
   4. Respond with JSON format:
   {{
     "nearestUnit": "Station Name",
     "distance": "X.X km",
     "eta": "Y mins",
     "reasoning": "Brief explanation"
   }}

   Be concise and provide only the JSON response.
   ```

**Step 4: Add Agent Component**
1. Search "Agent" in sidebar
2. Drag "Agent" component to canvas
3. Connect:
   - Prompt Template → Agent (input)
   - Ollama LLM → Agent (llm)

**Step 5: Add Custom Tool for GIS**
1. Search "Custom Tool" or "Python Function"
2. Drag to canvas
3. Add this code:
   ```python
   import sys
   sys.path.append('E:/Github/GISHackathon')
   from GISanalyser import calculate_driving_distance

   def get_nearest_responder(latitude: float, longitude: float, emergency_type: str):
       """
       Calculate distances to all emergency centers
       Args:
           latitude: Incident latitude
           longitude: Incident longitude
           emergency_type: Type (fire, police, hospital)
       """
       result = calculate_driving_distance(latitude, longitude, emergency_type)
       return result
   ```
4. Connect Tool → Agent (tools)

**Step 6: Test Flow**
1. Click "Playground" button
2. Test input:
   ```json
   {
     "emergency_type": "fire",
     "latitude": 25.2048,
     "longitude": 55.2708,
     "current_location": "Dubai, UAE"
   }
   ```
3. Verify response includes nearest station

**Step 7: Deploy Flow**
1. Click "Deploy" button (top right)
2. Copy the API endpoint URL
3. Save it - you'll need this for n8n

### 3.4 Get Langflow API Endpoint

After deployment, you'll get a URL like:
```
http://localhost:7860/api/v1/run/YOUR_FLOW_ID
```

Save this URL - you'll use it in n8n configuration.

---

## Phase 4: n8n Cloud Setup (20 minutes)

### 4.1 Login to n8n Cloud

1. Open browser to: **https://nofps.app.n8n.cloud**
2. Login with your credentials

### 4.2 Import Workflow

1. Click "Workflows" in left sidebar
2. Click "Import from File"
3. Select: `E:\Github\GISHackathon\My workflow (1).json`
4. Workflow should load with 6 nodes

### 4.3 Configure Webhook Nodes

**For each webhook (Fire, Ambulance, Police):**

1. Click on "FireEmergency" webhook node
2. Settings:
   - **HTTP Method**: POST
   - **Path**: Use auto-generated or set custom (e.g., `fire-emergency`)
   - **Response Mode**: "When Last Node Finishes"
3. Copy the webhook URL (e.g., `https://nofps.app.n8n.cloud/webhook/abc-123-xyz`)
4. Save to `ui/config.js` (more on this in Phase 5)
5. Repeat for "AmbulanceEmergency" and "PoliceEmergency"

### 4.4 Configure AI Agent Node

1. Click on "AI Agent" node
2. Configure:
   - **Agent Type**: "Conversational Agent"
   - **LLM**: Add new credential
   - **Provider**: HTTP Request (Generic)
   - **URL**: `http://localhost:7860/api/v1/run/YOUR_FLOW_ID` (from Langflow)

**IMPORTANT:** If n8n cloud can't reach localhost:
- You need to expose Langflow publicly (using ngrok or similar)
- OR use n8n desktop/local instead of cloud

**Alternative - Skip Langflow (Quick Hack):**

If Langflow is too complex, replace "AI Agent" node with "Code" node:

```javascript
// Simple JavaScript logic instead of AI
const { emergencyType, latitude, longitude } = $input.all()[0].json;

// Load emergency centers (you'll need to paste the JSON here)
const centers = {
  "fire": {
    "Al Karama Civil Defence Station": { lat: 25.2528, lng: 55.3061 }
    // ... add more from EmergencyCenters.json
  }
};

// Calculate simple distances
function distance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Find nearest
let nearest = null;
let minDist = Infinity;

for (const [name, loc] of Object.entries(centers[emergencyType])) {
  const dist = distance(latitude, longitude, loc.lat, loc.lng);
  if (dist < minDist) {
    minDist = dist;
    nearest = { name, distance: dist, eta: Math.round(dist * 3) }; // rough ETA
  }
}

return {
  nearestUnit: nearest.name,
  distance: `${nearest.distance.toFixed(1)} km`,
  eta: `${nearest.eta} mins`,
  unitLocation: centers[emergencyType][nearest.name]
};
```

### 4.5 Add Response Node

1. Add "Respond to Webhook" node after AI Agent
2. Connect AI Agent → Respond to Webhook
3. Configure:
   - **Response Code**: 200
   - **Response Body**: `{{ $json }}`
   - **Headers**: Add CORS headers
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     ```

### 4.6 Activate Workflow

1. Click "Active" toggle in top right (should turn green)
2. Save workflow (Ctrl+S or top right button)

### 4.7 Test Webhook

```bash
# Test Fire Emergency webhook
curl -X POST https://nofps.app.n8n.cloud/webhook/YOUR_FIRE_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d "{\"emergencyType\":\"fire\",\"latitude\":25.2048,\"longitude\":55.2708,\"currentlocation\":\"Dubai\"}"

# Expected response:
# {
#   "nearestUnit": "Al Karama Civil Defence Station",
#   "distance": "3.2 km",
#   "eta": "6 mins"
# }
```

---

## Phase 5: Frontend Configuration (5 minutes)

### 5.1 Update Webhook URLs

Edit `ui/config.js`:

```javascript
const WEBHOOK_URLS = {
    fire: 'https://nofps.app.n8n.cloud/webhook/YOUR_FIRE_WEBHOOK_ID',
    ambulance: 'https://nofps.app.n8n.cloud/webhook/YOUR_AMBULANCE_WEBHOOK_ID',
    police: 'https://nofps.app.n8n.cloud/webhook/YOUR_POLICE_WEBHOOK_ID'
};
```

Replace the placeholder URLs with your actual webhook URLs from n8n.

### 5.2 Update Google Maps API Key

Edit `ui/dashboard.html` line 12:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=geometry"></script>
```

Replace `YOUR_ACTUAL_API_KEY` with your Google Maps API key from `.env` file.

### 5.3 Test Frontend

```bash
# Open the UI (double-click or use a local server)
# Option 1: Double-click ui/index.html
# Option 2: Use Python HTTP server
cd ui
python -m http.server 8000

# Open browser to: http://localhost:8000
```

---

## Phase 6: End-to-End Testing (10 minutes)

### 6.1 Test Complete Flow

1. Open `ui/index.html` in browser
2. Click "FIRE EMERGENCY" button
3. Observe:
   - Loading animation appears
   - Request sent to n8n webhook
   - n8n triggers Langflow agent (or JavaScript code)
   - GIS calculation runs
   - Response returns
   - Success message displays
4. Click "View Mission Control"
5. Verify:
   - Map loads with incident location
   - Responder marker appears
   - Route line drawn
   - ETA and distance displayed

### 6.2 Troubleshooting

**"Connection Error" in UI:**
- Check `ui/config.js` has correct webhook URLs
- Verify n8n workflow is Active (green toggle)
- Test webhook directly with curl
- Check browser console (F12) for errors

**Map doesn't load:**
- Verify Google Maps API key in `dashboard.html`
- Check API key is enabled for JavaScript Maps API
- Look for errors in browser console

**No distance/ETA shown:**
- Check GIS calculator works: `python GISanalyser.py`
- Verify `EmergencyCenters.json` exists
- Check Langflow tool is calling Python function correctly

**Langflow errors:**
- Verify Ollama is running: `ollama list`
- Check Langflow logs in terminal
- Try simpler prompt or different model

---

## Quick Start (Skip Langflow)

If you're short on time, use this simplified setup:

1. **Skip Langflow entirely**
2. Replace "AI Agent" node in n8n with "Code" node
3. Use the JavaScript code from Section 4.4 Alternative
4. Rest of setup remains the same

This gives you a working demo in ~30 minutes instead of 2+ hours.

---

## Demo Day Checklist

Before the demo:

- [ ] Ollama is running
- [ ] Langflow is running (or using Code node alternative)
- [ ] n8n workflow is Active
- [ ] All webhook URLs updated in `ui/config.js`
- [ ] Google Maps API key updated in `dashboard.html`
- [ ] Tested full flow at least 3 times
- [ ] Have backup screenshots/video ready
- [ ] Know your pitch (problem → solution → demo → tech stack)

---

## Architecture Summary

```
User clicks button in UI (index.html)
    ↓
JavaScript sends POST to n8n cloud webhook (app.js)
    ↓
n8n receives request, parses data (webhook node)
    ↓
n8n calls Langflow agent API (AI Agent node)
    ↓
Langflow agent uses Ollama LLM to analyze (agent + llm)
    ↓
Agent calls GIS tool (GISanalyser.py via custom tool)
    ↓
GIS calculator queries Google Maps API (calculate_driving_distance)
    ↓
Response flows back: GIS → Agent → n8n → UI
    ↓
Dashboard displays map with route (dashboard.html)
```

---

## Support

If you get stuck:
1. Check this guide's Troubleshooting sections
2. Review `CLAUDE.md` for general context
3. Check n8n execution logs in the UI
4. Review browser console (F12) for frontend errors
5. Test each component individually

Good luck with your hackathon! 🚀
