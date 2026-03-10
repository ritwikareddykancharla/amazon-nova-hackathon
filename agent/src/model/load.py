from strands.models import BedrockModel

# Amazon Nova 2 Lite - Fast, cost-effective reasoning model
# Perfect for the Amazon Nova AI Hackathon!
# https://docs.aws.amazon.com/nova/latest/userguide/what-is-nova.html
MODEL_ID = "us.amazon.nova-lite-v1:0"

def load_model() -> BedrockModel:
    """
    Get Bedrock model client using Amazon Nova 2 Lite.
    Uses IAM authentication via the execution role.
    """
    return BedrockModel(model_id=MODEL_ID)