# Requirements Document: PagerMind (Multi-Agent MVP for Hackathon)

## Introduction

PagerMind is an autonomous incident response system designed for the Amazon Nova AI Hackathon. The system uses a multi-agent architecture where specialized agents collaborate to detect incidents, diagnose root causes, execute remediation, and validate recovery - all while maintaining strict evidence-based guardrails.

**Hackathon MVP Scope (6 days):**
- Multi-agent system using Amazon Nova 2 Lite (Triage → Diagnosis → Fix → Validation)
- Real AWS microservices architecture (ECS Fargate)
- 3 microservices: checkout-service, inventory-service, payment-service
- Real AWS infrastructure: DynamoDB, SQS, CloudWatch, X-Ray
- Focus on ONE scenario: deployment-caused errors with automatic rollback
- Evidence-based decision making (no confidence scores)
- Real CloudWatch logs and metrics integration
- Agent orchestration via AWS Bedrock AgentCore
- GitHub PR creation for permanent fix
- Public dashboard for judges to test

**Multi-Agent Architecture:**
- **Triage Agent**: Detects incidents from CloudWatch metrics, classifies severity
- **Diagnosis Agent**: Analyzes logs, traces, deployments to find root cause
- **Fix Agent**: Validates evidence and executes remediation (rollback)
- **Validation Agent**: Verifies fix worked and creates permanent solution PR
- **Orchestrator**: Coordinates agent workflow and manages state transitions

**AWS Infrastructure:**
- ECS Fargate for container orchestration
- DynamoDB for data storage and audit trail
- SQS for async messaging between services
- CloudWatch for logs and metrics
- X-Ray for distributed tracing
- ECR for container images
- Application Load Balancer for traffic routing
- Bedrock AgentCore for agent orchestration

**Out of Scope for MVP:**
- Vector DB for incident memory (use DynamoDB)
- Complex blast radius analysis (focus on checkout service)
- Human approval workflows (demo auto-fix only)
- PagerDuty integration (Slack notifications only)

## Glossary

- **PagerMind**: The complete autonomous incident response system
- **Triage_Agent**: Agent that detects incidents and classifies severity
- **Diagnosis_Agent**: Agent that performs root cause analysis
- **Fix_Agent**: Agent that validates evidence and executes remediation
- **Validation_Agent**: Agent that verifies fixes and creates permanent solutions
- **Orchestrator**: Component that coordinates multi-agent workflow
- **Checkout_Service**: ECS service handling order checkout logic
- **Inventory_Service**: ECS service managing product inventory
- **Payment_Service**: ECS service processing payments
- **Orders_Table**: DynamoDB table storing order data
- **Inventory_Table**: DynamoDB table storing product inventory
- **Order_Queue**: SQS queue for async order processing
- **CloudWatch_Logs**: AWS CloudWatch Logs for application logging
- **CloudWatch_Metrics**: AWS CloudWatch Metrics for service metrics
- **X-Ray**: AWS X-Ray for distributed tracing
- **ECS_Cluster**: AWS ECS Fargate cluster running the services
- **Task_Definition**: ECS task definition specifying container configuration
- **Service_Deployment**: ECS service deployment with specific task definition revision
- **Evidence_Validator**: Component that verifies evidence criteria before actions
- **Rollback_Executor**: Component that rolls back ECS service to previous task definition
- **GitHub_Integrator**: Component that creates pull requests
- **Audit_Log**: DynamoDB table storing agent decisions and actions
- **Agent_State**: DynamoDB table storing current workflow state
- **AUTO_ALLOWED**: Safe, reversible actions (rollback, restart, scale)
- **Evidence_Criteria**: Specific conditions required to justify an action

## Requirements

### Requirement 1: Multi-Agent Orchestration

**User Story:** As a system architect, I want agents to work together through structured workflows, so that incident response follows a reliable process with clear handoffs.

#### Acceptance Criteria

