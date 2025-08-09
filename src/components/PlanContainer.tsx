import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Target, CheckCircle } from 'lucide-react';

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

const PlanContainer: React.FC<PlanContainerProps> = ({ plan, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible || !plan) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="plan-container">
      <div 
        className="plan-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="plan-header-content">
          <div className="plan-icon">
            <Target className="w-4 h-4" />
          </div>
          <div className="plan-title">
            <h3>Automation Plan</h3>
            <p>{plan.objective}</p>
          </div>
          <div className="plan-meta">
            <div className="plan-duration">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(plan.estimated_duration)}</span>
            </div>
            <div className="plan-steps-count">
              {plan.steps.length} steps
            </div>
          </div>
        </div>
        <div className="plan-toggle">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="plan-content">
          <div className="plan-reasoning">
            <h4>Strategy</h4>
            <p>{plan.reasoning}</p>
          </div>

          <div className="plan-steps">
            <h4>Execution Steps</h4>
            {plan.steps.map((step, index) => (
              <div key={step.id} className="plan-step">
                <div className="step-header">
                  <div className="step-number">{index + 1}</div>
                  <div className="step-info">
                    <h5>{step.title}</h5>
                    <p className="step-description">{step.description}</p>
                  </div>
                  <div className="step-action-type">{step.action_type}</div>
                </div>
                
                <div className="step-details">
                  {step.target && (
                    <div className="step-detail">
                      <span className="detail-label">Target:</span>
                      <span className="detail-value">{step.target}</span>
                    </div>
                  )}
                  {step.value && (
                    <div className="step-detail">
                      <span className="detail-label">Value:</span>
                      <span className="detail-value">{step.value}</span>
                    </div>
                  )}
                  <div className="step-detail">
                    <span className="detail-label">Expected:</span>
                    <span className="detail-value">{step.expected_outcome}</span>
                  </div>
                  <div className="step-reasoning">
                    <span className="detail-label">Reasoning:</span>
                    <span className="detail-value">{step.reasoning}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="plan-success-criteria">
            <div className="success-icon">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4>Success Criteria</h4>
              <p>{plan.success_criteria}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanContainer;
