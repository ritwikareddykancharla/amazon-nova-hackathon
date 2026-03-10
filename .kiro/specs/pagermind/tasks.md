# Implementation Plan: PagerMind

## Overview

This implementation plan breaks down the PagerMind multi-agent incident response system into discrete, implementable tasks. The system uses AWS infrastructure (ECS, DynamoDB, CloudWatch, X-Ray) with Amazon Nova 2 Lite via Bedrock AgentCore to autonomously detect, diagnose, remediate, and validate incident resolution.

The implementation follows a bottom-up approach: infrastructure first, then microservices, then agents, then orchestration, and finally the dashboard and integrations.

## Tasks

- [ ] 1. Set up AWS infrastructure with CDK
  - [ ] 1.1 Create CDK project structure and core stacks
    - Initialize CDK TypeScript project
    - Create network-stack.ts (VPC, subnets, security groups, NAT gateway)
    - Create data-stack.ts (DynamoDB tables: Orders, Inventory, AuditLog, AgentState)
    - Create messaging-stack.ts (SQS OrderQueue)
    - _Requirements: 16.1, 16.2, 16.3, 16.8_
  
  - [ ] 1.2 Create compute and observability stacks
    - Create compute-stack.ts (ECS cluster, ALB, ECR repositories)
    - Create observability-stack.ts (CloudWatch log groups, X-Ray configuration)
    - Configure IAM roles (ECS task execution role, ECS task roles per service)
    - _Requirements: 16.2, 16.4, 16.5, 16.6_
  
  - [ ] 1.3 Create agent and secrets management stacks
    - Create agent-stack.ts (Bedrock AgentCore configuration, agent execution role)
    - Configure Secrets Manager for GitHub token and Slack webhook
    - Add CDK outputs for ALB URL, cluster name, table names
    - _Requirements: 16.2, 16.7, 16.9, 14.1_

- [ ] 2. Implement microservices
  - [ ] 2.1 Create checkout-service with v1 (working) implementation
    - Set up FastAPI project structure with dependencies (fastapi, boto3, aws-xray-sdk)
    - Implement POST /api/checkout endpoint with inventory and payment service calls
    - Add DynamoDB Orders table write operation
    - Add SQS OrderQueue message publishing
    - Implement structured JSON logging to CloudWatch
    - Add custom CloudWatch metrics (RequestCount, ErrorCount, Latency)
    - Instrument with X-Ray tracing for all HTTP and DynamoDB calls
    - Create Dockerfile and build script
    - _Requirements: 6.1, 6.4, 6.5, 6.6, 6.7, 6.10, 6.11, 6.12_
  
  - [ ]* 2.2 Write unit tests for checkout-service
    - Test successful checkout flow
    - Test insufficient stock error handling
    - Test payment failure error handling
    - Test DynamoDB write failures
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [ ] 2.3 Create checkout-service v2 (broken) with missing GSI bug
    - Copy v1 implementation
    - Add get_orders_by_customer function that queries by customer_id (missing GSI)
    - Ensure this causes DynamoDB scan and 5000ms latency
    - Ensure 20% of requests fail with 500 errors
    - Create separate Dockerfile for v2
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 2.4 Create inventory-service
    - Set up FastAPI project with GET /api/inventory/{product_id} endpoint
    - Implement POST /api/inventory/reserve endpoint
    - Add DynamoDB Inventory table read/write operations
    - Add structured logging and CloudWatch metrics
    - Instrument with X-Ray tracing
    - Create Dockerfile
    - _Requirements: 6.2, 6.8, 6.10, 6.11, 6.12_
  
  - [ ] 2.5 Create payment-service
    - Set up FastAPI project with POST /api/payment endpoint
    - Implement mock payment processing logic
    - Add structured logging and CloudWatch metrics
    - Instrument with X-Ray tracing
    - Create Dockerfile
    - _Requirements: 6.3, 6.6, 6.10, 6.11, 6.12_
  
  - [ ] 2.6 Create ECS task definitions for all services
    - Create task definition for checkout-service v1 and v2
    - Create task definition for inventory-service
    - Create task definition for payment-service
    - Configure environment variables (service URLs, DynamoDB table names, SQS queue URL)
    - Configure CloudWatch log configuration
    - Configure X-Ray daemon sidecar
    - _Requirements: 6.1, 6.2, 6.3, 16.2_

