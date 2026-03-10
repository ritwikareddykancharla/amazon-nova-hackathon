# Amazon Nova Hackathon Project

Full-stack AI application powered by Amazon Nova 2 Lite, AWS Bedrock AgentCore, and the Strands framework.

## 🏗️ Project Structure

```
amazon-nova-hackathon/
├── agent/          # AgentCore agent (Strands + Nova 2 Lite)
├── backend/        # FastAPI REST API
├── frontend/       # Next.js web application
├── shared/         # Shared types and utilities
└── docs/           # Documentation and architecture
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- AWS Account with Bedrock access
- AgentCore CLI installed

### 1. Agent Setup
```bash
cd agent
source .venv/bin/activate  # Windows: .venv\Scripts\activate
agentcore deploy
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd src && python main.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Agent Documentation](agent/README.md)
- [Backend API](backend/README.md)
- [Frontend Guide](frontend/README.md)

## 🛠️ Tech Stack

- **AI Model**: Amazon Nova 2 Lite
- **Agent Framework**: Strands SDK
- **Agent Platform**: AWS Bedrock AgentCore
- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React + TypeScript)
- **Tools**: Code Interpreter, MCP Gateway

## 📝 Development

Each component can be developed independently. See individual README files in each directory for specific instructions.

## 🎯 Hackathon Submission

Built for the Amazon Nova AI Hackathon 2026.

## 📄 License

MIT
