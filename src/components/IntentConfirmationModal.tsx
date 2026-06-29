import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Clock, Zap, CheckCircle, XCircle } from 'lucide-react';

interface IntentConfirmationModalProps {
  isOpen: boolean;
  intentData: {
    objective: string;
    complexity: string;
    workflow_type: string;
    estimated_time: number;
    tools_required: number;
    actions: string[];
  };
  taskId: string;
  onApprove: () => void;
  onReject: () => void;
}

export const IntentConfirmationModal: React.FC<IntentConfirmationModalProps> = ({
  isOpen,
  intentData,
  taskId,
  onApprove,
  onReject
}) => {
  if (!isOpen) return null;

  const complexityColor = {
    LOW: 'text-green-400',
    MEDIUM: 'text-yellow-400',
    HIGH: 'text-orange-400'
  }[intentData.complexity] || 'text-gray-400';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0A0A0A] border border-[#00F3FF]/30 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#00F3FF]/10 to-transparent p-6 border-b border-[#00F3FF]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00F3FF]/20 rounded-lg">
                  <Brain className="w-6 h-6 text-[#00F3FF]" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Confirm Task Execution</h2>
                  <p className="text-sm text-gray-400">Review the plan before I start working</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">What I understand you want:</h3>
                <p className="text-white bg-[#00F3FF]/5 p-3 rounded-lg border border-[#00F3FF]/10">
                  {intentData.objective}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#1A1A1A] p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${complexityColor}`} />
                    <span className="text-xs text-gray-400">Complexity</span>
                  </div>
                  <p className={`text-sm font-semibold ${complexityColor}`}>{intentData.complexity}</p>
                </div>

                <div className="bg-[#1A1A1A] p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-[#00F3FF]" />
                    <span className="text-xs text-gray-400">Est. Time</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{intentData.estimated_time}s</p>
                </div>

                <div className="bg-[#1A1A1A] p-3 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Tools</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{intentData.tools_required}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Execution Plan:</h3>
                <div className="space-y-2">
                  {intentData.actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 w-5 h-5 rounded-full bg-[#00F3FF]/10 border border-[#00F3FF]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#00F3FF] text-xs font-medium">{idx + 1}</span>
                      </div>
                      <span className="text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border-t border-gray-800 p-4 flex items-center justify-end gap-3">
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={onApprove}
                className="px-6 py-2 bg-[#00F3FF] hover:bg-[#00F3FF]/90 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Start Execution
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
