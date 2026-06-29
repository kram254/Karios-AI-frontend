import React, { useRef, useState } from 'react';
import { Box, Button, Typography, Paper, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PlayArrow, Stop, Refresh } from '@mui/icons-material';

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    nodeType: string;
    label: string;
    config?: any;
  };
}

interface WorkflowAutomationBridgeProps {
  nodes: WorkflowNode[];
  sessionId?: string;
  isBrowserReady?: boolean;
  onExecute?: (steps: any[]) => void;
}

export const WorkflowAutomationBridge: React.FC<WorkflowAutomationBridgeProps> = ({
  nodes,
  sessionId,
  isBrowserReady,
  onExecute
}) => {
  const [converting, setConverting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [automationSteps, setAutomationSteps] = useState<any[]>([]);
  const [executeError, setExecuteError] = useState<string>('');
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalPayload, setApprovalPayload] = useState<any>(null);
  const approvalResolverRef = useRef<((ok: boolean) => void) | null>(null);

  const isHighRiskInstruction = (text: string) => {
    const t = String(text || '').toLowerCase();
    if (!t.trim()) return false;
    return (
      t.includes('purchase') ||
      t.includes('buy') ||
      t.includes('checkout') ||
      t.includes('place order') ||
      t.includes('send email') ||
      t.includes('email ') ||
      t.includes('delete') ||
      t.includes('remove') ||
      t.includes('unsubscribe')
    );
  };

  const requestApproval = (payload: any) => {
    return new Promise<boolean>((resolve) => {
      approvalResolverRef.current = resolve;
      setApprovalPayload(payload);
      setApprovalOpen(true);
    });
  };

  const resolveApproval = (ok: boolean) => {
    setApprovalOpen(false);
    const resolver = approvalResolverRef.current;
    approvalResolverRef.current = null;
    setApprovalPayload(null);
    if (resolver) resolver(ok);
  };

  const convertWorkflowToAutomation = () => {
    setConverting(true);
    
    const steps = nodes.map(node => {
      const { nodeType, config } = node.data;
      
      switch (nodeType) {
        case 'start':
        case 'end':
        case 'note':
        case 'guardrail':
        case 'guardrails':
          return null;
        case 'approval':
          return {
            type: 'approval',
            instruction: typeof (config as any)?.prompt === 'string' && String((config as any).prompt).trim()
              ? String((config as any).prompt)
              : (typeof node.data.label === 'string' && node.data.label.trim() ? node.data.label : 'Approval required'),
            nodeId: node.id
          };
        case 'agent':
          return {
            type: 'act',
            instruction: typeof config?.prompt === 'string' && config.prompt.trim() ? config.prompt : 'run agent step',
            nodeId: node.id
          };
        case 'integration': {
          const integration = typeof (config as any)?.integration === 'string' ? String((config as any).integration) : '';
          const integrationAction = typeof (config as any)?.integrationAction === 'string' ? String((config as any).integrationAction) : '';
          return {
            type: 'act',
            instruction: integration || integrationAction
              ? `run integration ${integration}${integrationAction ? `:${integrationAction}` : ''}`
              : 'run integration step',
            nodeId: node.id
          };
        }
        case 'mcp-tool':
          return {
            type: 'act',
            instruction: typeof (config as any)?.tool === 'string' && String((config as any).tool).trim()
              ? `use tool ${(config as any).tool}`
              : 'run tool step',
            nodeId: node.id
          };
        case 'transform':
          return {
            type: 'act',
            instruction: typeof (config as any)?.code === 'string' && String((config as any).code).trim()
              ? String((config as any).code)
              : 'run transform step',
            nodeId: node.id
          };
        case 'file-search':
          return {
            type: 'act',
            instruction: typeof (config as any)?.searchQuery === 'string' && String((config as any).searchQuery).trim()
              ? `search for ${(config as any).searchQuery}`
              : 'run search step',
            nodeId: node.id
          };
        case 'action':
          return {
            type: 'act',
            instruction: config?.action || 'perform action',
            nodeId: node.id
          };
        case 'data':
          return {
            type: 'extract',
            instruction: config?.query || 'extract data from page',
            nodeId: node.id
          };
        case 'decision':
          return {
            type: 'observe',
            instruction: config?.condition || 'check page state',
            nodeId: node.id
          };
        case 'api':
          return {
            type: 'act',
            instruction: `navigate to ${config?.endpoint || 'URL'}`,
            nodeId: node.id
          };
        default:
          return {
            type: 'act',
            instruction: config?.description || 'execute step',
            nodeId: node.id
          };
      }
    }).filter(Boolean);
    
    setAutomationSteps(steps);
    setConverting(false);
  };

  const executeAutomation = async () => {
    if (!automationSteps.length) return;
    setExecuteError('');
    if (sessionId && !isBrowserReady) {
      setExecuteError('Start the browser in Automation Studio before executing workflow steps');
      return;
    }
    
    setExecuting(true);
    setCurrentStep(0);

    try {
      const BACKEND_URL = (import.meta as any).env.VITE_BACKEND_URL || 'http://localhost:8000';
      const sid = sessionId || `workflow_${Date.now()}`;

      if (!sessionId) {
        await fetch(`${BACKEND_URL}/api/web-automation/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            browser_type: 'chromium',
            visible: true
          })
        });
      }

      for (let i = 0; i < automationSteps.length; i++) {
        setCurrentStep(i + 1);
        const step = automationSteps[i];

        if (step?.type === 'approval') {
          const ok = await requestApproval({ kind: 'approval', stepIndex: i, step });
          if (!ok) {
            setExecuting(false);
            setCurrentStep(0);
            return;
          }
          continue;
        }

        if (typeof step?.instruction === 'string' && isHighRiskInstruction(step.instruction)) {
          const ok = await requestApproval({ kind: 'risk', stepIndex: i, step });
          if (!ok) {
            setExecuting(false);
            setCurrentStep(0);
            return;
          }
        }

        const response = await fetch(`${BACKEND_URL}/api/web-automation/execute-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sid,
            action_type: step.type,
            instruction: step.instruction,
            mode: 'stagehand'
          })
        });

        const result = await response.json();
        if (!result.success) {
          console.error(`Step ${i + 1} failed:`, result.message);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (onExecute) {
        onExecute(automationSteps);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
    } finally {
      setExecuting(false);
      setCurrentStep(0);
    }
  };

  const stopExecution = () => {
    setExecuting(false);
    setCurrentStep(0);
    if (approvalResolverRef.current) {
      approvalResolverRef.current(false);
      approvalResolverRef.current = null;
    }
    setApprovalOpen(false);
    setApprovalPayload(null);
  };

  return (
    <Paper sx={{
      p: 3,
      bgcolor: 'rgba(26, 26, 26, 0.6)',
      border: '1px solid rgba(0, 243, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px'
    }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
        🔄 Workflow → Automation Bridge
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={`${nodes.length} Workflow Nodes`}
          sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontWeight: 600 }}
        />
        <Chip
          label={`${automationSteps.length} Automation Steps`}
          sx={{ bgcolor: 'rgba(0, 243, 255, 0.2)', color: '#00F3FF', fontWeight: 600 }}
        />
      </Box>

      {executeError && (
        <Typography variant="body2" sx={{ color: '#f59e0b', mt: 2 }}>
          {executeError}
        </Typography>
      )}

      {executing && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
            Executing step {currentStep} of {automationSteps.length}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep / automationSteps.length) * 100}
            sx={{
              bgcolor: 'rgba(0, 243, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#00F3FF'
              }
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={converting ? <Refresh className="animate-spin" /> : <Refresh />}
          onClick={convertWorkflowToAutomation}
          disabled={converting || executing || nodes.length === 0}
          sx={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            fontWeight: 600,
            '&:hover': { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
            '&:disabled': { background: 'rgba(42, 42, 42, 0.6)', color: '#666' }
          }}
        >
          {converting ? 'Converting...' : 'Convert to Automation'}
        </Button>

        {automationSteps.length > 0 && !executing && (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={executeAutomation}
            sx={{
              background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)',
              color: '#000',
              fontWeight: 600,
              '&:hover': { background: 'linear-gradient(135deg, #00D9E6 0%, #0066DD 100%)' }
            }}
          >
            Execute Workflow
          </Button>
        )}

        {executing && (
          <Button
            variant="outlined"
            startIcon={<Stop />}
            onClick={stopExecution}
            sx={{
              borderColor: '#ef4444',
              color: '#ef4444',
              fontWeight: 600,
              '&:hover': { borderColor: '#dc2626', bgcolor: 'rgba(239, 68, 68, 0.1)' }
            }}
          >
            Stop
          </Button>
        )}
      </Box>

      {automationSteps.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ color: '#888', mb: 2 }}>
            Generated Steps:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {automationSteps.map((step, idx) => (
              <Paper
                key={idx}
                sx={{
                  p: 2,
                  bgcolor: currentStep === idx + 1 ? 'rgba(0, 243, 255, 0.1)' : 'rgba(10, 10, 10, 0.6)',
                  border: '1px solid',
                  borderColor: currentStep === idx + 1 ? '#00F3FF' : 'rgba(42, 42, 42, 0.6)',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: 'rgba(0, 243, 255, 0.2)',
                      color: '#00F3FF',
                      px: 1,
                      py: 0.5,
                      borderRadius: '4px',
                      fontWeight: 600
                    }}
                  >
                    {idx + 1}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', flex: 1 }}>
                    {step.instruction}
                  </Typography>
                  <Chip
                    label={step.type}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(139, 92, 246, 0.2)',
                      color: '#8b5cf6',
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
      <Dialog
        open={approvalOpen}
        onClose={() => resolveApproval(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white' }}>
          {approvalPayload?.kind === 'approval' ? 'Approval required' : 'Confirm action'}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)', color: 'white' }}>
          <Typography variant="body2" sx={{ color: '#A3A3A3', mb: 1 }}>
            {approvalPayload?.kind === 'approval'
              ? 'This workflow includes an approval step. Confirm to continue.'
              : 'This instruction looks potentially risky. Confirm before continuing.'}
          </Typography>
          <Paper sx={{ p: 1.5, bgcolor: 'rgba(26, 26, 26, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, display: 'block', mb: 0.5 }}>
              Step #{typeof approvalPayload?.stepIndex === 'number' ? approvalPayload.stepIndex + 1 : '-'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'pre-wrap' }}>
              {String(approvalPayload?.step?.instruction || '')}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'rgba(10, 10, 10, 0.95)' }}>
          <Button onClick={() => resolveApproval(false)} sx={{ color: '#A3A3A3' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => resolveApproval(true)}
            sx={{ background: 'linear-gradient(135deg, #00F3FF 0%, #0077FF 100%)', color: '#000', fontWeight: 700 }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