- [ ] 3. Checkpoint - Deploy and verify microservices
  - Deploy infrastructure with `cdk deploy --all`
  - Build and push container images to ECR
  - Deploy ECS services with v1 task definitions
  - Verify all services are healthy and responding
  - Test checkout flow end-to-end
  - Verify CloudWatch logs are being written
  - Verify CloudWatch metrics are being published
  - Verify X-Ray traces are being captured
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Triage Agent
  - [ ] 4.1 Create Triage Agent core logic
    - Set up Python project structure with boto3 and bedrock-runtime dependencies
    - Implement poll_cloudwatch_metrics function (query PagerMind/Services namespace)
    - Implement should_create_incident function (>10% error rate OR >200% latency increase)
    - Implement classify_severity function (CRITICAL >20%, HIGH >10%, MEDIUM >5%)
    - Implement calculate_blast_radius function (query X-Ray service map)
    - Generate incident_id (UUID) and create incident context
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 4.2 Integrate Triage Agent with Nova 2 Lite and logging
    - Implement generate_incident_summary using Bedrock InvokeModel API with Nova 2 Lite
    - Record incident detection in AuditLog DynamoDB table
    - Record Nova 2 Lite reasoning and token usage in AuditLog
    - Implement Slack notification with incident details
    - Return incident context for Orchestrator
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 14.1, 14.2_
  
  - [ ]* 4.3 Write property test for Triage Agent
    - **Property 4: Error Rate Calculation Accuracy**
    - **Validates: Requirements 2.2, 2.3**
    - Generate random metric data and verify error_rate = (5xx count) / (total requests)
    - Verify error_rate is always in range [0.0, 1.0]
  
  - [ ]* 4.4 Write unit tests for Triage Agent
    - Test incident detection with error rate >10%
    - Test incident detection with latency increase >200%
    - Test no incident when thresholds not met
    - Test severity classification for different error rates
    - _Requirements: 2.2, 2.3_

