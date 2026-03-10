// Shared TypeScript types between frontend and backend

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  prompt: string;
  user_id?: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export interface AgentConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
}
