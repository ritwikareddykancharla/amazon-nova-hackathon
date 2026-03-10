# Calling Your Agent via REST API

Your agent can be invoked using AWS Signature V4 signed HTTP requests from any language.

## Endpoint

```
POST https://bedrock-agentcore.us-east-1.amazonaws.com/agents/{agentArn}/invoke
```

## Authentication

Use AWS Signature V4 signing with your AWS credentials.

## Python Example (using requests)

```python
import requests
from requests_aws4auth import AWS4Auth
import boto3
import json

# Get AWS credentials
session = boto3.Session()
credentials = session.get_credentials()

# Create AWS4Auth
auth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    'us-east-1',
    'bedrock-agentcore',
    session_token=credentials.token
)

# Agent ARN
agent_arn = "arn:aws:bedrock-agentcore:us-east-1:954672827101:runtime/MyFirstAgent_Agent-fcy13o4Lf6"

# Make request
url = f"https://bedrock-agentcore.us-east-1.amazonaws.com/agents/{agent_arn}/invoke"
payload = {"prompt": "Hello!"}

response = requests.post(
    url,
    auth=auth,
    json=payload,
    headers={'Content-Type': 'application/json'}
)

print(response.text)
```

## cURL Example

```bash
# First, get temporary credentials
aws sts get-session-token

# Then use aws-curl or similar tool to sign the request
aws-curl POST \
  "https://bedrock-agentcore.us-east-1.amazonaws.com/agents/arn:aws:bedrock-agentcore:us-east-1:954672827101:runtime/MyFirstAgent_Agent-fcy13o4Lf6/invoke" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'
```

## Integration Patterns

### 1. Backend API Integration
```python
# In your FastAPI/Flask app
from fastapi import FastAPI
import boto3

app = FastAPI()
agentcore_client = boto3.client('bedrock-agentcore', region_name='us-east-1')

@app.post("/chat")
async def chat(message: str, session_id: str = None):
    response = agentcore_client.invoke_agent(
        agentArn="arn:aws:bedrock-agentcore:us-east-1:954672827101:runtime/MyFirstAgent_Agent-fcy13o4Lf6",
        payload=json.dumps({"prompt": message}),
        sessionId=session_id or f"session-{uuid.uuid4()}"
    )
    
    # Stream response back to client
    async def generate():
        for event in response['body']:
            if 'chunk' in event:
                yield event['chunk']['bytes']
    
    return StreamingResponse(generate())
```

### 2. Webhook Integration
```python
# Slack bot example
@app.post("/slack/events")
async def slack_events(request: Request):
    data = await request.json()
    
    if data['type'] == 'event_callback':
        event = data['event']
        if event['type'] == 'message':
            # Invoke agent
            response = invoke_agent(event['text'])
            
            # Send response back to Slack
            slack_client.chat_postMessage(
                channel=event['channel'],
                text=response
            )
    
    return {"ok": True}
```

### 3. Scheduled Jobs
```python
# AWS Lambda function that runs on schedule
def lambda_handler(event, context):
    # Daily summary agent
    response = invoke_agent("Generate a summary of today's activities")
    
    # Send to email/Slack/etc
    send_notification(response)
```

## Performance Tips

1. **Keep sessions warm**: Set `idle_runtime_session_timeout` to keep the agent ready
2. **Reuse sessions**: Use the same `session_id` for conversations
3. **Connection pooling**: Reuse boto3 clients across requests
4. **Async invocations**: Use async/await for better performance
5. **Caching**: Cache common responses if appropriate
