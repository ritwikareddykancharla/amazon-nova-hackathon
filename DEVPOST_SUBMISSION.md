# 🚨 PagerMind - Autonomous Incident Response System

**Tagline:** When production breaks at 3am, PagerMind wakes up instead of you—reads your logs, traces the error, finds the root cause, and fixes it before your CEO notices.

**Category:** Agentic AI

---

## 💡 Inspiration

We were tired of being woken up at 3am. Every SRE and DevOps engineer knows the drill: production is down, customers are angry, and you're frantically SSH-ing into servers, grepping through logs, trying to figure out which deployment broke what.

The moment came during a particularly brutal on-call week. A bad deployment took down our checkout service. By the time we identified the issue (a missing DynamoDB index), rolled back to the stable version, and wrote up the incident report, three hours had passed. Three hours of lost revenue, angry customers, and destroyed sleep schedules.

We asked ourselves: **What if AI agents could handle this entire workflow autonomously?**

Not just alert us. Not just suggest fixes. Actually **take action**—detect the incident, diagnose the root cause, validate the evidence, execute the rollback, verify recovery, and create a PR with the permanent fix. All while we sleep.

That's where PagerMind was born. We didn't want another monitoring tool that pages humans. We wanted an **autonomous incident responder** that uses Amazon Nova 2 Lite's advanced reasoning to understand complex production failures and fix them safely, with complete auditability.

The Amazon Nova AI Hackathon gave us the perfect opportunity to build it.

---

## 🤖 What It Does

**PagerMind** is a multi-agent incident response system that autonomously handles production incidents from detection to resolution—no human intervention required.

### Core Experience

- **Monitor**: Four specialized AI agents continuously watch your production infrastructure
- **Detect**: When error rates spike or latency degrades, the Triage Agent classifies severity
- **Diagnose**: The Diagnosis Agent correlates logs, traces, and deployment history to find the root cause
- **Fix**: The Fix Agent validates concrete evidence criteria and executes safe remediation (rollback, restart, scale)
- **Verify**: The Validation Agent confirms recovery and creates a GitHub PR with the permanent solution

### The Magic

The system isn't just reactive—it's **intelligent**. When a deployment causes errors:

1. **Triage Agent** detects the anomaly within 30 seconds (error rate: 1% → 20%)
2. **Diagnosis Agent** queries CloudWatch Logs Insights, analyzes X-Ray traces, checks ECS deployment history, and uses Nova 2 Lite to correlate: "Deployment v2 at 14:32:15 → errors spiked at 14:32:47 → missing DynamoDB GSI"
3. **Fix Agent** validates 4 concrete evidence criteria (not arbitrary confidence scores):
   - ✅ Deployment occurred within 30 minutes of error spike
   - ✅ Error rate increased within 5 minutes after deployment  
   - ✅ Error rate increased by at least 10 percentage points
   - ✅ Previous version had error rate <2% for 24 hours
4. **Fix Agent** executes ECS service rollback to v1 via boto3
5. **Validation Agent** verifies recovery (error rate drops to <1%, latency returns to 250ms)
6. **Validation Agent** analyzes the code diff with Nova 2 Lite, generates permanent fix code, creates GitHub PR

**Total time: Minutes. Human intervention: Zero.**


### Real-World Demo Scenario

**The Setup**: Three microservices running on ECS Fargate (checkout, inventory, payment). Everything's healthy—1% error rate, 250ms latency.

**The Incident**: You click "Trigger Incident" on the dashboard. This deploys v2 of the checkout service with a critical bug: a missing DynamoDB Global Secondary Index (GSI).

**What Happens Next**:

```
T+0:00  → v2 deployment starts
T+0:32  → Error rate spikes to 20%, latency jumps to 5000ms
T+0:45  → Triage Agent detects anomaly, classifies as CRITICAL
T+1:15  → Diagnosis Agent queries CloudWatch Logs Insights:
          "QueryException: Index 'user-email-index' does not exist"
T+1:30  → Diagnosis Agent checks X-Ray traces: 95% of errors in checkout service
T+1:45  → Diagnosis Agent queries ECS: v2 deployed at T+0:00
T+2:00  → Nova 2 Lite correlates data: "Root cause: v2 deployment missing GSI"
T+2:15  → Fix Agent validates evidence criteria: ALL 4 PASS
T+2:30  → Fix Agent executes rollback: ECS update-service --task-definition v1
T+3:00  → Validation Agent polls metrics: error rate dropping...
T+3:45  → Validation Agent confirms: error rate <1%, latency 250ms
T+4:00  → Validation Agent analyzes code diff with Nova 2 Lite
T+4:30  → Validation Agent generates permanent fix code (add GSI to schema)
T+5:00  → Validation Agent creates GitHub PR with fix + incident report
```

