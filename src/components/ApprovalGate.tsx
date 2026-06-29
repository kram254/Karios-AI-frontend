import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Check, X, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApprovalGateProps {
  action: string;
  tool: string;
  parameters: any;
  riskLevel: 'low' | 'medium' | 'high';
  onApprove: (modifications?: any) => void;
  onReject: (reason?: string) => void;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({
  action,
  tool,
  parameters,
  riskLevel,
  onApprove,
  onReject
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const TIMEOUT_SECONDS = 300;
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            onReject('timeout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onReject]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleApprove = (modifications?: any) => {
    resolvedRef.current = true;
    onApprove(modifications);
  };

  const handleReject = (reason?: string) => {
    resolvedRef.current = true;
    onReject(reason);
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-950/20';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'medium': return <Shield className="w-5 h-5 text-yellow-600" />;
      case 'low': return <Shield className="w-5 h-5 text-green-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 ${getRiskColor()} rounded-xl p-4 shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getRiskIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Approval Required
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-2 py-1 rounded-full ${secondsLeft < 60 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                {formatCountdown(secondsLeft)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                riskLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              }`}>
                {riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Action:</span>
              <span className="ml-2 font-medium">{action}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tool:</span>
              <span className="ml-2 font-medium">{tool}</span>
            </div>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mb-3"
          >
            <ExternalLink className="w-3 h-3" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>

          {showDetails && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(parameters, null, 2)}
              </pre>
            </div>
          )}

          {showRejectDialog ? (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (optional)..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleReject(rejectReason);
                    setShowRejectDialog(false);
                  }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => setShowRejectDialog(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove()}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
