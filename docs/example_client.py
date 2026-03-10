"""
Example: How to call your AgentCore agent from any application
"""
import boto3
import json

# Initialize Bedrock AgentCore client
client = boto3.client('bedrock-agentcore', region_name='us-east-1')

# Your agent ARN (from agentcore status)
AGENT_ARN = "arn:aws:bedrock-agentcore:us-east-1:954672827101:runtime/MyFirstAgent_Agent-fcy13o4Lf6"

def invoke_agent(prompt: str, session_id: str = None):
    """
    Invoke your agent with a prompt
    
    Args:
        prompt: The user's message
        session_id: Optional session ID for conversation continuity
    
    Returns:
        The agent's response
    """
    payload = {
        "prompt": prompt
    }
    
    # Add session_id if provided for conversation continuity
    request_params = {
        'agentArn': AGENT_ARN,
        'payload': json.dumps(payload)
    }
    
    if session_id:
        request_params['sessionId'] = session_id
    
    # Invoke the agent
    response = client.invoke_agent(**request_params)
    
    # Read the streaming response
    result = ""
    for event in response['body']:
        if 'chunk' in event:
            chunk = event['chunk']
            if 'bytes' in chunk:
                result += chunk['bytes'].decode('utf-8')
    
    return result


def invoke_agent_streaming(prompt: str, session_id: str = None):
    """
    Invoke agent with streaming response (for real-time UI updates)
    
    Yields chunks of the response as they arrive
    """
    payload = {
        "prompt": prompt
    }
    
    request_params = {
        'agentArn': AGENT_ARN,
        'payload': json.dumps(payload)
    }
    
    if session_id:
        request_params['sessionId'] = session_id
    
    response = client.invoke_agent(**request_params)
    
    for event in response['body']:
        if 'chunk' in event:
            chunk = event['chunk']
            if 'bytes' in chunk:
                yield chunk['bytes'].decode('utf-8')


# Example usage
if __name__ == "__main__":
    # Simple invocation
    print("Simple invocation:")
    response = invoke_agent("What is 5 + 3?")
    print(response)
    print("\n" + "="*50 + "\n")
    
    # Streaming invocation
    print("Streaming invocation:")
    for chunk in invoke_agent_streaming("Calculate the first 5 fibonacci numbers"):
        print(chunk, end='', flush=True)
    print("\n" + "="*50 + "\n")
    
    # Conversation with session
    print("Conversation with session:")
    session = "my-conversation-123"
    response1 = invoke_agent("My favorite color is blue", session_id=session)
    print(f"Agent: {response1}")
    
    response2 = invoke_agent("What's my favorite color?", session_id=session)
    print(f"Agent: {response2}")