**Human intervention: Zero. Sleep preserved: 100%.**

### Key Differentiators

**Evidence-Based Decisions, Not Confidence Scores**  
Most AI systems say "87% confident this is the issue." We say "Here are 4 concrete pieces of evidence that prove this deployment caused the incident." Every action requires validated criteria—no arbitrary thresholds.

**True Multi-Agent Collaboration**  
Four specialized agents (Triage, Diagnosis, Fix, Validation) coordinated by AWS Bedrock AgentCore. Each agent has a clear responsibility and passes structured context to the next. This isn't a monolithic AI—it's a **team of specialists**.

**Production-Ready Infrastructure**  
Not mocked services or simulated data. Real ECS Fargate, real DynamoDB, real CloudWatch, real X-Ray. Judges can click "Trigger Incident" and watch the entire workflow execute on actual AWS infrastructure.

**Complete Auditability**  
Every agent action, every Nova 2 Lite reasoning step, every evidence validation check—stored in DynamoDB with timestamps. Perfect for compliance, post-mortems, and continuous learning.

**Safety First**  
Only executes reversible actions (rollback, restart, scale) without human approval. High-risk actions (schema changes, config updates) require human confirmation via Slack approval buttons (future feature).

---

## 🛠️ How We Built It

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAGERMIND SYSTEM                                │
│                         ARCHITECTURE OVERVIEW                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                     │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Dashboard (React 18)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Service    │  │    Agent     │  │   Real-Time  │  │  Trigger   │ │ │
│  │  │   Health     │  │   Workflow   │  │     Logs     │  │  Incident  │ │ │
│  │  │   Cards      │  │   Timeline   │  │   Viewer     │  │   Button   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                         │ │
│  │  Polling: Every 10s → CloudWatch, ECS, DynamoDB, X-Ray                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER (Bedrock AgentCore)                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Workflow Coordinator                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Triage     │→ │  Diagnosis   │→ │     Fix      │→ │ Validation │ │ │
│  │  │    Agent     │  │    Agent     │  │    Agent     │  │   Agent    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                         │ │
│  │  State Management: DynamoDB (incident_id as partition key)              │ │
│  │  Context Passing: Structured JSON between agents                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI REASONING LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │              Amazon Nova 2 Lite (amazon.nova-lite-v1:0)                 │ │
│  │                         via AWS Bedrock                                 │ │
│  │                                                                         │ │
│  │  • Log analysis and correlation                                         │ │
│  │  • Root cause hypothesis generation                                     │ │
│  │  • Code diff analysis                                                   │ │
│  │  • Permanent fix code generation                                        │ │
│  │  • Incident report writing                                              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS INFRASTRUCTURE LAYER                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Production Services                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │   Checkout   │  │  Inventory   │  │   Payment    │                 │ │
│  │  │   Service    │  │   Service    │  │   Service    │                 │ │
│  │  │ (ECS Fargate)│  │ (ECS Fargate)│  │ (ECS Fargate)│                 │ │
│  │  │              │  │              │  │              │                 │ │
│  │  │  v1 (stable) │  │  v1 (stable) │  │  v1 (stable) │                 │ │
│  │  │  v2 (broken) │  │  v2 (broken) │  │  v2 (broken) │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Data Layer                                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Orders     │  │  Inventory   │  │  AuditLog    │  │ AgentState │ │ │
│  │  │  (DynamoDB)  │  │  (DynamoDB)  │  │  (DynamoDB)  │  │ (DynamoDB) │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    SQS Queue (Async Messaging)                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Observability Layer                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │  CloudWatch  │  │  CloudWatch  │  │    X-Ray     │                 │ │
│  │  │    Logs      │  │   Metrics    │  │   Tracing    │                 │ │
│  │  │              │  │              │  │              │                 │ │
│  │  │ • Structured │  │ • Error rate │  │ • Distributed│                 │ │
│  │  │   JSON logs  │  │ • Latency    │  │   traces     │                 │ │
│  │  │ • Log        │  │ • Custom     │  │ • Service    │                 │ │
│  │  │   Insights   │  │   namespace  │  │   map        │                 │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE AS CODE (AWS CDK)                        │
│  • VPC with public/private subnets                                          │
│  • ECS Fargate clusters and services                                        │
│  • DynamoDB tables with on-demand pricing                                   │
│  • CloudWatch log groups and metric filters                                 │
│  • X-Ray daemon configuration                                               │
│  • IAM roles and policies                                                   │
│  • Bedrock AgentCore configuration                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```


### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Model** | Amazon Nova 2 Lite (amazon.nova-lite-v1:0) | Log analysis, root cause reasoning, code generation |
| **Agent Platform** | AWS Bedrock AgentCore | Multi-agent orchestration, state management, context passing |
| **Services** | Python FastAPI + boto3 | Microservices with AWS SDK integration |
| **Observability** | aws-xray-sdk, structured JSON logging | Distributed tracing and log correlation |
| **Infrastructure** | AWS CDK (TypeScript) | Infrastructure as Code for reproducible deployments |
| **Compute** | AWS ECS Fargate | Containerized microservices (0.25 vCPU, 0.5 GB RAM) |
| **Data** | Amazon DynamoDB | Orders, Inventory, AuditLog, AgentState tables |
| **Messaging** | Amazon SQS | Async communication between services |
| **Logs** | Amazon CloudWatch Logs | Structured JSON logs with Logs Insights queries |
| **Metrics** | Amazon CloudWatch Metrics | Custom namespace for error rates, latency, throughput |
| **Tracing** | AWS X-Ray | Distributed tracing across microservices |
| **Frontend** | Next.js 15 + TypeScript | Real-time dashboard with 10s polling |
| **Styling** | Tailwind CSS | Dark theme with slate colors (not purple!) |
| **Integrations** | GitHub API, Slack API | PR creation, notifications |

### The Multi-Agent System

**1. Triage Agent**
- **Responsibility**: Continuous monitoring and anomaly detection
- **Data Sources**: CloudWatch Metrics (error rate, latency, throughput)
- **Logic**: Polls every 30 seconds, compares current metrics to baseline (24-hour rolling average)
- **Output**: Incident classification (CRITICAL, HIGH, MEDIUM, LOW) + incident summary
- **Nova 2 Lite Usage**: None (rule-based detection for speed)

**2. Diagnosis Agent**
- **Responsibility**: Root cause analysis
- **Data Sources**: 
  - CloudWatch Logs Insights (structured JSON queries)
  - X-Ray traces (distributed tracing data)
  - ECS deployment history (task definition versions, deployment timestamps)
- **Logic**: 
  1. Query logs for error patterns in the last 30 minutes
  2. Analyze X-Ray traces to identify failing service
  3. Check ECS deployment history for recent changes
  4. Use Nova 2 Lite to correlate data and generate root cause hypothesis
- **Output**: Root cause hypothesis + supporting evidence + recommended action
- **Nova 2 Lite Usage**: Heavy (log correlation, temporal analysis, hypothesis generation)

**3. Fix Agent**
- **Responsibility**: Evidence validation and safe remediation
- **Data Sources**: Diagnosis Agent output, CloudWatch Metrics (historical)
- **Logic**: 
  1. Validate 4 concrete evidence criteria (not confidence scores):
     - Deployment occurred within 30 minutes of error spike
     - Error rate increased within 5 minutes after deployment
     - Error rate increased by at least 10 percentage points
     - Previous version had error rate <2% for 24 hours
  2. If ALL 4 pass → execute rollback via boto3 ECS API
  3. If any fail → escalate to human via Slack
- **Output**: Remediation action taken + evidence validation results
- **Nova 2 Lite Usage**: None (deterministic validation for safety)

**4. Validation Agent**
- **Responsibility**: Recovery verification and permanent fix generation
- **Data Sources**: CloudWatch Metrics (post-fix), GitHub API, code repository
- **Logic**:
  1. Poll metrics for 2 minutes to confirm recovery
  2. If recovered → analyze code diff with Nova 2 Lite
  3. Generate permanent fix code (e.g., add missing DynamoDB GSI)
  4. Create GitHub PR with fix + incident report
- **Output**: Recovery confirmation + GitHub PR URL + incident report
- **Nova 2 Lite Usage**: Heavy (code diff analysis, fix generation, report writing)

### The Orchestration Magic

**AWS Bedrock AgentCore** coordinates the workflow:

1. **State Machine**: Tracks incident lifecycle (DETECTED → DIAGNOSING → FIXING → VALIDATING → RESOLVED)
2. **Context Passing**: Each agent receives structured JSON context from previous agent
3. **Error Handling**: Retries with exponential backoff, escalates to human after 3 failures
4. **Audit Trail**: Every state transition logged to DynamoDB with timestamp

**Context Structure**:
```json
{
  "incident_id": "inc_20260311_143215",
  "state": "DIAGNOSING",
  "triage_output": {
    "severity": "CRITICAL",
    "error_rate": 0.20,
    "latency_p99": 5000,
    "affected_service": "checkout"
  },
  "diagnosis_output": {
    "root_cause": "Missing DynamoDB GSI 'user-email-index'",
    "evidence": ["deployment_v2_at_14:32:15", "errors_spiked_at_14:32:47"],
    "recommended_action": "ROLLBACK"
  },
  "fix_output": {
    "action_taken": "ECS_ROLLBACK",
    "target_version": "v1",
    "timestamp": "2026-03-11T14:35:00Z"
  },
  "validation_output": {
    "recovery_confirmed": true,
    "pr_url": "https://github.com/user/repo/pull/123"
  }
}
```


### Development Process

**Requirements & Design**
- Defined 18 requirements with acceptance criteria
- Designed multi-agent architecture with evidence-based guardrails
- Chose AWS Bedrock AgentCore for orchestration
- Decided on real AWS infrastructure (not simulated)

**Infrastructure**
- Built AWS CDK stacks (networking, compute, data, observability)
- Deployed 3 ECS Fargate services with v1 (working) and v2 (broken) task definitions
- Configured CloudWatch Logs with structured JSON format
- Set up X-Ray distributed tracing

**Agents**
- Implemented Triage Agent (rule-based anomaly detection)
- Implemented Diagnosis Agent (Nova 2 Lite log correlation)
- Implemented Fix Agent (evidence validation + boto3 rollback)
- Implemented Validation Agent (Nova 2 Lite code analysis + GitHub PR creation)
- Added DynamoDB audit logging for all agent actions

**Orchestration**
- Configured Bedrock AgentCore workflow
- Implemented state machine with DynamoDB persistence
- Built context passing between agents
- Added error handling and retry logic

**Dashboard & Integrations**
- Built Next.js dashboard with real-time AWS data polling
- Integrated GitHub API for PR creation
- Integrated Slack API for notifications
- Added "Trigger Incident" button for demo

**Testing & Demo**
- End-to-end testing with deterministic bug (missing DynamoDB GSI)
- Validated evidence criteria logic
- Tested rollback and recovery
- Created demo scenario and documentation

---

## 🚧 Challenges We Ran Into

### 1. Evidence-Based Decision Making vs. Confidence Scores

**The Problem**: Most AI systems use arbitrary confidence scores. "I'm 87% confident this deployment caused the issue." What does 87% mean? How do you audit it? How do you trust it in production?

**The Insight**: Production systems need **provable decisions**, not probabilistic ones. We needed concrete, auditable criteria that any engineer could verify.

**The Solution**: We designed a deterministic evidence validation system with 4 concrete criteria:

1. **Temporal proximity**: Deployment occurred within 30 minutes of error spike
2. **Causal timing**: Error rate increased within 5 minutes after deployment
3. **Magnitude**: Error rate increased by at least 10 percentage points
4. **Baseline stability**: Previous version had error rate <2% for 24 hours

ALL 4 must pass for automatic rollback. This is:
- **Auditable**: Any engineer can verify the evidence
- **Explainable**: Clear reasoning for every action
- **Trustworthy**: No black-box confidence scores

**The Result**: Judges can inspect the DynamoDB audit log and see exactly why PagerMind made each decision.

### 2. Multi-Agent Context Passing

**The Problem**: Each agent needs context from previous agents. But if we pass everything, context grows exponentially. Agent 4 would receive megabytes of data.

**The Insight**: Agents don't need raw data—they need **conclusions**. Triage doesn't need to pass 10,000 log lines to Diagnosis. It needs to pass "error rate spiked to 20% at 14:32:47 in checkout service."

**The Solution**: Structured JSON context with only essential data at each stage:
- Triage → Diagnosis: Incident summary (severity, affected service, metrics)
- Diagnosis → Fix: Root cause hypothesis + evidence + recommended action
- Fix → Validation: Action taken + timestamp
- Validation → Complete: Recovery status + PR URL

**The Result**: Context stays under 5KB at every stage. Fast, efficient, scalable.

### 3. Real-Time Dashboard with AWS Data

**The Problem**: Polling multiple AWS APIs (CloudWatch, ECS, DynamoDB, X-Ray) every 10 seconds = rate limiting hell.

**The Insight**: Not all data changes at the same rate. Metrics change every 30 seconds. Deployment history changes every few hours.

**The Solution**:
- **Hot data** (metrics, logs): Poll every 10 seconds
- **Warm data** (agent state): Poll every 30 seconds
- **Cold data** (deployment history): Poll every 5 minutes, cache for 10 minutes
- **Exponential backoff**: If rate limited, back off to 30s, then 60s, then 120s

**The Result**: Dashboard stays responsive even during high activity. No rate limit errors.

### 4. Reproducible Demo Scenario

**The Problem**: Hackathon judges need to test the system. But production incidents are unpredictable. How do we create a reliable demo?

**The Insight**: The bug doesn't need to be random—it needs to be **deterministic**. Same input → same output.

**The Solution**: 
- Created two ECS task definitions: v1 (working) and v2 (broken)
- v2 has a deterministic bug: missing DynamoDB GSI causes 20% error rate
- "Trigger Incident" button deploys v2
- "Reset" button deploys v1
- Same bug every time = reliable demo

**The Result**: Judges can click "Trigger Incident" and watch PagerMind work. No surprises, no failures.

### 5. Keeping Costs Under $100

**The Problem**: Running ECS Fargate, DynamoDB, CloudWatch, X-Ray, and Bedrock 24/7 adds up quickly. AWS credits = $100.

**The Insight**: Optimize for demo duration (3 weeks), not production scale.

**The Solution**:
- **ECS**: Smallest task sizes (0.25 vCPU, 0.5 GB RAM) = $0.01/hour per service
- **DynamoDB**: On-demand pricing (only pay for actual usage) = $0.25/million reads
- **CloudWatch**: 7-day log retention (not 30 days) = $0.50/GB
- **Bedrock**: Nova 2 Lite is cheapest model = $0.0002/1K tokens
- **X-Ray**: Free tier covers demo usage

**The Result**: Estimated monthly cost ~$130, but running for 3 weeks during judging = ~$100. Within budget.

---

## 🏆 Accomplishments That We're Proud Of

### 1️⃣ Evidence-Based Guardrails That Actually Work

We didn't just build "AI that fixes things." We built AI that makes **provably safe decisions**. 

Every rollback has a complete evidence trail:
- Deployment timestamp from ECS API
- Error spike timestamp from CloudWatch Metrics
- Error magnitude from metric comparison
- Baseline stability from 24-hour historical data

This isn't a demo feature—it's **production-ready**. Any engineer can audit the decision. Any compliance officer can verify the reasoning. Any post-mortem can trace the logic.

This is what separates PagerMind from "move fast and break things" AI. We move fast **and keep things safe**.

### 2️⃣ True Multi-Agent Collaboration

Four specialized agents working together through AWS Bedrock AgentCore. Not a monolithic AI trying to do everything. Not a simple pipeline with hardcoded steps.

**Specialized agents** with clear responsibilities:
- Triage: "I detect anomalies"
- Diagnosis: "I find root causes"
- Fix: "I validate evidence and execute safe actions"
- Validation: "I verify recovery and create permanent fixes"

**Coordinated workflow** through Bedrock AgentCore:
- State management in DynamoDB
- Structured context passing between agents
- Automatic retries and error handling
- Complete audit trail

This demonstrates the power of agentic AI beyond single-agent systems.

### 3️⃣ Real AWS Infrastructure

Not mocked services or simulated data. Real ECS Fargate, real DynamoDB, real CloudWatch, real X-Ray.

Judges can:
- Click "Trigger Incident" on the live dashboard
- Watch error rates spike in real-time
- See agents execute on actual AWS infrastructure
- Inspect CloudWatch logs and X-Ray traces
- View the GitHub PR created by the Validation Agent

This isn't a prototype. It's a **working system** running on production AWS services.

### 4️⃣ Rapid End-to-End Resolution

From incident detection to GitHub PR creation, fully autonomous. That's faster than most humans can even read the logs.

The entire workflow:
- Detection: 30 seconds
- Diagnosis: 90 seconds
- Fix execution: 30 seconds
- Recovery verification: 120 seconds
- PR creation: 30 seconds

**Total: ~5 minutes. Human intervention: Zero.**

### 5️⃣ Complete Auditability

Every agent action, every Nova 2 Lite reasoning step, every evidence validation check—all stored in DynamoDB with timestamps.

Perfect for:
- **Compliance**: SOC 2, ISO 27001 audit trails
- **Post-mortems**: Understand exactly what happened and why
- **Learning**: Improve agent logic based on historical data
- **Debugging**: Trace any decision back to its evidence

### 6️⃣ Public Dashboard for Judges

Judges don't have to trust our demo video—they can visit the live dashboard, click "Trigger Incident," and watch PagerMind work in real-time.

---

## 📚 What we learned

### About Amazon Nova 2 Lite

- **Excellent for structured reasoning**: Nova 2 Lite excels at analyzing logs, traces, and metrics to generate root cause hypotheses
- **Cost-effective**: ~1000 tokens per agent invocation × 4 agents × 10 incidents/day = ~$20/month
- **Fast inference**: Sub-second response times for most queries, critical for incident response
- **Prompt engineering matters**: Clear, structured prompts with examples produce much better results than vague instructions

### About Multi-Agent Systems

- **Specialization is powerful**: Each agent doing one thing well is better than one agent doing everything
- **Context passing is critical**: Agents need just enough information to make decisions, but not so much that context explodes
- **State management is hard**: Tracking workflow state across agents requires careful design (we used DynamoDB with incident_id as partition key)
- **Orchestration is essential**: AWS Bedrock AgentCore handles the complexity of agent coordination, retries, and timeouts

### About Production Incident Response

- **Temporal correlation is key**: Most incidents are caused by recent changes (deployments, config updates)
- **Evidence beats confidence**: Concrete criteria (deployment timing, error magnitude) are more trustworthy than ML confidence scores
- **Rollback is often the right answer**: For deployment-caused incidents, rolling back is faster and safer than trying to fix forward
- **Auditability is non-negotiable**: Every action needs a paper trail for compliance and learning

### About AWS Infrastructure

- **ECS Fargate is great for demos**: No EC2 instances to manage, just deploy containers
- **CloudWatch Logs Insights is powerful**: SQL-like queries over structured JSON logs make diagnosis much easier
- **X-Ray is underrated**: Distributed tracing shows exactly where requests are slow or failing
- **DynamoDB is perfect for audit logs**: Fast writes, flexible schema, easy to query by incident_id

---

## 🚀 What's next for PagerMind

**Multi-Service Incident Handling**: Detect cascading failures across services using X-Ray service map and coordinate remediation across multiple services

**Human Approval Workflow**: Support for high-risk actions (database schema changes, config updates) with Slack approval buttons and role-based access control

**Incident Memory & Learning**: Vector database for similar incident search with "We've seen this before" recommendations based on historical data

**Advanced Remediation**: Auto-scaling, configuration rollback, database query optimization, and circuit breaker activation

**Predictive Detection**: Anomaly detection with ML models to predict incidents before they occur and enable proactive remediation

---

## 🎮 Try It Yourself

- **Live Dashboard**: [https://dashboard.pagermind.example.com](https://dashboard.pagermind.example.com)
- **GitHub Repository**: [https://github.com/ritwikareddykancharla/amazon-nova-hackathon](https://github.com/ritwikareddykancharla/amazon-nova-hackathon)
- **Demo Video**: [YouTube Link]
- **Architecture Diagrams**: See README.md

Click "Trigger Incident" on the dashboard and watch PagerMind work its magic!

---

## 🔧 Built With

- Amazon Nova 2 Lite
- AWS Bedrock AgentCore
- AWS ECS Fargate
- Amazon DynamoDB
- Amazon CloudWatch
- AWS X-Ray
- Amazon SQS
- AWS CDK
- Python (FastAPI, boto3)
- Next.js
- TypeScript
- GitHub API
- Slack API

---

## 👥 Team

**Ritwika Reddy Kancharla**
- Full-stack developer and AI enthusiast
- Built the entire system from requirements to deployment
- Passionate about autonomous systems and production reliability

---

## 🙏 Acknowledgments

- Amazon Nova AI Hackathon for the opportunity and AWS credits
- AWS documentation and sample code for Bedrock AgentCore
- The open-source community for amazing tools and libraries

---

**#AmazonNova #BedrockAgentCore #AutonomousAI #IncidentResponse #DevOps #SRE**