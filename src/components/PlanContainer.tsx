import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import { ExpandMore, CheckCircle, ExpandLess, GpsFixed, AccessTime, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { WorkflowVisualization } from './WorkflowVisualization';

interface PlanStep {
  id: string;
  title: string;
  description: string;
  action_type: string;
  target?: string;
  value?: string;
  expected_outcome: string;
  reasoning: string;
}

interface DetailedPlan {
  task_description: string;
  objective: string;
  steps: PlanStep[];
  reasoning: string;
  estimated_duration: number;
  success_criteria: string;
  created_at: string;
}

interface PlanContainerProps {
  plan: DetailedPlan;
  isVisible: boolean;
}

export const PlanContainer: React.FC<PlanContainerProps> = ({ plan }) => {
  const [expanded, setExpanded] = useState(false);
  const [showWorkflowViz, setShowWorkflowViz] = useState(false);

  if (!plan) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Box sx={{ m: 2, bgcolor: '#1a1a1a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <Paper
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2,
          bgcolor: '#2a2a2a',
          color: 'white',
          cursor: 'pointer',
          borderRadius: '12px 12px 0 0',
          '&:hover': { bgcolor: '#333' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              bgcolor: 'rgba(59,130,246,0.15)',
              color: '#60a5fa'
            }}>
              <GpsFixed sx={{ fontSize: 16 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Automation Plan</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{plan.objective}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 12 }} />
              <Typography variant="caption">{formatDuration(plan.estimated_duration)}</Typography>
            </Box>
            <Chip label={`${plan.steps.length} steps`} size="small" />
            <IconButton size="small" sx={{ color: 'white' }}>
              {expanded ? <KeyboardArrowUp sx={{ fontSize: 16 }} /> : <KeyboardArrowDown sx={{ fontSize: 16 }} />}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {expanded && (
        <Box sx={{ p: 2, bgcolor: '#1a1a1a' }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>Strategy</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{plan.reasoning}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>Execution Steps</Typography>
            {plan.steps.map((step, index) => (
              <Paper key={step.id} sx={{ p: 2, mb: 2, bgcolor: '#2a2a2a', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={index + 1} size="small" sx={{ minWidth: '32px' }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>{step.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{step.description}</Typography>
                    </Box>
                  </Box>
                  <Chip label={step.action_type} size="small" variant="outlined" />
                </Box>
                
                <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                  {step.target && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '60px' }}>Target:</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{step.target}</Typography>
                    </Box>
                  )}
                  {step.value && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '60px' }}>Value:</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{step.value}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '60px' }}>Expected:</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{step.expected_outcome}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '60px' }}>Reasoning:</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{step.reasoning}</Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>

          <Paper sx={{ bgcolor: '#2a2a2a' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                cursor: 'pointer'
              }}
              onClick={() => setShowWorkflowViz(!showWorkflowViz)}
            >
              <Typography variant="h6" sx={{ color: 'white' }}>
                Workflow Diagram
              </Typography>
              <IconButton size="small" sx={{ color: 'white' }}>
                {showWorkflowViz ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            {showWorkflowViz && (
              <Box sx={{ p: 1, pt: 0 }}>
                <WorkflowVisualization
                  steps={plan.steps}
                  currentStep={-1}
                  taskDescription={plan.task_description}
                />
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2, bgcolor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircle sx={{ fontSize: 16, color: '#22c55e' }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>Success Criteria</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{plan.success_criteria}</Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default PlanContainer;
