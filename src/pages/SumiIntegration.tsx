import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, Activity, Users, Shield, Zap, 
  GitBranch, ArrowRight, CheckCircle
} from 'lucide-react';
import { SumiFlowExecution } from '../components/sumi/SumiFlowExecution';
import { AgentRegistryBrowser } from '../components/sumi/AgentRegistryBrowser';
import { HITLApprovalGate } from '../components/sumi/HITLApprovalGate';
import { AgentIdentity, AgentCapability, FlowNode, FlowEdge } from '../services/sumi';

const TABS = [
  { id: 'registry', label: 'Agent Registry', icon: Users },
  { id: 'execution', label: 'Flow Execution', icon: Activity },
  { id: 'approval', label: 'HITL Gates', icon: Shield },
];

const SAMPLE_NODES: FlowNode[] = [
  {
    id: 'start',
    type: 'input',
    data: { nodeType: 'start', config: { prompt: 'Initialize workflow' } }
  },
  {
    id: 'agent-1',
    data: { 
      nodeType: 'agent', 
      config: { agent_id: '1', prompt: 'Analyze input data' } 
    }
  },
  {
    id: 'approval-1',
    data: { 
      nodeType: 'human_approval', 
      config: { prompt: 'Please review the analysis results' } 
    }
  },
  {
    id: 'transform-1',
    data: { 
      nodeType: 'transform', 
      config: { transform_type: 'extract_field', field: 'result' } 
    }
  },
  {
    id: 'end',
    type: 'output',
    data: { nodeType: 'end', config: {} }
  }
];

const SAMPLE_EDGES: FlowEdge[] = [
  { id: 'e1', source: 'start', target: 'agent-1' },
  { id: 'e2', source: 'agent-1', target: 'approval-1' },
  { id: 'e3', source: 'approval-1', target: 'transform-1' },
  { id: 'e4', source: 'transform-1', target: 'end' }
];

export const SumiIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('registry');
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);
  const [showDemoExecution, setShowDemoExecution] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'registry':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Agent Registry</h3>
                <p className="text-sm text-gray-400">
                  Discover and connect with AI agents based on their capabilities and reputation
                </p>
              </div>
              {selectedAgent && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400">
                    Selected: {selectedAgent.name}
                  </span>
                </motion.div>
              )}
            </div>
            <AgentRegistryBrowser
              onSelectAgent={(agent) => {
                setSelectedAgent(agent);
                setActiveTab('execution');
              }}
              showStats={true}
            />
          </div>
        );

      case 'execution':
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Flow Execution Engine</h3>
              <p className="text-sm text-gray-400">
                Execute workflows with real-time event streaming, checkpointing, and distributed processing
              </p>
            </div>

            {!showDemoExecution ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 bg-gray-800/50 rounded-xl border border-gray-700 text-center"
              >
                <Activity className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">Ready to Execute</h4>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  The Sumi Flow Engine provides distributed workflow execution with 
                  real-time event streaming, human-in-the-loop gates, and automatic recovery.
                </p>
                <button
                  onClick={() => setShowDemoExecution(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors mx-auto"
                >
                  <Zap className="w-4 h-4" />
                  <span>Start Demo Execution</span>
                </button>
              </motion.div>
            ) : (
              <SumiFlowExecution
                workflowId="demo-workflow-001"
                nodes={SAMPLE_NODES}
                edges={SAMPLE_EDGES}
                inputData={{ initial: "test data", selected_agent: selectedAgent?.agent_id }}
                onComplete={(status) => {
                  console.log('Execution completed:', status);
                }}
                onError={(error) => {
                  console.error('Execution error:', error);
                }}
              />
            )}
          </div>
        );

      case 'approval':
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Human-in-the-Loop (HITL)</h3>
              <p className="text-sm text-gray-400">
                Configure approval gates and human checkpoints within your workflows
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="p-2 bg-amber-500/20 rounded-lg w-fit mb-3">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <h4 className="font-medium text-white mb-1">Approval Gates</h4>
                <p className="text-sm text-gray-400">
                  Pause execution and wait for human approval before continuing
                </p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="p-2 bg-cyan-500/20 rounded-lg w-fit mb-3">
                  <GitBranch className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="font-medium text-white mb-1">Decision Points</h4>
                <p className="text-sm text-gray-400">
                  Route workflows based on human decisions and input
                </p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="p-2 bg-purple-500/20 rounded-lg w-fit mb-3">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-medium text-white mb-1">Data Confirmation</h4>
                <p className="text-sm text-gray-400">
                  Review and confirm data before sensitive operations
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                HITL gates appear automatically during workflow execution when configured. 
                You can test them using the Flow Execution tab above.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Layers className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sumi Integration</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Integrating Masumi-inspired agent identity, Kodosumi-style flow execution, 
            and Sokosumi marketplace patterns into your AI orchestration platform.
          </p>
        </motion.div>

        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
              <h4 className="text-sm font-medium text-white mb-2">Features</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5" />
                  <span>Agent discovery & reputation</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5" />
                  <span>Event-driven execution</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5" />
                  <span>Human approval gates</span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-cyan-400 mt-0.5" />
                  <span>Real-time monitoring</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-gray-800/50 rounded-xl border border-gray-700 p-6"
            >
              {!isReady && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-24 rounded-xl bg-white/[0.04]" />
                  ))}
                </div>
              )}
              {isReady && renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SumiIntegration;
