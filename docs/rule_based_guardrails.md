## Better Guardrails: Action Classification

Instead of confidence, classify actions by **risk and reversibility**:

```python
class ActionPolicy:
    # Auto-execute (safe, reversible)
    AUTO_ALLOWED = [
        'restart_service',           # Can restart again if wrong
        'scale_up_resources',        # Can scale down
        'clear_cache',               # Cache rebuilds
        'rollback_deployment',       # Can redeploy
        'kill_stuck_process',        # Process restarts
        'flush_queue',               # Queue refills
    ]
    
    # Require approval (risky, reversible with effort)
    APPROVAL_REQUIRED = [
        'modify_database_schema',    # Reversible but complex
        'change_configuration',      # Can revert config
        'deploy_hotfix',             # Can rollback
        'modify_security_group',     # Can revert rules
    ]
    
    # Never auto-execute (irreversible or dangerous)
    HUMAN_ONLY = [
        'delete_data',               # Irreversible
        'terminate_instance',        # Data loss risk
        'modify_production_db',      # High risk
        'change_dns',                # Wide impact
    ]
```

### Evidence-Based Decision Making

Instead of "confidence", use **concrete evidence requirements**:

```python
class FixValidator:
    def validate_rollback(self, evidence):
        """Rollback requires proof of recent deployment"""
        required = [
            evidence.has_recent_deployment(within_minutes=30),
            evidence.error_started_after_deployment(),
            evidence.no_other_changes_detected(),
            evidence.previous_version_was_stable()
        ]
        return all(required)
    
    def validate_scale_up(self, evidence):
        """Scale up requires resource exhaustion proof"""
        required = [
            evidence.cpu_usage > 90 or evidence.memory_usage > 90,
            evidence.request_queue_growing(),
            evidence.response_time_degrading(),
            evidence.no_application_errors()  # Not a code bug
        ]
        return all(required)
    
    def validate_restart(self, evidence):
        """Restart requires stuck process proof"""
        required = [
            evidence.process_not_responding(),
            evidence.health_check_failing(),
            evidence.no_active_requests(),  # Safe to restart
        ]
        return all(required)
```

### Deterministic Action Selection

```python
class FixAgent:
    def select_action(self, incident):
        # Gather concrete evidence
        evidence = self.gather_evidence(incident)
        
        # Try safe actions first (in order)
        if self.validator.validate_rollback(evidence):
            return Action('rollback_deployment', auto_execute=True)
        
        if self.validator.validate_restart(evidence):
            return Action('restart_service', auto_execute=True)
        
        if self.validator.validate_scale_up(evidence):
            return Action('scale_up_resources', auto_execute=True)
        
        # If no safe action matches, require human
        return Action('escalate_to_human', 
                     reason="No safe automated fix identified",
                     evidence=evidence,
                     suggested_actions=self.suggest_manual_fixes(evidence))
```

### Audit Trail

Every action has a **provable justification**:

```python
{
    "action": "rollback_deployment",
    "timestamp": "2026-03-11T14:23:00Z",
    "evidence": {
        "deployment_time": "2026-03-11T14:15:00Z",
        "error_start_time": "2026-03-11T14:16:30Z",
        "time_delta_seconds": 90,
        "previous_version": "v2.3.0",
        "previous_version_error_rate": 0.001,
        "current_version": "v2.3.1",
        "current_version_error_rate": 0.23,
        "other_changes_detected": false
    },
    "validation_passed": [
        "has_recent_deployment",
        "error_started_after_deployment",
        "no_other_changes_detected",
        "previous_version_was_stable"
    ],
    "executed": true,
    "result": "success"
}
```

### Demo Advantage

This is **way more impressive** in a demo:

```
❌ Bad: "Agent is 87% confident, so it will auto-fix"
   (Judge thinks: "Why 87%? How was that calculated?")

✅ Good: "Agent detected 4 pieces of evidence:
   1. Deployment v2.3.1 at 14:15
   2. Errors started at 14:16 (90 seconds later)
   3. No other infrastructure changes
   4. Previous version had 0.1% error rate
   
   All 4 criteria met → Safe to rollback automatically"