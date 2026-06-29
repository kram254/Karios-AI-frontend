import React, { useState } from 'react';
import { X, Edit2, Check, ChevronDown, ChevronUp, Play, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanStep {
  step_number: number;
  tool_name: string;
  action: string;
  description: string;
  parameters?: any;
  timeout?: number;
  max_retries?: number;
  required?: boolean;
}

interface PlanPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (modifiedPlan: PlanStep[]) => void;
  onReject: () => void;
  plan: PlanStep[];
  taskObjective: string;
}

export const PlanPreviewModal: React.FC<PlanPreviewModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  plan: initialPlan,
  taskObjective
}) => {
  const [plan, setPlan] = useState<PlanStep[]>(initialPlan);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const toggleExpand = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  const updateStep = (stepNumber: number, updates: Partial<PlanStep>) => {
    setPlan(prev => prev.map(step => 
      step.step_number === stepNumber ? { ...step, ...updates } : step
    ));
    setEditingStep(null);
  };

  const deleteStep = (stepNumber: number) => {
    setPlan(prev => prev.filter(s => s.step_number !== stepNumber)
      .map((s, idx) => ({ ...s, step_number: idx + 1 })));
  };

  const addStep = () => {
    const newStep: PlanStep = {
      step_number: plan.length + 1,
      tool_name: 'custom_tool',
      action: 'custom_action',
      description: 'New step',
      timeout: 60,
      max_retries: 3,
      required: false
    };
    setPlan([...plan, newStep]);
    setEditingStep(newStep.step_number);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Review Execution Plan
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {taskObjective}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            <AnimatePresence>
              {plan.map((step, idx) => {
                const isExpanded = expandedSteps.has(step.step_number);
                const isEditing = editingStep === step.step_number;

                return (
                  <motion.div
                    key={step.step_number}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-semibold">
                            {step.step_number}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {step.tool_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {step.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingStep(isEditing ? null : step.step_number)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteStep(step.step_number)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleExpand(step.step_number)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {(isExpanded || isEditing) && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
                            {isEditing ? (
                              <>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Tool Name</label>
                                  <input
                                    type="text"
                                    value={step.tool_name}
                                    onChange={(e) => updateStep(step.step_number, { tool_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Description</label>
                                  <textarea
                                    value={step.description}
                                    onChange={(e) => updateStep(step.step_number, { description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Timeout (s)</label>
                                    <input
                                      type="number"
                                      value={step.timeout || 60}
                                      onChange={(e) => updateStep(step.step_number, { timeout: parseInt(e.target.value) })}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-1">Max Retries</label>
                                    <input
                                      type="number"
                                      value={step.max_retries || 3}
                                      onChange={(e) => updateStep(step.step_number, { max_retries: parseInt(e.target.value) })}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                    />
                                  </div>
                                  <div className="flex items-end">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.required || false}
                                        onChange={(e) => updateStep(step.step_number, { required: e.target.checked })}
                                        className="rounded"
                                      />
                                      <span className="text-sm">Required</span>
                                    </label>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Action:</span>
                                    <span className="ml-2 font-medium">{step.action}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Timeout:</span>
                                    <span className="ml-2 font-medium">{step.timeout || 60}s</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Max Retries:</span>
                                    <span className="ml-2 font-medium">{step.max_retries || 3}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Required:</span>
                                    <span className="ml-2 font-medium">{step.required ? 'Yes' : 'No'}</span>
                                  </div>
                                </div>
                                {step.parameters && (
                                  <div className="mt-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Parameters:</span>
                                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                      {JSON.stringify(step.parameters, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <button
              onClick={addStep}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {plan.length} steps • Estimated time: {plan.reduce((sum, s) => sum + (s.timeout || 60), 0)}s
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onApprove(plan)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Execute Plan
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