1. THE Orchestrator SHALL manage workflow state in Agent_State DynamoDB table
2. WHEN an incident is detected, THE Orchestrator SHALL invoke Triage_Agent first
3. WHEN Triage_Agent completes, THE Orchestrator SHALL invoke Diagnosis_Agent with incident context
4. WHEN Diagnosis_Agent completes, THE Orchestrator SHALL invoke Fix_Agent with recommended actions
5. WHEN Fix_Agent completes, THE Orchestrator SHALL invoke Validation_Agent with remediation details
6. THE Orchestrator SHALL pass context between agents using structured JSON messages
7. THE Orchestrator SHALL record agent transitions in Audit_Log with timestamps
8. WHEN any agent fails, THE Orchestrator SHALL retry once before escalating to human
9. THE Orchestrator SHALL enforce maximum workflow execution time of 10 minutes
10. THE Orchestrator SHALL support querying current workflow state via API
11. THE Orchestrator SHALL use AWS Bedrock AgentCore for agent management

### Requirement 2: Triage Agent - Incident Detection

**User Story:** As an SRE, I want the Triage Agent to detect incidents and classify severity, so that response is prioritized appropriately.

#### Acceptance Criteria

1. THE Triage_Agent SHALL poll CloudWatch Metrics every 30 seconds
2. WHEN error rate exceeds 10% OR latency increases by 200%, THE Triage_Agent SHALL create an incident
3. THE Triage_Agent SHALL assign severity: CRITICAL (error rate >20%), HIGH (>10%), MEDIUM (>5%)
4. THE Triage_Agent SHALL identify affected service from metric dimensions
5. THE Triage_Agent SHALL calculate blast radius (count of dependent services)
6. THE Triage_Agent SHALL generate incident_id (UUID) and store in Agent_State
7. THE Triage_Agent SHALL record incident detection in Audit_Log with: incident_id, severity, affected_service, error_rate, detection_timestamp
8. THE Triage_Agent SHALL use Amazon Nova 2 Lite to generate incident summary
9. THE Triage_Agent SHALL send Slack notification with incident details
10. THE Triage_Agent SHALL return incident context to Orchestrator for Diagnosis_Agent

### Requirement 3: Diagnosis Agent - Root Cause Analysis

**User Story:** As an SRE, I want the Diagnosis Agent to find root causes through multi-source analysis, so that fixes target the actual problem.

#### Acceptance Criteria

1. THE Diagnosis_Agent SHALL receive incident context from Orchestrator
2. THE Diagnosis_Agent SHALL query CloudWatch Logs for the last 30 minutes
3. THE Diagnosis_Agent SHALL query CloudWatch Metrics for the last 60 minutes
4. THE Diagnosis_Agent SHALL query X-Ray traces for failed requests
5. THE Diagnosis_Agent SHALL query ECS deployment history for the last 24 hours
6. THE Diagnosis_Agent SHALL use Amazon Nova 2 Lite to analyze all collected data
7. THE Diagnosis_Agent SHALL identify temporal correlation between deployment and errors
8. WHEN deployment occurred within 30 minutes of error spike, THE Diagnosis_Agent SHALL flag as likely cause
9. WHEN X-Ray shows DynamoDB scan operations, THE Diagnosis_Agent SHALL flag as missing GSI
10. THE Diagnosis_Agent SHALL generate root cause hypothesis with supporting evidence
11. THE Diagnosis_Agent SHALL record analysis in Audit_Log with: hypothesis, evidence, Nova 2 Lite reasoning
12. THE Diagnosis_Agent SHALL return diagnosis context to Orchestrator for Fix_Agent

### Requirement 4: Fix Agent - Evidence-Based Remediation

**User Story:** As an SRE, I want the Fix Agent to validate evidence before taking action, so that remediations are safe and justified.

#### Acceptance Criteria

1. THE Fix_Agent SHALL receive diagnosis context from Orchestrator
2. THE Fix_Agent SHALL validate evidence criteria for rollback:
   - ECS deployment occurred within 30 minutes
   - Error rate increased within 5 minutes after deployment
   - Error rate increased by at least 10 percentage points
   - Previous task definition had error rate below 2% for 24 hours
