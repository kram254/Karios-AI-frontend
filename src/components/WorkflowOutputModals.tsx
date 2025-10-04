import React from 'react';
import { motion } from 'framer-motion';
import { X, Code, BarChart3, FileCheck } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

interface ExecutionModalProps extends ModalProps {
  executionResults: any;
}

interface ReviewModalProps extends ModalProps {
  qualityScore: number;
  reviewReport: any;
}

interface FormatterModalProps extends ModalProps {
  formattedOutput: any;
}

export const ExecutionOutputModal: React.FC<ExecutionModalProps> = ({ show, onClose, executionResults, theme = 'dark' }) => {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-2 border-emerald-500/30' : 'bg-white border-2 border-green-200'}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent' : 'border-green-200 bg-gradient-to-r from-green-50 to-transparent'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-green-100'}`}>
              <Code className={`w-6 h-6 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>Task Execution Output</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed execution results</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <pre className={`whitespace-pre-wrap text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
              {typeof executionResults === 'string' ? executionResults : JSON.stringify(executionResults, null, 2)}
            </pre>
          </div>
        </div>
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-emerald-500/20 bg-black/20' : 'border-green-200 bg-gray-50'}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const ReviewScoreModal: React.FC<ReviewModalProps> = ({ show, onClose, qualityScore, reviewReport, theme = 'dark' }) => {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-2 border-purple-500/30' : 'bg-white border-2 border-purple-200'}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-transparent' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-transparent'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <BarChart3 className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>Quality Review Score</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Score: {qualityScore}%</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-purple-500/10 text-gray-400 hover:text-purple-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <pre className={`whitespace-pre-wrap text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
              {typeof reviewReport === 'string' ? reviewReport : JSON.stringify(reviewReport, null, 2)}
            </pre>
          </div>
        </div>
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-purple-500/20 bg-black/20' : 'border-purple-200 bg-gray-50'}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FormattedOutputModal: React.FC<FormatterModalProps> = ({ show, onClose, formattedOutput, theme = 'dark' }) => {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-2 border-orange-500/30' : 'bg-white border-2 border-orange-200'}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent' : 'border-orange-200 bg-gradient-to-r from-orange-50 to-transparent'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
              <FileCheck className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}`}>Formatted Output</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Final formatted result</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-orange-500/10 text-gray-400 hover:text-orange-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <pre className={`whitespace-pre-wrap text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>
              {typeof formattedOutput === 'string' ? formattedOutput : JSON.stringify(formattedOutput, null, 2)}
            </pre>
          </div>
        </div>
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-orange-500/20 bg-black/20' : 'border-orange-200 bg-gray-50'}`}>
          <button onClick={onClose} className={`px-6 py-2.5 rounded-lg font-medium ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
