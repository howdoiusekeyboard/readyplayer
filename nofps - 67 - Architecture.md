## Architecture Description

**flash.ai** implements a **hierarchical agentic architecture** with clear separation of concerns:

1. **Event Trigger Layer**: n8n webhooks receive emergency requests (Fire/Ambulance/Police) with location data
2. **Data Standardization Layer**: JavaScript code node transforms raw webhook data into structured JSON format
3. **Agent Decision Layer**: Langflow-powered AI agent (running on local Ollama model) processes standardized data and orchestrates tools
4. **Tool Execution Layer**: 
   - **GIS Analytics Tool** (Python): Calculates optimal routing using Google Maps Distance Matrix API
   - **MCP Integration Tool**: Dispatches alerts to emergency services
5. **Output**: Autonomous dispatch of nearest/fastest emergency unit with ETA

**Data Flow**: `User Click → Webhook → Standardize → AI Agent → GIS Optimization → MCP Alert`