3. WHEN all 4 criteria are met, THE Fix_Agent SHALL approve rollback
4. WHEN any criterion fails, THE Fix_Agent SHALL reject rollback and escalate to human
5. THE Fix_Agent SHALL use boto3 to update ECS service to previous task definition
6. THE Fix_Agent SHALL wait for ECS deployment to reach COMPLETED status (max 5 minutes)
7. THE Fix_Agent SHALL verify new tasks are in RUNNING state
8. THE Fix_Agent SHALL record evidence validation and rollback execution in Audit_Log
9. THE Fix_Agent SHALL send Slack notification with rollback details
10. THE Fix_Agent SHALL return remediation context to Orchestrator for Validation_Agent
11. WHEN rollback fails, THE Fix_Agent SHALL record error and escalate to human

### Requirement 5: Validation Agent - Recovery Verification and Permanent Fix

**User Story:** As an SRE, I want the Validation Agent to verify fixes worked and create permanent solutions, so that incidents are fully resolved.

#### Acceptance Criteria

1. THE Validation_Agent SHALL receive remediation context from Orchestrator
2. THE Validation_Agent SHALL wait 60 seconds for metrics to stabilize
3. THE Validation_Agent SHALL query CloudWatch Metrics for post-rollback error rate and latency
4. WHEN error rate is below 2% AND latency is below 500ms, THE Validation_Agent SHALL mark incident as resolved
5. WHEN metrics are still degraded, THE Validation_Agent SHALL mark rollback as ineffective and escalate
6. THE Validation_Agent SHALL retrieve code diff between task definition revisions from GitHub
7. THE Validation_Agent SHALL use Amazon Nova 2 Lite to analyze code changes and generate permanent fix
8. WHEN root cause is missing DynamoDB GSI, THE Validation_Agent SHALL generate CloudFormation/CDK code
9. THE Validation_Agent SHALL create GitHub pull request with: incident summary, root cause, evidence, fix code
10. THE Validation_Agent SHALL record validation results and PR creation in Audit_Log
11. THE Validation_Agent SHALL send final incident report to Slack with PR link
12. THE Validation_Agent SHALL return completion status to Orchestrator

### Requirement 6: AWS Microservices Architecture

**User Story:** As a hackathon judge, I want to see a real microservices application on AWS, so that I can evaluate PagerMind in a realistic production-like environment.

#### Acceptance Criteria

1. THE Checkout_Service SHALL be deployed on ECS Fargate with 2 tasks
2. THE Inventory_Service SHALL be deployed on ECS Fargate with 2 tasks
3. THE Payment_Service SHALL be deployed on ECS Fargate with 2 tasks
4. THE Checkout_Service SHALL expose POST /api/checkout endpoint via Application Load Balancer
5. THE Checkout_Service SHALL call Inventory_Service to check stock availability
6. THE Checkout_Service SHALL call Payment_Service to process payment
7. THE Checkout_Service SHALL write order data to Orders_Table in DynamoDB
8. THE Inventory_Service SHALL read/write to Inventory_Table in DynamoDB
9. THE Checkout_Service SHALL publish order events to Order_Queue in SQS
10. ALL services SHALL emit logs to CloudWatch Logs with structured JSON format
11. ALL services SHALL emit custom metrics to CloudWatch Metrics (request count, error count, latency)
12. ALL services SHALL be instrumented with X-Ray for distributed tracing

### Requirement 7: Deployable Bug Scenario

**User Story:** As a hackathon participant, I want to deploy a version with a realistic bug, so that PagerMind can detect and fix it autonomously.

#### Acceptance Criteria