- [ ] 5. Implement Diagnosis Agent
  - [ ] 5.1 Create Diagnosis Agent data collection logic
    - Implement query_cloudwatch_logs function (Logs Insights query for last 30 minutes)
    - Implement query_cloudwatch_metrics function (time series for last 60 minutes)
    - Implement query_xray_traces function (failed requests with error details)
    - Implement get_deployment_history function (ECS describe services and task definitions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1, 8.2, 8.6, 9.1, 9.2, 10.1, 10.2_
  
  - [ ] 5.2 Create Diagnosis Agent analysis logic
    - Implement correlate_deployment_with_errors function (temporal correlation within 30 minutes)
    - Implement detect_dynamodb_scan_issue function (check X-Ray for scan operations)
    - Implement generate_root_cause_hypothesis using Nova 2 Lite to analyze all evidence
    - Record analysis in AuditLog with hypothesis, evidence, and Nova reasoning
    - Return diagnosis context for Orchestrator
    - _Requirements: 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 9.5, 9.6, 14.3_
  
  - [ ]* 5.3 Write unit tests for Diagnosis Agent
    - Test deployment correlation when deployment within 30 minutes
    - Test no correlation when deployment outside window
    - Test DynamoDB scan detection from X-Ray traces
    - _Requirements: 3.7, 3.8, 9.6_

- [ ] 6. Implement Fix Agent
  - [ ] 6.1 Create Fix Agent evidence validation logic
    - Implement validate_evidence function with 4 criteria checks
    - Criterion 1: Deployment within 30 minutes of error spike
    - Criterion 2: Error rate increased within 5 minutes after deployment
    - Criterion 3: Error rate increased by at least 10 percentage points
    - Criterion 4: Previous task definition had error rate <2% for 24 hours
    - Return EvidenceValidationResult with pass/fail for each criterion
    - _Requirements: 4.2, 4.3, 4.4_
  
  - [ ] 6.2 Create Fix Agent rollback execution logic
    - Implement execute_rollback function using boto3 ECS update_service
    - Implement wait_for_deployment function (poll until COMPLETED status, max 5 minutes)
    - Implement verify_tasks_running function (check tasks in RUNNING state)
    - Record evidence validation and rollback execution in AuditLog
    - Send Slack notification with rollback details
    - Handle rollback failures and escalate to human
    - Return remediation context for Orchestrator
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 10.4, 10.5, 10.6_
  
  - [ ]* 6.3 Write property test for Fix Agent
    - **Property 3: Evidence Validation Determinism**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Generate identical evidence sets and verify Fix Agent produces identical decisions
  
  - [ ]* 6.4 Write property test for rollback idempotence
    - **Property 7: Rollback Idempotence**
    - **Validates: Requirements 4.5, 4.6**
    - Execute rollback multiple times to same task definition and verify same final state
  
  - [ ]* 6.5 Write unit tests for Fix Agent
    - Test evidence validation passes when all 4 criteria met
    - Test evidence validation fails when any criterion missing
    - Test rollback execution success
    - Test rollback failure handling
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Implement Validation Agent
  - [ ] 7.1 Create Validation Agent recovery verification logic
    - Implement wait_for_stabilization function (60 second delay)
    - Implement check_recovery_metrics function (query CloudWatch for post-rollback metrics)
    - Implement is_incident_resolved function (error rate <2% AND latency <500ms)
    - Handle case where metrics still degraded (mark ineffective, escalate)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 7.2 Create Validation Agent permanent fix generation logic
    - Implement get_code_diff function (retrieve diff between task definition revisions from GitHub)
    - Implement generate_permanent_fix using Nova 2 Lite to analyze changes
    - Generate CloudFormation/CDK code for missing DynamoDB GSI fix
    - _Requirements: 5.6, 5.7, 5.8, 14.4_
  
  - [ ] 7.3 Create Validation Agent PR creation logic
    - Implement create_pull_request function using GitHub API
    - Include incident summary, root cause, evidence, and fix code in PR body
    - Record validation results and PR creation in AuditLog
    - Send final incident report to Slack with PR link
    - Return completion status to Orchestrator
    - _Requirements: 5.9, 5.10, 5.11, 5.12_
  
  - [ ]* 7.4 Write unit tests for Validation Agent
    - Test recovery verification with healthy metrics
    - Test recovery verification with degraded metrics
    - Test PR creation success
    - Test PR creation failure handling
    - _Requirements: 5.3, 5.4, 5.5, 5.9_

- [ ] 8. Implement Orchestrator with Bedrock AgentCore
  - [ ] 8.1 Create Orchestrator state management
    - Implement WorkflowState data model
    - Implement start_workflow function (create incident in AgentState table)
    - Implement transition_to_agent function (update state, pass context)
    - Implement get_workflow_state function (query AgentState table)
    - Implement mark_workflow_complete function
    - Implement escalate_to_human function
    - _Requirements: 1.1, 1.6, 1.7, 1.10_
  
  - [ ] 8.2 Configure Bedrock AgentCore workflow
    - Define agent configurations in Bedrock (Triage, Diagnosis, Fix, Validation)
    - Configure agent invocation sequence (Triage → Diagnosis → Fix → Validation)
    - Configure context passing between agents (structured JSON messages)
    - Configure agent retry logic (retry once on failure)
    - Configure workflow timeout (10 minutes max)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8, 1.9, 1.11, 14.1_
  
  - [ ]* 8.3 Write property test for Orchestrator
    - **Property 1: Agent Workflow Ordering**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
    - Verify agent transitions follow sequence: Triage → Diagnosis → Fix → Validation
    - Verify no backward transitions except on retry
  
  - [ ]* 8.4 Write property test for context preservation
    - **Property 6: Agent Context Preservation**
    - **Validates: Requirements 1.6**
    - Verify output context from agent N is included in input context for agent N+1
  
  - [ ]* 8.5 Write unit tests for Orchestrator
    - Test workflow state transitions
    - Test context passing between agents
    - Test agent failure and retry logic
    - Test workflow timeout enforcement
    - _Requirements: 1.1, 1.6, 1.8, 1.9_

- [ ] 9. Checkpoint - Test multi-agent workflow end-to-end
  - Deploy all agents to AWS
  - Trigger incident by deploying v2 task definition
  - Verify Triage Agent detects incident within 120 seconds
  - Verify Diagnosis Agent completes analysis within 180 seconds
  - Verify Fix Agent executes rollback within 240 seconds
  - Verify Validation Agent validates recovery within 360 seconds
  - Verify GitHub PR is created within 480 seconds
  - Verify all AuditLog entries are recorded
  - Verify Slack notifications are sent at each stage
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Web Dashboard
  - [ ] 10.1 Create Next.js dashboard project structure
    - Initialize Next.js project with TypeScript
    - Set up AWS SDK for JavaScript v3
    - Create layout with navigation and real-time status indicators
    - _Requirements: 12.12_
  
  - [ ] 10.2 Implement dashboard AWS data fetching
    - Create API routes for CloudWatch metrics (error rate, latency)
    - Create API routes for ECS service status
    - Create API routes for DynamoDB AuditLog and AgentState queries
    - Create API routes for CloudWatch Logs (last 20 entries)
    - Create API routes for ECS deployment history
    - Implement polling mechanism (refresh every 10 seconds)
    - _Requirements: 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_
  
  - [ ] 10.3 Implement dashboard UI components
    - Create workflow state timeline component (agent transitions)
    - Create service health metrics component (error rate, latency charts)
    - Create log viewer component (recent CloudWatch logs)
    - Create deployment history component
    - Create X-Ray service map embed component
    - Create "Trigger Incident" button (deploys v2 task definition)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.10, 12.11_
  
  - [ ] 10.4 Deploy dashboard to S3 + CloudFront
    - Create dashboard-stack.ts in CDK (S3 bucket, CloudFront distribution)
    - Configure public access for judges
    - Add HTTPS certificate
    - Build and deploy dashboard
    - _Requirements: 12.12, 17.1_

- [ ] 11. Implement integrations
  - [ ] 11.1 Implement Slack notifications
    - Create Slack notification helper function
    - Add Slack webhook URL to Secrets Manager
    - Implement notifications for Triage Agent (incident detected)
    - Implement notifications for Diagnosis Agent (root cause identified)
    - Implement notifications for Fix Agent (rollback executed)
    - Implement notifications for Validation Agent (incident resolved, PR created)
    - Include links to CloudWatch dashboard and web dashboard in messages
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 11.2 Implement GitHub integration
    - Add GitHub token to Secrets Manager
    - Implement PR creation with incident summary and fix code
    - Test PR creation in test repository
    - _Requirements: 5.9, 17.4_
  
  - [ ]* 11.3 Write unit tests for integrations
    - Test Slack notification formatting
    - Test GitHub PR creation
    - Test error handling when APIs unavailable
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 18.1, 18.2_

- [ ] 12. Implement error handling and resilience
  - [ ] 12.1 Add error handling to all agents
    - Implement retry logic with exponential backoff for AWS API calls
    - Handle GitHub API unavailable (log error, continue without PR)
    - Handle Slack API unavailable (log error, continue without notifications)
    - Handle Nova 2 Lite API failures (retry once before failing)
    - Handle CloudWatch API rate limiting (exponential backoff)
    - Handle ECS rollback failures (record in AuditLog, escalate)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_
  
  - [ ] 12.2 Add error handling to Orchestrator
    - Implement agent failure retry logic (retry once before escalating)
    - Display error messages in web dashboard
    - Ensure system never crashes or hangs
    - _Requirements: 18.6, 18.7, 18.8_
  
  - [ ]* 12.3 Write integration tests for error scenarios
    - Test agent retry on transient failures
    - Test escalation on persistent failures
    - Test graceful degradation when integrations unavailable
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [ ] 13. Create demo scenario and documentation
  - [ ] 13.1 Create demo trigger script
    - Implement "Trigger Incident" functionality (deploy v2 via ECS update_service)
    - Add reset functionality (deploy v1 to restore healthy state)
    - Test incident trigger and verify error rate increases
    - _Requirements: 15.1, 15.2, 15.3, 15.10_
  
  - [ ] 13.2 Seed demo data
    - Create script to populate Inventory table with products
    - Create test customer accounts
    - Generate baseline traffic to establish healthy metrics
    - _Requirements: 15.1_
  
  - [ ] 13.3 Create deployment documentation
    - Write README with one-click deploy instructions
    - Document prerequisites (AWS CLI, CDK, Docker)
    - Document deployment steps (cdk deploy, build images, deploy services)
    - Document demo execution steps
    - Add architecture diagram
    - _Requirements: 16.10, 17.5_
  
  - [ ] 13.4 Prepare demo materials
    - Create demo script (3-minute walkthrough)
    - Record demo video showing full workflow
    - Take screenshots of each stage
    - Prepare backup plan if live demo fails
    - _Requirements: 17.6_

- [ ] 14. Final testing and validation
  - [ ]* 14.1 Run end-to-end integration test
    - Execute full demo scenario from trigger to PR creation
    - Verify timing: incident detection <120s, diagnosis <180s, rollback <240s, validation <360s, PR <480s
    - Verify all AuditLog entries are correct
    - Verify all Slack notifications are sent
    - Verify metrics recover to healthy state
    - _Requirements: 15.4, 15.5, 15.6, 15.7, 15.8, 15.9_
  
  - [ ]* 14.2 Run load test
    - Execute load test with 100 concurrent users
    - Verify error rate <1% under normal load
    - Verify p99 latency <500ms under normal load
    - Verify system recovers within 8 minutes after v2 deployment
    - _Requirements: 15.9_
  
  - [ ]* 14.3 Verify property-based tests
    - **Property 2: Audit Log Append-Only**
    - **Validates: Requirements 11.2, 11.3**
    - Verify previous audit log entries remain unchanged when new entries added
  
  - [ ]* 14.4 Verify timestamp monotonicity
    - **Property 5: Timestamp Monotonicity**
    - **Validates: Requirements 11.2**
    - Verify audit log timestamps are monotonically increasing within an incident
  
  - [ ] 14.5 Verify public access for judges
    - Test dashboard access from external network
    - Test "Trigger Incident" button functionality
    - Verify GitHub repository is public
    - Verify all documentation is complete
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 15. Final checkpoint - Production readiness
  - Verify all infrastructure is deployed and healthy
  - Verify all services are running with v1 (healthy state)
  - Verify dashboard is publicly accessible
  - Verify demo scenario works end-to-end
  - Verify all documentation is complete
  - Verify cost is within $100 budget
  - Verify system will run during judging period (March 17-24)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design
- Unit tests validate specific examples and edge cases
- The implementation uses Python for all agents and services
- Infrastructure uses AWS CDK with TypeScript
- Dashboard uses Next.js with TypeScript
- Focus is on demonstrating multi-agent collaboration for the hackathon
