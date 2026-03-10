from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Amazon Nova Hackathon API",
    description="AI agent API built with Amazon Bedrock AgentCore and Nova models",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    user_id: str = "default-user"

class ChatResponse(BaseModel):
    response: str
    session_id: str

@app.get("/")
async def root():
    return {"message": "Amazon Nova Hackathon API"}

@app.post("/chat", response_model=ChatResponse, summary="Chat with AI Agent", description="Send a prompt to the AI agent and receive a response")
async def chat(request: ChatRequest):
    """
    Chat endpoint that processes user prompts through the AgentCore agent.
    
    - **prompt**: The user's message/question
    - **user_id**: Optional user identifier for session management
    """
    # TODO: Call AgentCore agent
    return ChatResponse(
        response="Agent response will go here",
        session_id="session-123"
    )

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