1. THE Checkout_Service SHALL have two task definition revisions: v1 (working) and v2 (broken)
2. WHEN v2 is deployed, THE Checkout_Service SHALL fail 20% of checkout requests with 500 errors
3. THE v2 bug SHALL be a DynamoDB query missing a Global Secondary Index (GSI)
4. THE v2 bug SHALL cause DynamoDB queries to scan the entire table (slow and expensive)
5. THE v2 bug SHALL cause request latency to increase from 200ms to 5000ms
6. THE v1 version SHALL have error rate below 1% and latency below 300ms
7. THE deployment SHALL be triggered via AWS CLI or boto3 updating ECS service

### Requirement 8: CloudWatch Integration

**User Story:** As an SRE, I want agents to read real CloudWatch data, so that they analyze actual production metrics and logs.

#### Acceptance Criteria

1. Agents SHALL use boto3 to query CloudWatch Logs Insights
2. Agents SHALL query CloudWatch Metrics for error count, request count, and latency
3. Agents SHALL parse structured JSON logs with fields: timestamp, level, message, status_code, latency_ms
4. Agents SHALL calculate error rate as (5xx count / total requests)
5. Agents SHALL identify error spike timing from metric timestamps
6. Agents SHALL retrieve logs from /ecs/checkout-service log group

### Requirement 9: X-Ray Trace Analysis

**User Story:** As an SRE, I want the Diagnosis Agent to analyze X-Ray traces, so that it understands which service in the call chain is failing.

#### Acceptance Criteria

1. THE Diagnosis_Agent SHALL use boto3 to query X-Ray traces
2. THE Diagnosis_Agent SHALL retrieve traces for failed requests (status code 5xx)
3. THE Diagnosis_Agent SHALL identify which service segment has the highest error rate
4. THE Diagnosis_Agent SHALL identify which service segment has the highest latency
5. THE Diagnosis_Agent SHALL extract DynamoDB operation details from X-Ray subsegments
6. WHEN DynamoDB scan operations are detected, THE Diagnosis_Agent SHALL flag as potential missing index issue

### Requirement 10: ECS Deployment Management

**User Story:** As an SRE, I want agents to check and manage ECS deployments, so that they can correlate errors with deployments and execute rollbacks.

#### Acceptance Criteria

1. THE Diagnosis_Agent SHALL use boto3 to query ECS service deployment history
2. THE Diagnosis_Agent SHALL retrieve the last 5 deployments for checkout-service
3. FOR EACH deployment, THE Diagnosis_Agent SHALL extract: task definition revision, deployment timestamp, deployment status
4. THE Fix_Agent SHALL use boto3 to update ECS service to previous task definition revision
5. THE Fix_Agent SHALL wait for ECS deployment to reach COMPLETED status
6. THE Fix_Agent SHALL verify new tasks are in RUNNING state and old tasks are stopped

### Requirement 11: DynamoDB Audit Trail and State Management

**User Story:** As an SRE, I want a complete record of agent decisions in DynamoDB, so that I can query and analyze incident history.

#### Acceptance Criteria

1. THE Audit_Log SHALL be a DynamoDB table with partition key incident_id and sort key timestamp
2. THE Agent_State SHALL be a DynamoDB table with partition key incident_id storing current workflow state
3. THE Audit_Log SHALL store entries for each agent action with: agent_name, action, input_context, output_context, timestamp
4. THE Audit_Log SHALL store Nova 2 Lite reasoning and token usage for each agent invocation
5. THE Audit_Log SHALL store evidence validation results with pass/fail for each criterion
6. THE Audit_Log SHALL store ECS deployment details (old and new task definition revisions)
7. THE Audit_Log SHALL store CloudWatch metrics snapshots (before and after remediation)
8. THE Audit_Log SHALL store PR creation details with PR URL

### Requirement 12: Web Dashboard with Real-Time AWS Data

**User Story:** As a hackathon judge, I want to see PagerMind's multi-agent workflow and real AWS metrics in real-time, so that I can follow along during the demo.

#### Acceptance Criteria

