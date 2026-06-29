import React, { useState } from 'react';
import { Bookmark, RotateCcw, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Checkpoint {
  id: string;
  name: string;
  stepNumber: number;
  timestamp: string;
  state: any;
}

interface WorkflowCheckpointsProps {
  checkpoints: Checkpoint[];
  currentStep: number;
  onSaveCheckpoint: (name: string) => void;
  onRestoreCheckpoint: (checkpointId: string) => void;
  onDeleteCheckpoint: (checkpointId: string) => void;
}

export const WorkflowCheckpoints: React.FC<WorkflowCheckpointsProps> = ({
  checkpoints,
  currentStep,
  onSaveCheckpoint,
  onRestoreCheckpoint,
  onDeleteCheckpoint
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleSave = () => {
    if (newCheckpointName.trim()) {
      onSaveCheckpoint(newCheckpointName.trim());
      setNewCheckpointName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium">Checkpoints ({checkpoints.length})</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-500"
        >
          ▼
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <button
                onClick={() => setShowSaveDialog(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Checkpoint
              </button>

              {showSaveDialog && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={newCheckpointName}
                    onChange={(e) => setNewCheckpointName(e.target.value)}
                    placeholder="Checkpoint name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSaveDialog(false);
                        setNewCheckpointName('');
                      }}
                      className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {checkpoints.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    No checkpoints saved yet
                  </div>
                ) : (
                  checkpoints.map((checkpoint) => (
                    <div
                      key={checkpoint.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{checkpoint.name}</div>
                        <div className="text-xs text-gray-500">
                          Step {checkpoint.stepNumber} • {new Date(checkpoint.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onRestoreCheckpoint(checkpoint.id)}
                          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded transition-colors"
                          title="Restore to this checkpoint"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCheckpoint(checkpoint.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                          title="Delete checkpoint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
