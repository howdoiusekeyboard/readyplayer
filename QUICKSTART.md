# flash.ai - Quick Start Guide

**Get your emergency response system running in ~1 hour**

---

## 🚀 Fast Track Setup

### Terminal 1: Flask API
```bash
cd E:\Github\GISHackathon
.venv\Scripts\activate
uv pip install flask flask-cors
python gis_api.py
```
**Leave running!**

### Terminal 2: ngrok
```bash
ngrok http 5000
```
**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

### Terminal 3: Test
```bash
cd E:\Github\GISHackathon
.venv\Scripts\activate
python test_gis_api.py
```
**Should see:** `🎉 ALL TESTS PASSED`

---

## 🌐 Configure n8n Cloud

1. Go to: https://nofps.app.n8n.cloud
2. Import: `My workflow (1).json`
3. Add "HTTP Request" node after "Code in JavaScript":
   - URL: `https://YOUR-NGROK-URL.ngrok.io/calculate`
   - Method: POST
   - Body: `{"latitude": "={{$json.latitude}}", "longitude": "={{$json.longitude}}", "emergencyType": "={{$json.emergencyType}}"}`
4. Add "Respond to Webhook" node after HTTP Request
5. Activate workflow (green toggle)
6. Copy webhook URLs from each webhook node

---

## 🎨 Update UI

**File: `ui/config.js`**
```javascript
const WEBHOOK_URLS = {
    fire: 'https://nofps.app.n8n.cloud/webhook/YOUR-FIRE-ID',
    ambulance: 'https://nofps.app.n8n.cloud/webhook/YOUR-AMBULANCE-ID',
    police: 'https://nofps.app.n8n.cloud/webhook/YOUR-POLICE-ID'
};
```

**File: `ui/dashboard.html` (line 12)**
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_GOOGLE_MAPS_KEY&libraries=geometry"></script>
```

---

## ✅ Test

Open: `ui/index.html`
Click: "FIRE EMERGENCY"
Result: Map shows incident + nearest station

---

## 📚 Full Documentation

- **N8N_INTEGRATION.md** - Complete n8n setup guide
- **SETUP.md** - Langflow + Ollama setup (optional)
- **CLAUDE.md** - Project architecture overview

---

## 🆘 Troubleshooting

**Connection Error?**
- Flask running? → `python gis_api.py`
- ngrok running? → `ngrok http 5000`
- n8n Active? → Check green toggle
- URLs correct? → Check `ui/config.js`

**Map not loading?**
- API key correct in `dashboard.html`?
- JavaScript Maps API enabled in Google Cloud?

**Test individual components:**
```bash
# Test Flask API
curl http://localhost:5000/health

# Test ngrok
curl https://your-ngrok-url.ngrok.io/health

# Test n8n webhook
curl -X POST https://nofps.app.n8n.cloud/webhook/YOUR-ID \
  -H "Content-Type: application/json" \
  -d '{"emergencyType":"fire","latitude":25.2048,"longitude":55.2708}'
```

---

## 🎯 Demo Checklist

Before presenting:
- [ ] Flask API running
- [ ] ngrok running
- [ ] n8n workflow Active
- [ ] UI config updated
- [ ] Tested all 3 emergency types
- [ ] Backup video ready

**Demo flow:**
1. Click "FIRE EMERGENCY"
2. Show loading animation
3. Show success message
4. Click "View Mission Control"
5. Show map with route
6. Point out distance + ETA
7. Explain: UI → n8n → GIS API → Google Maps → Response

**Pitch points:**
- Real-time GIS optimization
- Sub-6-minute response times
- Scalable architecture
- AI-ready (Langflow integration)

---

Good luck! 🚀