1. THE web dashboard SHALL display current workflow state (which agent is active)
2. THE web dashboard SHALL display agent transition history in a timeline view
3. THE web dashboard SHALL display current ECS service status for all 3 services
4. THE web dashboard SHALL display current error rate from CloudWatch Metrics
5. THE web dashboard SHALL display current p99 latency from CloudWatch Metrics
6. THE web dashboard SHALL display recent CloudWatch log entries (last 20)
7. THE web dashboard SHALL display ECS deployment history (last 5 deployments)
8. THE web dashboard SHALL display the Audit_Log from DynamoDB in a timeline view
9. THE web dashboard SHALL update in real-time by polling AWS APIs every 10 seconds
10. THE web dashboard SHALL have a "Trigger Incident" button that deploys v2 task definition
11. THE web dashboard SHALL display AWS X-Ray service map showing service dependencies
12. THE web dashboard SHALL be publicly accessible for judges to test

### Requirement 13: Slack Notifications

**User Story:** As an SRE, I want Slack notifications at each agent transition, so that I can follow the multi-agent workflow in real-time.

#### Acceptance Criteria

1. WHEN Triage_Agent detects an incident, PagerMind SHALL send Slack message with incident details
2. WHEN Diagnosis_Agent completes analysis, PagerMind SHALL send Slack message with root cause hypothesis
3. WHEN Fix_Agent executes rollback, PagerMind SHALL send Slack message with rollback details
4. WHEN Validation_Agent resolves incident, PagerMind SHALL send Slack message with resolution summary and PR link
5. Slack messages SHALL include links to CloudWatch dashboard and web dashboard
6. Slack messages SHALL include agent name and current workflow state

### Requirement 14: Amazon Nova 2 Lite Integration via AgentCore

**User Story:** As a hackathon participant, I want to showcase Amazon Nova 2 Lite via AgentCore, so that judges see the model's reasoning capabilities across multiple agents.

#### Acceptance Criteria

1. ALL agents SHALL use Amazon Nova 2 Lite (amazon.nova-lite-v1:0) via AWS Bedrock AgentCore
2. THE Triage_Agent SHALL use Nova 2 Lite to generate incident summaries
3. THE Diagnosis_Agent SHALL use Nova 2 Lite to analyze logs, metrics, and traces for root cause
4. THE Validation_Agent SHALL use Nova 2 Lite to analyze code diffs and generate permanent fixes
5. EACH agent SHALL record Nova 2 Lite's reasoning in the Audit_Log
6. EACH agent SHALL record token usage and estimated cost in the Audit_Log
7. THE web dashboard SHALL display total Nova 2 Lite token usage and cost for the incident

### Requirement 15: Demo Scenario Execution

**User Story:** As a hackathon participant, I want a reliable demo on real AWS infrastructure, so that judges see the multi-agent system working end-to-end.

#### Acceptance Criteria

1. THE demo SHALL start with checkout-service running v1 task definition with <1% error rate
2. WHEN "Trigger Incident" is clicked, ECS SHALL deploy v2 task definition within 60 seconds
3. WITHIN 90 seconds, error rate SHALL increase to 20% (visible in CloudWatch Metrics)
4. WITHIN 120 seconds, Triage_Agent SHALL detect the incident
5. WITHIN 180 seconds, Diagnosis_Agent SHALL complete root cause analysis
6. WITHIN 240 seconds, Fix_Agent SHALL execute ECS rollback to v1
7. WITHIN 360 seconds, Validation_Agent SHALL validate recovery
8. WITHIN 480 seconds, Validation_Agent SHALL create GitHub PR with DynamoDB GSI fix
9. THE entire demo SHALL complete within 8 minutes from trigger to PR creation
10. THE demo SHALL be repeatable by deploying v2 again
11. THE web dashboard SHALL show agent transitions in real-time

### Requirement 16: Infrastructure as Code

**User Story:** As a hackathon participant, I want infrastructure defined as code, so that setup is automated and judges can deploy it.

#### Acceptance Criteria

