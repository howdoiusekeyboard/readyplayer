# Code Component Analysis

This document provides a detailed analysis of the code artifacts for the flash.ai project.

---

## 1. n8n Workflow (`My workflow (1).json`)

This file defines the core data processing and orchestration pipeline.

### Nodes:

-   **`b42fa...` (FireEmergency)**, **`6649a...` (AmbulanceEmergency)**, **`84dd4...` (PoliceEmergency)**
    -   **Type:** `n8n-nodes-base.webhook`
    -   **Purpose:** These are the three entry points for the system. They listen for HTTP POST requests. Each is configured with a unique path, simulating different emergency buttons.

-   **`9ffac...` (Code in JavaScript)**
    -   **Type:** `n8n-nodes-base.code`
    -   **Purpose:** To normalize data from any of the three webhooks into a single, consistent format for the AI Agent.
    -   **Key Logic:**
        ```javascript
        const data = $json // Input from webhook
        const emergency = data.body.emergencyType;
        const latitude = data.body.latitude || "unknown"; // Graceful fallback
        const longitude = data.body.longitude || "unknown"; // Graceful fallback
        const loc = data.body.currentlocation;

        const jsonData = { /* ... structure data ... */ };
        return jsonData;
        ```
    -   **Analysis:** This is an excellent use of an n8n code node. It acts as a lightweight data transformation layer, ensuring the downstream agent receives predictable and clean data.

-   **`84e3c...` (AI Agent)**
    -   **Type:** `@n8n/n8n-nodes-langchain.agent`
    -   **Purpose:** This is the core decision-making engine, powered by Langflow. It receives the `jsonData` object from the Code node. Its behavior is defined by its system prompt and the tools connected to it.

-   **`cbc26...` (MCP Client)**
    -   **Type:** `@n8n/n8n-nodes-langchain.mcpClientTool`
    -   **Purpose:** This node is exposed as a tool to the `AI Agent`. When the agent decides to send an alert, it will invoke this tool with the necessary information.

### Connections:

-   `Webhook Triggers` -> `Code in JavaScript` (Many-to-one)
-   `Code in JavaScript` -> `AI Agent` (One-to-one)
-   `MCP Client` -> `AI Agent` (Tool connection)

---

## 2. Python Tool (`GISanalyser.py`)

This file defines a standalone function intended to be used as a tool by the AI agent.

-   **Function:** `calculate_driving_distance`
    -   **Purpose:** To provide real-world driving distance and duration between two geographical points. This is essential for the **Optimisation** function.
    -   **Dependencies:** `googlemaps`, `os`, `dotenv`. It requires a `GOOGLE_MAPS_APIKEY` in a `.env` file.
    -   **Input:** Origin (lat, lng), Destination (lat, lng).
    -   **Output:** A dictionary with human-readable text (`distance`, `duration`) and raw machine-readable values in meters and seconds. The raw values are critical for programmatic comparison.
      ```json
      {
          "distance": "2.9 km",
          "duration": "6 mins",
          "raw_distance_value": 2947,
          "raw_duration_value": 381
      }
      ```
    -   **Integration:** This function must be made available to the Langflow agent as a callable tool. The agent's prompt must instruct it on how and when to use this tool.