---

### **File 3: `HACKATHON_CONTEXT.md`**

This crucial file provides the meta-context of the competition, guiding the AI on *why* certain decisions are important.

```markdown
# Hackathon Strategic Context for flash.ai

**Objective:** This document provides the rules, constraints, and judging criteria for the Ready Player One hackathon. Your primary goal as an AI agent is to generate code, suggestions, and explanations that directly align with these parameters to maximize our chances of winning.

---

## 1. Core Rules & Constraints

1.  **Pitch Time:** 3-minute pitch, 2-minute Q&A. All explanations and demos must be extremely concise and impactful.
2.  **Mandatory Tech:** Use of **n8n** and **Langflow** is compulsory. Our architecture correctly centers on these tools.
3.  **Submission Checklist:**
    - Table number
    - Pitch PowerPoint Presentation
    - Demo video of the product
    - Brief description of the architecture (The `ARCHITECTURE.md` file serves this purpose).

### **CRITICAL NOTE: LLM Usage Constraint**
- The rules explicitly forbid the use of non-open-source, cloud-hosted LLMs (like GPT-4, commercial Claude APIs).
- All LLMs **must be open-source and locally hosted**, for example, using **Ollama**.
- **ACTION REQUIRED:** The provided `GISanalyser.py` file contains a reference to `model="claude-sonnet-..."`. This is a placeholder and **MUST be adapted** to work within the Langflow environment connected to a local Ollama model (e.g., Llama3, Mistral, Phi-3). Your logic must be compatible with the capabilities of these models.

---

## 2. Judging Criteria & Our Alignment Strategy

This section maps each judging criterion to how the `flash.ai` project excels. Use this as a guide for generating pitch points and feature explanations.

### Pitching Criteria (Page 1)

-   **Relevance of Problem Statement (20 pts):**
    -   **Strategy:** Emphasize the universal and critical nature of emergency response. Our solution addresses a real-world problem where seconds save lives.
-   **Idea (20 pts):**
    -   **Strategy:** Highlight the novelty of a "one-click" autonomous agent. It's not just a button that calls someone; it's an agent that *thinks* and *optimizes* the response.
-   **Overall Architecture and AI Workflow (20 pts):**
    -   **Strategy:** Showcase the `ARCHITECTURE.md` diagram. The flow is logical and clean: Ingest (Webhook) -> Standardize (Code Node) -> Decide (AI Agent) -> Act (Tools). This is a strong, modern agentic pattern.
-   **Demo (20 pts):**
    -   **Strategy:** The demo must be smooth and clearly show the cause-and-effect: 1. A webhook is triggered. 2. The n8n workflow executes. 3. The final alert appears on a mock "MCP" screen with the *correct, optimized* information.
-   **Alignment with Cards Chosen (20 pts):**
    -   **Strategy:** This is a major scoring category. Explicitly state:
        -   "We use **GIS Analytics** to understand the spatial relationship between the victim and responders."
        -   "We use **Optimisation** to intelligently select the fastest responder, not just the closest one."
        -   "We use **MCP Integration** as our robust, scalable alerting mechanism."

### Technical Evaluation Criteria (Page 2)

-   **Prompt Quality (15 pts):**
    -   **Strategy:** The agent's system prompt in Langflow should be well-defined, outlining its role, the tools it has, and the format of its output. It should include guardrails like "Only use the provided tools to get information."
-   **Clean Design Arch (25 pts):**
    -   **Strategy:** Our architecture is our strongest technical point. It's a clear agentic hierarchy (Director -> Specialist -> Tool). The n8n workflow visually represents this clean design.
-   **Ollama Integration (15 pts):**
    -   **Strategy:** We must demonstrate that our Langflow agent is running on a local model via Ollama. Mentioning a specific model (e.g., "We used Phi-3 for its speed and efficiency") is a bonus.
-   **Code Quality (10 pts):**
    -   **Strategy:** The `GISanalyser.py` code is clean, modular, and includes error handling. The n8n JS code is simple and effective.