1. ALL AWS infrastructure SHALL be defined in Terraform or AWS CDK
2. THE infrastructure code SHALL create: ECS cluster, 3 ECS services, 3 DynamoDB tables (Orders, Inventory, Audit_Log, Agent_State), 1 SQS queue, Application Load Balancer
3. THE infrastructure code SHALL configure CloudWatch Logs with log groups for each service
4. THE infrastructure code SHALL configure CloudWatch Metrics with custom metrics
5. THE infrastructure code SHALL configure X-Ray tracing for all services
6. THE infrastructure code SHALL configure IAM roles with least-privilege permissions
7. THE infrastructure code SHALL configure Bedrock AgentCore with agent definitions
8. THE infrastructure code SHALL be deployable with a single command (terraform apply or cdk deploy)
9. THE infrastructure code SHALL output: ALB URL, ECS cluster name, DynamoDB table names, dashboard URL
10. THE infrastructure code SHALL include a README with deployment instructions

### Requirement 17: Public Access for Judges

**User Story:** As a hackathon judge, I want to access and test PagerMind, so that I can evaluate it beyond the demo video.

#### Acceptance Criteria

1. THE web dashboard SHALL be publicly accessible via HTTPS
2. THE web dashboard SHALL have a "Trigger Incident" button that judges can click
3. THE web dashboard SHALL display real-time agent workflow execution
4. THE GitHub repository SHALL be public with complete source code
5. THE GitHub repository SHALL include one-click deploy instructions
6. THE Devpost submission SHALL include: demo video, GitHub repo link, live dashboard URL, architecture diagram
7. THE system SHALL remain running during the judging period (March 17-24, 2026)

### Requirement 18: Error Handling

**User Story:** As a hackathon participant, I want graceful error handling, so that the demo doesn't crash during presentation.

#### Acceptance Criteria

1. WHEN GitHub API is unavailable, Validation_Agent SHALL log the error and continue without PR creation
2. WHEN Slack API is unavailable, agents SHALL log the error and continue without notifications
3. WHEN Nova 2 Lite API fails, agents SHALL retry once before failing
4. WHEN CloudWatch API is rate-limited, agents SHALL implement exponential backoff
5. WHEN ECS rollback fails, Fix_Agent SHALL record the failure in Audit_Log and alert via Slack
6. WHEN any agent fails, Orchestrator SHALL retry once before escalating to human
7. WHEN any component fails, the web dashboard SHALL display error message
8. PagerMind SHALL never crash or hang during demo execution

## Correctness Properties for Property-Based Testing

### Property 1: Agent Workflow Ordering

FOR ALL workflow executions, agent transitions SHALL follow the sequence: Triage → Diagnosis → Fix → Validation, with no backward transitions except on retry (state machine invariant).

### Property 2: Audit Log Append-Only

FOR ALL audit log operations, WHEN an entry is added, THEN previous entries SHALL remain unchanged (append-only property).

### Property 3: Evidence Validation Determinism

FOR ALL evidence sets with identical data, THE Fix_Agent SHALL produce identical approval/rejection decisions (determinism property).

### Property 4: Error Rate Calculation Accuracy

FOR ALL metric data, error_rate SHALL equal (count of 5xx responses) / (total requests) AND SHALL be in range [0.0, 1.0] (accuracy property).

### Property 5: Timestamp Monotonicity

FOR ALL audit log entries within a single incident, timestamps SHALL be monotonically increasing (ordering invariant).

### Property 6: Agent Context Preservation

FOR ALL agent transitions, output context from agent N SHALL be included in input context for agent N+1 (context preservation property).

### Property 7: Rollback Idempotence

FOR ALL rollback operations to the same task definition, executing rollback multiple times SHALL produce the same final state (idempotence property).

---

## Notes

This is a multi-agent MVP requirements document scoped for a 6-day hackathon. The focus is on demonstrating autonomous multi-agent collaboration for incident response, showcasing Amazon Nova 2 Lite's reasoning capabilities across specialized agents, and providing a publicly accessible demo for judges to test. The multi-agent architecture demonstrates innovation and aligns with the "Agentic AI" category judging criteria.
