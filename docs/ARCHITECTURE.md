# Architecture

## Overview

This project is a monorepo containing three main components:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────────────┐
│   Next.js   │─────▶│   FastAPI   │─────▶│  AgentCore Agent    │
│  Frontend   │      │   Backend   │      │  (Amazon Nova 2)    │
└─────────────┘      └─────────────┘      └─────────────────────┘
     :3000                :8000                  AWS Bedrock
```

## Components

### Frontend (Next.js)
- User interface
- Chat interface
- Real-time streaming responses
- Port: 3000

### Backend (FastAPI)
- REST API layer
- Authentication/authorization
- Request validation
- AgentCore client
- Port: 8000

### Agent (AgentCore + Strands)
- Amazon Nova 2 Lite model
- Code Interpreter tool
- MCP tools integration
- Deployed on AWS Bedrock AgentCore

## Data Flow

1. User sends message via Next.js UI
2. Frontend calls FastAPI backend `/chat` endpoint
3. Backend invokes AgentCore agent
4. Agent processes with Nova 2 Lite + tools
5. Response streams back through backend to frontend

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.10, Pydantic
- **Agent**: Strands SDK, Amazon Nova 2 Lite, AgentCore
- **Infrastructure**: AWS Bedrock, AgentCore Runtime
