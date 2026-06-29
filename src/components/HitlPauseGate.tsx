import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldOff, LogIn, Ban, AlertTriangle, CheckCircle, XCircle, ExternalLink, Globe, PauseCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HitlPauseGateProps {
  approvalId: string;
  challengeType: string;
  blockedUrl?: string;
  tool: string;
  reason?: string;
  taskId?: string;
  onAccept: (note?: string) => void;
  onDecline: (note?: string) => void;
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; body: string; color: string }> = {
  captcha: {
    icon: <ShieldOff className="w-6 h-6 text-orange-400" />,
    label: 'CAPTCHA Challenge Detected',
    body: 'The agent has paused because the site requires human verification. Open the remote browser, complete the challenge, then click Resume.',
    color: 'orange',
  },
  login_required: {
    icon: <LogIn className="w-6 h-6 text-blue-400" />,
    label: 'Login Required',
    body: 'The page requires you to be signed in. Open the remote browser, log in, then click Resume.',
    color: 'blue',
  },
  forbidden: {
    icon: <Ban className="w-6 h-6 text-red-400" />,
    label: 'Access Denied',
    body: 'The site returned 403. You can retry by clicking Resume, or decline to skip this step.',
    color: 'red',
  },
  stealth: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    label: 'Bot Protection Active',
    body: 'The site detected automated traffic. Open the remote browser, complete any challenge, then click Resume.',
    color: 'yellow',
  },
  blocked: {
    icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    label: 'Bot Protection Active',
    body: 'The site detected automated traffic. Open the remote browser, complete any challenge, then click Resume.',
    color: 'yellow',
  },
};

function getMeta(type: string) {
  return (
    TYPE_META[type] ||
    TYPE_META[type.replace('blocked_', '')] || {
      icon: <PauseCircle className="w-6 h-6 text-orange-400" />,
      label: 'Human Input Needed',
      body: 'The agent has paused and needs your input to continue.',
      color: 'orange',
    }
  );
}

export const HitlPauseGate: React.FC<HitlPauseGateProps> = ({
  challengeType,
  blockedUrl,
  tool,
  reason,
  taskId,
  onAccept,
  onDecline,
}) => {
  const [note, setNote] = useState('');
  const [resolved, setResolved] = useState(false);
  const [takeoverOpened, setTakeoverOpened] = useState(false);
  const meta = getMeta(challengeType);

  useEffect(() => {
    if (!resolved) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [resolved]);

  const handleAccept = () => {
    document.body.style.overflow = '';
    setResolved(true);
    onAccept(note.trim() || undefined);
  };

  const handleTakeover = () => {
    setTakeoverOpened(true);
    const sessionId = taskId ? `session_${taskId}` : undefined;
    window.dispatchEvent(new CustomEvent('automation:start', {
      detail: { action: 'takeover', force: true, url: blockedUrl, sessionId }
    }));
    if (!sessionId && blockedUrl) {
      window.open(blockedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDecline = () => {
    document.body.style.overflow = '';
    setResolved(true);
    onDecline(note.trim() || undefined);
  };

  if (resolved) return null;

  const borderColor = meta.color === 'orange' ? 'border-orange-500/50' : meta.color === 'blue' ? 'border-blue-500/50' : meta.color === 'red' ? 'border-red-500/50' : 'border-yellow-500/50';
  const glowColor = meta.color === 'orange' ? 'shadow-orange-500/20' : meta.color === 'blue' ? 'shadow-blue-500/20' : meta.color === 'red' ? 'shadow-red-500/20' : 'shadow-yellow-500/20';
  const headerBg = meta.color === 'orange' ? 'bg-orange-500/10' : meta.color === 'blue' ? 'bg-blue-500/10' : meta.color === 'red' ? 'bg-red-500/10' : 'bg-yellow-500/10';
  const pulseColor = meta.color === 'orange' ? 'bg-orange-500' : meta.color === 'blue' ? 'bg-blue-500' : meta.color === 'red' ? 'bg-red-500' : 'bg-yellow-500';

  const modal = (
    <AnimatePresence>
      <motion.div
        key="hitl-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-lg rounded-2xl border ${borderColor} bg-gray-900 shadow-2xl ${glowColor} overflow-hidden`}
        >
          <div className={`${headerBg} px-6 py-4 border-b ${borderColor}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                {meta.icon}
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${pulseColor} animate-ping`} />
                <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${pulseColor}`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{meta.label}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Task paused · waiting for you</p>
              </div>
              <span className="ml-auto text-xs text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded">{tool}</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">{meta.body}</p>

            {blockedUrl && (
              <div className="rounded-lg bg-gray-800/80 border border-gray-700/60 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700/40">
                  <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-xs text-gray-400 truncate flex-1 font-mono">{blockedUrl}</span>
                </div>
                <button
                  onClick={handleTakeover}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold transition-colors ${takeoverOpened ? 'bg-gray-700/50 text-gray-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                >
                  <ExternalLink className="w-4 h-4" />
                  {takeoverOpened ? 'Remote browser opened — solve challenge then Resume' : 'Open Remote Browser to Solve Challenge'}
                </button>
              </div>
            )}

            {reason && (
              <div className="rounded-lg bg-gray-800/50 border border-gray-700/40 px-3 py-2">
                <p className="text-xs text-gray-500 leading-relaxed">{reason}</p>
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (e.g. 'CAPTCHA solved' or reason to decline)…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700/60 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white text-sm font-bold transition-colors shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                Resume Agent
              </button>
              <button
                onClick={handleDecline}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-700 hover:bg-gray-600 active:bg-gray-800 border border-gray-600 text-gray-200 text-sm font-semibold transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Step
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};
