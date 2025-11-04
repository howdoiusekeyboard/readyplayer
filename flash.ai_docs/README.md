# Project: flash.ai - Your One-Click Emergency Assistant

**Team Members:**
- Kushagra Golash
- Nikhil Akella
- Harshal Harode
- Varun Tikoo

**Hackathon:** Ready Player One (Microsoft Tech Club & Google Developers Group)

---

## 1. Project Concept

### Problem Statement
In critical situations, every second is crucial for survival. Complex interfaces and decision-making processes can lead to fatal delays. There is a need for a radically simplified and rapid emergency response system.

### Our Solution
**flash.ai** is an intelligent agent that provides a one-click solution for people in distress. Upon a single interaction, the agent autonomously handles the entire critical decision-making process: it locates the victim, identifies and selects the optimal medical/response unit, and dispatches a detailed alert.

---

## 2. Core Features

- **One-Click Activation:** A simple, intuitive trigger for initiating an emergency response.
- **Automatic Geo-location:** Instantly captures the user's precise GPS coordinates.
- **Optimized Dispatch:** Intelligently finds the nearest and fastest-responding emergency service (Ambulance, Police, Fire).
- **Real-time Alerting:** Sends a structured SOS alert to the appropriate authorities via an integrated Mission Control Panel (MCP).

---

## 3. Hackathon Theme Integration

This project is built around the three chosen theme cards:

- **Domain:** `GIS Analytics`
- **Function:** `Optimisation`
- **Wildcard:** `MCP Integration`

Our solution directly integrates these themes by using **GIS Analytics** to process location data, applying **Optimisation** to determine the best emergency unit to dispatch, and using **MCP Integration** as the channel for sending the final alert.

---

## 4. Technical Stack

- **Workflow Orchestration:** n8n
- **Agent Framework:** Langflow
- **LLM Engine:** Open-source, locally hosted model via Ollama (as per hackathon rules)
- **Core Logic & Tools:** Python
- **APIs:** Google Maps Distance Matrix API
- **Frontend/Trigger:** Webhooks simulating a mobile app button press.

---

## 5. Directory Structure
.
├── flash.ai_docs/
│ ├── README.md # This file
│ ├── ARCHITECTURE.md # Detailed technical workflow
│ ├── HACKATHON_CONTEXT.md # Rules, judging criteria, and strategic guidance
│ └── CODE_ANALYSIS.md # Breakdown of provided code
├── GISanalyser.py # Python tool for GIS calculations
└── My workflow (1).json # n8n workflow definition