import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Paper, Typography, Chip } from '@mui/material';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  action_type: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

interface WorkflowVisualizationProps {
  steps: WorkflowStep[];
  currentStep?: number;
  taskDescription: string;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  steps,
  currentStep = -1,
  taskDescription
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [diagram, setDiagram] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#00F3FF',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#00F3FF',
        lineColor: '#00F3FF',
        background: '#1A1A1A',
        secondaryColor: '#2A2A2A',
        tertiaryColor: '#3A3A3A'
      }
    });
  }, []);

  useEffect(() => {
    if (!steps.length) return;

    const generateMermaidDiagram = () => {
      const nodes = steps.map((step, index) => {
        const status = index < currentStep ? 'completed' : 
                      index === currentStep ? 'running' : 'pending';
        const nodeStyle = status === 'completed' ? ':::completed' :
                         status === 'running' ? ':::running' : ':::pending';
        return `  ${step.id}["${step.title}"${nodeStyle}]`;
      });

      const connections = steps.slice(0, -1).map((_, index) => 
        `  ${steps[index].id} --> ${steps[index + 1].id}`
      );

      const classDefs = [
        '  classDef completed fill:#2D5016,stroke:#4CAF50,color:#FFFFFF',
        '  classDef running fill:#1A237E,stroke:#00F3FF,color:#FFFFFF',
        '  classDef pending fill:#2A2A2A,stroke:#666666,color:#CCCCCC'
      ];

      return `graph TD
${nodes.join('\n')}
${connections.join('\n')}
${classDefs.join('\n')}`;
    };

    const newDiagram = generateMermaidDiagram();
    setDiagram(newDiagram);
  }, [steps, currentStep]);

  useEffect(() => {
    if (diagram && mermaidRef.current) {
      mermaidRef.current.innerHTML = '';
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render('workflow-diagram', diagram);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
        }
      };
      renderDiagram();
    }
  }, [diagram]);

  const getStatusColor = (index: number) => {
    if (index < currentStep) return '#4CAF50';
    if (index === currentStep) return '#00F3FF';
    return '#666666';
  };

  const getStatusText = (index: number) => {
    if (index < currentStep) return 'Completed';
    if (index === currentStep) return 'Running';
    return 'Pending';
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#1A1A1A', color: '#FFFFFF' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#00F3FF' }}>
        Workflow Execution
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2, color: '#CCCCCC' }}>
        {taskDescription}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <div ref={mermaidRef} />
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Step Details:</Typography>
        {steps.map((step, index) => (
          <Box key={step.id} sx={{ 
            mb: 1, 
            p: 1, 
            border: '1px solid #2A2A2A',
            borderRadius: 1,
            bgcolor: index === currentStep ? 'rgba(0, 243, 255, 0.1)' : 'transparent'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Chip 
                label={getStatusText(index)}
                size="small"
                sx={{ 
                  bgcolor: getStatusColor(index),
                  color: '#FFFFFF',
                  minWidth: 80,
                  mr: 1
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {step.title}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#CCCCCC' }}>
              {step.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};
