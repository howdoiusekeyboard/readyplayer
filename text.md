A comprehensive set of documentation files for your AI coding agent. This documentation is designed to give your agent, Claude, a deep and holistic understanding of the project's goals, technical architecture, constraints, and the specific success criteria of the hackathon.

---

### **File 1: `README.md`**

This is the main entry point for the project, providing a high-level overview.

---

### **File 2: `ARCHITECTURE.md`**

This file details the technical implementation, data flow, and how the components interact.


### Step 3: Core Logic & Decision Making (Langflow AI Agent)
- **Source:** `My workflow (1).json`
- **Node:** `AI Agent`
- **Framework:** Langflow
- **Function:** This is the brain of the operation. The structured JSON from the Code Node is passed to this Langflow-powered agent. The agent's prompt and tools are designed to execute the core mission.
- **Primary Task:** "Given the emergency type and location, determine the best course of action and dispatch help."

### Step 4: Agent Tools (Python Functions & n8n Connectors)

The AI Agent has access to specialized tools to perform its tasks:

#### Tool 1: GIS Analyser (Optimisation)
- **Source:** `GISanalyser.py`
- **Function:** `calculate_driving_distance(origin_lat, origin_lng, destination_lat, destination_lng)`
- **Purpose:** This tool is the key to fulfilling the **GIS Analytics** and **Optimisation** themes. The agent can use this tool to:
    1.  Get a list of nearby hospitals, police stations, or fire stations (this list could be a static database or another API call).
    2.  Iterate through the list, using `calculate_driving_distance` to find the one with the shortest travel time/distance from the user's location.
    3.  This selection process *is* the optimisation.

#### Tool 2: MCP Client (MCP Integration)
- **Source:** `My workflow (1).json`
- **Node:** `MCP Client`
- **Purpose:** This tool fulfills the **MCP Integration** wildcard. Once the agent has *optimised* and selected the best response unit, it uses this tool to format and send the final dispatch alert.
- **Function:** The `MCP Client` is an abstraction for an API call or other communication method that sends the final, structured alert to a "Mission Control Panel" dashboard for human operators to monitor. The alert would contain:
    - Victim's location (lat/long and address)
    - Type of emergency
    - Dispatched unit's name and location
    - Estimated time of arrival (from the GIS tool)

## 3. Data Flow Summary

1.  **Raw Data:** `{"emergencyType": "Fire", "latitude": 34.05, ...}` comes into a Webhook.
2.  **Standardized Data:** n8n JS node creates `{"emergencyType": "Fire", "location": {...}, ...}`.
3.  **Agent Input:** Langflow agent receives the standardized data.
4.  **Agent Process:**
    - "I have a fire emergency at location X."
    - "I need to find the nearest fire station."
    - *Calls GIS tool:* `calculate_driving_distance(user_loc, station_A_loc)` -> returns 10 mins.
    - *Calls GIS tool:* `calculate_driving_distance(user_loc, station_B_loc)` -> returns 6 mins.
    - "Station B is the optimal choice."
5.  **Agent Action:**
    - *Calls MCP tool:* with a payload containing all details (`victim_loc`, `emergency_type`, `dispatched_unit: "Station B"`, `eta: "6 mins"`).
6.  **End Result:** Alert appears on the Mission Control Panel.
```

---

### **File 3: `HACKATHON_CONTEXT.md`**

This crucial file provides the meta-context of the competition, guiding the AI on *why* certain decisions are important.

---

### **File 4: `CODE_ANALYSIS.md`**

A file dedicated to breaking down the provided code for the AI.