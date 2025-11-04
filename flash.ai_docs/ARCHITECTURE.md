# System Architecture: flash.ai

## 1. High-Level Workflow

The flash.ai agent follows a clear, event-driven architecture designed for speed and reliability.

`User Action (Click) -> Webhook Trigger -> n8n Data Preprocessing -> Langflow AI Agent -> Agent Tools (GIS & MCP) -> Dispatch Alert`

  <!-- Placeholder for a visual diagram if needed -->

---

## 2. Component Breakdown

### Step 1: Emergency Trigger (n8n Webhooks)
- **Source:** `My workflow (1).json`
- **Nodes:** `FireEmergency`, `AmbulanceEmergency`, `PoliceEmergency`
- **Function:** The workflow is initiated when one of three distinct POST webhooks is called. Each webhook corresponds to a specific type of emergency. This simulates a user clicking a "Fire," "Ambulance," or "Police" button in an app.
- **Input Data:** The webhook receives a JSON body containing `emergencyType`, `latitude`, `longitude`, and `currentlocation` (a string address).

### Step 2: Data Standardization (n8n Code Node)
- **Source:** `My workflow (1).json`
- **Node:** `Code in JavaScript`
- **Function:** All three webhooks feed into a single JavaScript node. This node's purpose is to standardize the incoming data into a single, clean JSON object.
- **Logic:**
    - It extracts `emergencyType`, `latitude`, and `longitude` from the input.
    - It handles missing location data by defaulting to "unknown".
    - It adds a server-side `timestamp`.
- **Output:** A structured JSON object like:
  ```json
  {
    "emergencyType": "Ambulance",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "loc": "New York, NY"
    },
    "timestamp": "2023-10-27T10:00:00.000Z"
  }