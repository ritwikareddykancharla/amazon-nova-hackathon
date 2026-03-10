'use client';

import { useState, useEffect } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  errorRate: number;
  latency: number;
  taskCount: number;
}

interface AgentActivity {
  agent: string;
  status: 'idle' | 'active' | 'completed' | 'failed';
  message: string;
  timestamp: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

interface Deployment {
  version: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export default function Dashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'checkout-service', status: 'healthy', errorRate: 0.5, latency: 245, taskCount: 2 },
    { name: 'inventory-service', status: 'healthy', errorRate: 0.2, latency: 180, taskCount: 2 },
    { name: 'payment-service', status: 'healthy', errorRate: 0.1, latency: 320, taskCount: 2 },
  ]);

  const [agentWorkflow, setAgentWorkflow] = useState<AgentActivity[]>([
    { agent: 'Triage Agent', status: 'idle', message: 'Monitoring metrics...', timestamp: new Date().toISOString() },
    { agent: 'Diagnosis Agent', status: 'idle', message: 'Waiting for incident', timestamp: new Date().toISOString() },
    { agent: 'Fix Agent', status: 'idle', message: 'Waiting for diagnosis', timestamp: new Date().toISOString() },
    { agent: 'Validation Agent', status: 'idle', message: 'Waiting for remediation', timestamp: new Date().toISOString() },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toISOString(), level: 'info', service: 'checkout', message: 'Request processed successfully' },
    { timestamp: new Date().toISOString(), level: 'info', service: 'inventory', message: 'Stock check completed' },
  ]);

  const [deployments, setDeployments] = useState<Deployment[]>([
    { version: 'v1.0', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'completed' },
  ]);

  const [isIncidentActive, setIsIncidentActive] = useState(false);

  const triggerIncident = () => {
    setIsIncidentActive(true);
    // Simulate incident
    setTimeout(() => {
      setServices(prev => prev.map(s => 
        s.name === 'checkout-service' 
          ? { ...s, status: 'degraded', errorRate: 22.5, latency: 5200 }
          : s
      ));
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'down': return 'bg-red-500';
      case 'idle': return 'bg-slate-600';
      case 'active': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-slate-600';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-slate-400';
      case 'warn': return 'text-amber-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">PagerMind</h1>
              <p className="text-sm text-slate-400">Autonomous Incident Response System</p>
            </div>
            <button
              onClick={triggerIncident}
              disabled={isIncidentActive}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20"
            >
              {isIncidentActive ? 'Incident Active' : 'Trigger Incident'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Services Status */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Service Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((service) => (
              <div key={service.name} className="bg-slate-900 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-200">{service.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
                    <span className="text-xs text-slate-400 capitalize">{service.status}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Error Rate</span>
                    <span className={service.errorRate > 10 ? 'text-red-400 font-medium' : 'text-slate-300'}>
                      {service.errorRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Latency (p99)</span>
                    <span className={service.latency > 1000 ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                      {service.latency}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tasks</span>
                    <span className="text-slate-300">{service.taskCount}/2</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Agent Workflow */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-slate-200">Agent Workflow</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="space-y-4">
              {agentWorkflow.map((agent, index) => (
                <div key={agent.agent} className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)} ${agent.status === 'active' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{agent.agent}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(agent.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-0.5">{agent.message}</p>
                    </div>
                  </div>
                  {index < agentWorkflow.length - 1 && (
                    <div className="w-px h-8 bg-slate-800 ml-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Logs */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Recent Logs</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-80 overflow-y-auto">
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`uppercase shrink-0 ${getLogColor(log.level)}`}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-400 shrink-0">{log.service}:</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Deployment History */}
          <section>
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Deployment History</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-80 overflow-y-auto">
              <div className="space-y-3">
                {deployments.map((deployment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                    <div>
                      <div className="font-medium text-slate-200">{deployment.version}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(deployment.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(deployment.status)}`} />
                      <span className="text-xs text-slate-400 capitalize">{deployment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* System Metrics */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-slate-200">System Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Total Requests</div>
              <div className="text-2xl font-bold text-slate-100">12,847</div>
              <div className="text-xs text-emerald-400 mt-1">+5.2% from last hour</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Avg Error Rate</div>
              <div className="text-2xl font-bold text-slate-100">0.3%</div>
              <div className="text-xs text-emerald-400 mt-1">Within SLA</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Avg Latency</div>
              <div className="text-2xl font-bold text-slate-100">248ms</div>
              <div className="text-xs text-slate-400 mt-1">p99: 520ms</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Incidents Resolved</div>
              <div className="text-2xl font-bold text-slate-100">0</div>
              <div className="text-xs text-slate-400 mt-1">Last 24 hours</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <div>Powered by Amazon Nova 2 Lite + AWS Bedrock AgentCore</div>
            <div>Amazon Nova AI Hackathon 2026</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
