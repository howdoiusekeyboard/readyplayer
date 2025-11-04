# n8n Integration Guide

Complete step-by-step guide to connect GIS Calculator API to n8n cloud.

---

## Overview

This guide connects the GIS Calculator (GISanalyser.py) to your n8n cloud instance (nofps.app.n8n.cloud) via a Flask API wrapper.

**Architecture:**
```
UI (button click)
    ↓
n8n Cloud Webhook
    ↓
JavaScript Transform Node
    ↓
HTTP Request → Flask API (gis_api.py)
    ↓
GISanalyser.py → Google Maps API
    ↓
Response back to n8n
    ↓
Respond to Webhook → UI
```

---

## Prerequisites Checklist

Before starting, ensure you have:

- [x] Python virtual environment activated
- [x] GISanalyser.py fixed (KeyError resolved)
- [x] EmergencyCenters.json exists
- [x] .env file with GOOGLE_MAPS_APIKEY
- [x] gis_api.py created
- [x] requirements.txt updated
- [ ] Flask and flask-cors installed
- [ ] ngrok installed (download from https://ngrok.com)
- [ ] n8n cloud access (nofps.app.n8n.cloud)

---

## Part 1: Start Flask API (10 minutes)

### Step 1.1: Install Dependencies

```bash
cd E:\Github\GISHackathon

# Activate virtual environment
.venv\Scripts\activate

# Install Flask and CORS
uv pip install flask flask-cors

# Verify installation
python -c "import flask; print(f'Flask {flask.__version__} installed')"
```

### Step 1.2: Test API Locally

```bash
# Start the Flask server
python gis_api.py

# You should see:
# ============================================================
# 🚀 flash.ai GIS Calculator API
# ============================================================
# Server starting on http://0.0.0.0:5000
# Google Maps API: ✓ Configured
# ...
```

**Leave this terminal running!** Open a new terminal for the next steps.

### Step 1.3: Run Test Suite

In a **NEW terminal window**:

```bash
cd E:\Github\GISHackathon
.venv\Scripts\activate

# Run tests
python test_gis_api.py

# Expected output:
# ============================================================
# TEST 1: Health Check
# ============================================================
# Status Code: 200
# ✓ Health check passed
# ...
# 🎉 ALL TESTS PASSED
```

**If tests fail:**
- Check Flask server is running
- Verify .env has GOOGLE_MAPS_APIKEY
- Ensure EmergencyCenters.json exists

---

## Part 2: Expose API with ngrok (5 minutes)

### Step 2.1: Install ngrok

Download from: https://ngrok.com/download

Or if you have it installed, verify:
```bash
ngrok version
```

### Step 2.2: Start ngrok Tunnel

In a **THIRD terminal window**:

```bash
ngrok http 5000
```

You'll see output like:
```
Session Status                online
Account                       your@email.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:5000
```

### Step 2.3: Copy the HTTPS URL

**IMPORTANT:** Copy the **HTTPS** URL (e.g., `https://abc123xyz.ngrok.io`)

You'll use this in n8n configuration.

**Note:** This URL changes every time you restart ngrok. For the free tier, you'll need to update n8n when you restart ngrok.

### Step 2.4: Test ngrok URL

In a browser or terminal:

```bash
# Test ngrok URL (replace with your actual URL)
curl https://YOUR-NGROK-URL.ngrok.io/health

# Should return:
# {"status":"healthy","google_maps_api":"configured",...}
```

---

## Part 3: Configure n8n Workflow (20 minutes)

### Step 3.1: Login to n8n Cloud

1. Go to: https://nofps.app.n8n.cloud
2. Login with your credentials

### Step 3.2: Import Workflow (if not already done)

1. Click "Workflows" in left sidebar
2. Click "+ Add Workflow" → "Import from File"
3. Select: `E:\Github\GISHackathon\My workflow (1).json`
4. Click "Import"

### Step 3.3: Understand Current Workflow

Your workflow currently has:

**Node 1: FireEmergency** (Webhook Trigger)
- Receives POST requests for fire emergencies

**Node 2: AmbulanceEmergency** (Webhook Trigger)
- Receives POST requests for medical emergencies

**Node 3: PoliceEmergency** (Webhook Trigger)
- Receives POST requests for police emergencies

**Node 4: Code in JavaScript** (Transform)
- Standardizes incoming data

**Node 5: AI Agent** (Not configured yet)
- Placeholder for Langflow integration

**Node 6: MCP Client** (Not configured yet)
- Placeholder for alert dispatch

### Step 3.4: Add GIS Calculator Node

**Click the "+" button** after the "Code in JavaScript" node

1. Search for "HTTP Request"
2. Click to add it
3. Configure:

**General Settings:**
- **Name:** `Call GIS Calculator`
- **Method:** `POST`
- **URL:** `https://YOUR-NGROK-URL.ngrok.io/calculate`
  - ⚠️ Replace with your actual ngrok URL!

**Body → JSON:**
```json
{
  "latitude": "={{ $json.latitude }}",
  "longitude": "={{ $json.longitude }}",
  "emergencyType": "={{ $json.emergencyType }}"
}
```

**Headers:**
- Click "Add Option" → "Add Header"
  - Name: `Content-Type`
  - Value: `application/json`

**Options:**
- Response → Response Format: `JSON`

4. Click "Execute Node" to test
5. Should see response with `nearestUnit`, `distance`, `eta`

### Step 3.5: Add Response Node

**Click the "+" button** after the "Call GIS Calculator" node

1. Search for "Respond to Webhook"
2. Click to add it
3. Configure:

**Settings:**
- **Respond With:** `JSON`
- **Response Code:** `200`

**Response Body (JSON):**
```json
{
  "success": true,
  "incidentId": "={{ $now.toISOString() }}",
  "emergencyType": "={{ $('Call GIS Calculator').item.json.emergencyType }}",
  "nearestUnit": "={{ $('Call GIS Calculator').item.json.nearestUnit }}",
  "distance": "={{ $('Call GIS Calculator').item.json.distance }}",
  "eta": "={{ $('Call GIS Calculator').item.json.eta }}",
  "unitLocation": "={{ $('Call GIS Calculator').item.json.unitLocation }}",
  "incidentLocation": "={{ $('Call GIS Calculator').item.json.incidentLocation }}"
}
```

**Headers:**
- Add header:
  - Name: `Access-Control-Allow-Origin`
  - Value: `*`
- Add header:
  - Name: `Content-Type`
  - Value: `application/json`

### Step 3.6: Connect the Nodes

Make sure the flow is connected:

```
FireEmergency → Code in JavaScript → Call GIS Calculator → Respond to Webhook
AmbulanceEmergency ↗                 ↓
PoliceEmergency ↗                    (Remove AI Agent for now)
```

**To disconnect AI Agent:**
1. Click the connection line to AI Agent
2. Press Delete
3. Connect "Call GIS Calculator" directly to "Respond to Webhook"

### Step 3.7: Activate Workflow

1. Click the **"Active"** toggle in the top right (should turn green)
2. Click **"Save"** button (Ctrl+S)

### Step 3.8: Get Webhook URLs

For each webhook node (Fire, Ambulance, Police):

1. Click on the webhook node
2. Click "Test URL" or "Production URL"
3. Copy the URL (e.g., `https://nofps.app.n8n.cloud/webhook/abc-123-xyz`)
4. Save these URLs - you'll need them for the UI

**Example URLs:**
```
Fire:      https://nofps.app.n8n.cloud/webhook/abc-123-fire
Ambulance: https://nofps.app.n8n.cloud/webhook/def-456-ambulance
Police:    https://nofps.app.n8n.cloud/webhook/ghi-789-police
```

---

## Part 4: Update UI Configuration (5 minutes)

### Step 4.1: Update config.js

Edit: `E:\Github\GISHackathon\ui\config.js`

Replace the placeholder URLs:

```javascript
const WEBHOOK_URLS = {
    // Replace with your ACTUAL webhook URLs from n8n
    fire: 'https://nofps.app.n8n.cloud/webhook/YOUR-FIRE-WEBHOOK-ID',
    ambulance: 'https://nofps.app.n8n.cloud/webhook/YOUR-AMBULANCE-WEBHOOK-ID',
    police: 'https://nofps.app.n8n.cloud/webhook/YOUR-POLICE-WEBHOOK-ID'
};
```

### Step 4.2: Update Google Maps API Key

Edit: `E:\Github\GISHackathon\ui\dashboard.html`

Line 12, replace:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=geometry"></script>
```

With your actual API key from `.env` file:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=geometry"></script>
```

---

## Part 5: End-to-End Testing (10 minutes)

### Step 5.1: Test with curl

```bash
# Test Fire Emergency (replace with your actual webhook URL)
curl -X POST https://nofps.app.n8n.cloud/webhook/YOUR-FIRE-WEBHOOK-ID \
  -H "Content-Type: application/json" \
  -d '{
    "emergencyType": "fire",
    "latitude": 25.2048,
    "longitude": 55.2708,
    "currentlocation": "Dubai, UAE"
  }'

# Expected response:
# {
#   "success": true,
#   "nearestUnit": "Al Karama Civil Defence Station",
#   "distance": "3.2 km",
#   "eta": "6 mins",
#   "unitLocation": {"lat": 25.2528, "lng": 55.3061}
# }
```

### Step 5.2: Test with UI

1. Open: `E:\Github\GISHackathon\ui\index.html` in browser
2. Click "FIRE EMERGENCY" button
3. Should see:
   - Loading animation
   - Success message with station name and ETA
   - "View Mission Control" button

4. Click "View Mission Control"
5. Dashboard should show:
   - Map with incident location (red marker)
   - Fire station location (green marker)
   - Route line between them
   - Distance and ETA displayed

### Step 5.3: Check n8n Execution Logs

In n8n cloud:
1. Click "Executions" in left sidebar
2. Should see successful executions
3. Click on an execution to see the flow
4. Verify each node shows green checkmark

---

## Part 6: Troubleshooting

### Problem: "Connection Error" in UI

**Check:**
1. Is Flask running? (`python gis_api.py`)
2. Is ngrok running? (`ngrok http 5000`)
3. Is n8n workflow Active? (green toggle)
4. Are webhook URLs in `ui/config.js` correct?
5. Check browser console (F12) for error details

**Fix:**
```bash
# Restart Flask
python gis_api.py

# Restart ngrok (in new terminal)
ngrok http 5000

# Update n8n workflow with new ngrok URL
```

### Problem: "Invalid emergencyType" error

**Cause:** UI sends "hospital" but code expects different value

**Fix:** The API already handles this (converts "ambulance" → "hospital")

Check the transformation in JavaScript node maps correctly.

### Problem: Map doesn't load in dashboard

**Check:**
1. Is Google Maps API key correct in `dashboard.html`?
2. Is JavaScript Maps API enabled in Google Cloud Console?
3. Check browser console (F12) for Google Maps errors

### Problem: n8n shows "Connection timed out"

**Cause:** ngrok URL is wrong or Flask server not responding

**Fix:**
1. Verify Flask is running: `curl http://localhost:5000/health`
2. Verify ngrok is running: `curl https://your-ngrok-url.ngrok.io/health`
3. Update n8n HTTP Request node with correct ngrok URL
4. Test the node individually in n8n

### Problem: "Google Maps API Error"

**Check:**
1. Is GOOGLE_MAPS_APIKEY in `.env` file?
2. Is Distance Matrix API enabled in Google Cloud Console?
3. Does API key have any restrictions? (remove for testing)

**Test:**
```bash
# Check if API key is loaded
cd E:\Github\GISHackathon
.venv\Scripts\activate
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GOOGLE_MAPS_APIKEY'))"
```

---

## Part 7: Production Considerations

### ngrok Free Tier Limitations

**Problem:** URL changes on restart

**Solutions:**
1. **Quick fix:** Update n8n workflow each time you restart ngrok
2. **Better:** Get ngrok paid plan for static URL
3. **Best:** Deploy Flask API to cloud (Heroku, Railway, Render)

### Deploying Flask API to Cloud

**Option A: Railway.app (Recommended)**

1. Create `Procfile`:
   ```
   web: python gis_api.py
   ```

2. Push to GitHub
3. Connect Railway to GitHub
4. Deploy
5. Update n8n with Railway URL (static, no ngrok needed)

**Option B: Heroku**

Similar process, but requires credit card even for free tier.

### Long-Running Services

For hackathon demo, keep these running:

**Terminal 1:** Flask API
```bash
python gis_api.py
```

**Terminal 2:** ngrok
```bash
ngrok http 5000
```

**Optional Terminal 3:** Ollama (if using Langflow)
```bash
ollama serve
```

**Optional Terminal 4:** Langflow (if adding AI layer)
```bash
langflow run
```

---

## Summary Checklist

Before demo day:

- [ ] Flask API running (`python gis_api.py`)
- [ ] ngrok running (`ngrok http 5000`)
- [ ] n8n workflow Active (green toggle)
- [ ] Webhook URLs in `ui/config.js` are correct
- [ ] Google Maps API key in `dashboard.html` is correct
- [ ] Tested fire emergency end-to-end
- [ ] Tested ambulance emergency end-to-end
- [ ] Tested police emergency end-to-end
- [ ] Map displays correctly in dashboard
- [ ] Have backup screenshot/video ready

---

## Next Steps

**Minimum Viable Demo (Current State):**
✅ UI → n8n → Flask API → GIS → Response → UI

**Optional Enhancements:**

1. **Add Langflow + Ollama (SETUP.md Phase 3)**
   - Provides AI reasoning
   - Makes demo more impressive
   - Time: +1-2 hours

2. **Deploy to Cloud**
   - No need to run local servers
   - More stable for demo
   - Time: +30 minutes

3. **Add Database**
   - Track all incidents
   - Show history in dashboard
   - Time: +2 hours

For hackathon, **current state is sufficient** for a working demo. Add enhancements only if you have extra time.

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review Flask terminal logs
3. Check n8n execution details
4. Review browser console (F12)
5. Test each component individually

**Test sequence:**
```
GISanalyser.py ✓
  ↓
Flask API ✓
  ↓
ngrok tunnel ✓
  ↓
n8n HTTP Request ✓
  ↓
n8n Response ✓
  ↓
UI webhook call ✓
  ↓
Dashboard display ✓
```

Good luck with your demo! 🚀
