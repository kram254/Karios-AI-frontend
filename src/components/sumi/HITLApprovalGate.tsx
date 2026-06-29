import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';
import { hitlService, HITLLock } from '../../services/sumi';

interface HITLApprovalGateProps {
  executionId: string;
  onApprove: (lockId: string, data?: Record<string, any>) => void;
  onReject: (lockId: string, reason?: string) => void;
  autoPoll?: boolean;
  pollInterval?: number;
}

interface PendingApproval {
  lock: HITLLock;
  elapsedTime: number;
}

export const HITLApprovalGate: React.FC<HITLApprovalGateProps> = ({
  executionId,
  onApprove,
  onReject,
  autoPoll = true,
  pollInterval = 1000
}) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const fetchPendingLocks = useCallback(async () => {
    try {
      const result = await hitlService.getExecutionLocks(executionId);
      const pendingLocks = result.locks.filter(l => l.status === 'locked');
      
      setPendingApprovals(prev => {
        const existingIds = new Set(prev.map(p => p.lock.lock_id));
        const newLocks = pendingLocks.filter(l => !existingIds.has(l.lock_id));
        
        const updated = prev.map(p => {
          const updatedLock = pendingLocks.find(l => l.lock_id === p.lock.lock_id);
          if (updatedLock) {
            return {
              ...p,
              lock: updatedLock,
              elapsedTime: Math.floor((Date.now() - new Date(updatedLock.created_at).getTime()) / 1000)
            };
          }
          return p;
        }).filter(p => pendingLocks.some(l => l.lock_id === p.lock.lock_id));
        
        const newPending = newLocks.map(lock => ({
          lock,
          elapsedTime: Math.floor((Date.now() - new Date(lock.created_at).getTime()) / 1000)
        }));
        
        return [...updated, ...newPending];
      });
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch pending approvals');
    }
  }, [executionId]);

  useEffect(() => {
    if (!autoPoll) return;
    
    fetchPendingLocks();
    const interval = setInterval(fetchPendingLocks, pollInterval);
    
    return () => clearInterval(interval);
  }, [fetchPendingLocks, autoPoll, pollInterval]);

  const handleApprove = async (lockId: string) => {
    setLoading(true);
    try {
      await hitlService.approve(lockId);
      onApprove(lockId);
      setPendingApprovals(prev => prev.filter(p => p.lock.lock_id !== lockId));
    } catch (err) {
      setError('Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (lockId: string) => {
    setLoading(true);
    try {
      const reason = rejectReason[lockId] || 'Rejected by user';
      await hitlService.reject(lockId, reason);
      onReject(lockId, reason);
      setPendingApprovals(prev => prev.filter(p => p.lock.lock_id !== lockId));
      setRejectReason(prev => {
        const updated = { ...prev };
        delete updated[lockId];
        return updated;
      });
    } catch (err) {
      setError('Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (pendingApprovals.length === 0 && !error) {
    return null;
  }

  return (
    <AnimatePresence>
      {pendingApprovals.map(({ lock, elapsedTime }) => (
        <motion.div
          key={lock.lock_id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 w-96 bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <UserCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">
                  Human Approval Required
                </h3>
                <p className="text-xs text-gray-400">Execution requires your decision</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatElapsedTime(elapsedTime)}</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-300">{lock.prompt}</p>
              {lock.context && Object.keys(lock.context).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Context:</p>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(lock.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApprove(lock.lock_id)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Approve</span>
              </button>
              
              <div className="relative group">
                <button
                  onClick={() => handleReject(lock.lock_id)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Reject</span>
                </button>
                
                <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <textarea
                    value={rejectReason[lock.lock_id] || ''}
                    onChange={(e) => setRejectReason(prev => ({ ...prev, [lock.lock_id]: e.target.value }))}
                    placeholder="Reason for rejection (optional)..."
                    className="w-full px-2 py-1 text-xs bg-gray-900 text-gray-300 rounded border border-gray-700 focus:border-red-500/50 outline-none resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {lock.expires_at && (
            <div className="h-1 bg-gray-800">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (new Date(lock.expires_at).getTime() - Date.now()) / 1000, ease: 'linear' }}
                className="h-full bg-amber-500/50"
              />
            </div>
          )}
        </motion.div>
      ))}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HITLApprovalGate;
