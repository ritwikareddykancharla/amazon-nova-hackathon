/**
 * Example: How to call your AgentCore agent from a JavaScript/TypeScript application
 */
import { BedrockAgentCoreClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agentcore";

// Initialize client
const client = new BedrockAgentCoreClient({ region: "us-east-1" });

// Your agent ARN
const AGENT_ARN = "arn:aws:bedrock-agentcore:us-east-1:954672827101:runtime/MyFirstAgent_Agent-fcy13o4Lf6";

/**
 * Invoke agent and get complete response
 */
async function invokeAgent(prompt, sessionId = null) {
  const payload = { prompt };
  
  const command = new InvokeAgentCommand({
    agentArn: AGENT_ARN,
    payload: JSON.stringify(payload),
    ...(sessionId && { sessionId })
  });
  
  const response = await client.send(command);
  
  // Collect streaming response
  let result = "";
  for await (const event of response.body) {
    if (event.chunk?.bytes) {
      result += new TextDecoder().decode(event.chunk.bytes);
    }
  }
  
  return result;
}

/**
 * Invoke agent with streaming (for real-time UI updates)
 */
async function* invokeAgentStreaming(prompt, sessionId = null) {
  const payload = { prompt };
  
  const command = new InvokeAgentCommand({
    agentArn: AGENT_ARN,
    payload: JSON.stringify(payload),
    ...(sessionId && { sessionId })
  });
  
  const response = await client.send(command);
  
  for await (const event of response.body) {
    if (event.chunk?.bytes) {
      yield new TextDecoder().decode(event.chunk.bytes);
    }
  }
}

// Example usage in React component
export function ChatComponent() {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const sessionId = React.useRef(`session-${Date.now()}`);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }]);
    setInput("");
    setLoading(true);
    
    try {
      // Stream agent response
      let agentResponse = "";
      for await (const chunk of invokeAgentStreaming(input, sessionId.current)) {
        agentResponse += chunk;
        // Update UI in real-time
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage?.role === "agent") {
            lastMessage.content = agentResponse;
          } else {
            newMessages.push({ role: "agent", content: agentResponse });
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error invoking agent:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      <input 
        value={input} 
        onChange={e => setInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        disabled={loading}
      />
      <button onClick={sendMessage} disabled={loading}>
        Send
      </button>
    </div>
  );
}

// Example: Simple Node.js usage
async function main() {
  console.log("Simple invocation:");
  const response = await invokeAgent("What is 5 + 3?");
  console.log(response);
  
  console.log("\nStreaming invocation:");
  for await (const chunk of invokeAgentStreaming("Calculate fibonacci")) {
    process.stdout.write(chunk);
  }
}

// Uncomment to run
// main();
