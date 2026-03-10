# Backend API

FastAPI backend that connects the Next.js frontend to the AgentCore agent.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Development

```bash
cd src
python main.py
```

API will be available at http://localhost:8000

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
