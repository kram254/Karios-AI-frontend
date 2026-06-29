/**
 * AgentSpinUpStatus — Live status card shown after an agent is created.
 *
 * Transitions: spinning up → running → delivered
 * Displays transparent steps (tool-call style) + duration chip.
 * Mirrors the Hyperagent "8m · $6.41" run card pattern.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Bot, Zap, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { HyperAgentIdentity } from '../../hyperagent/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SpinUpPhase = 'spinning_up' | 'running' | 'delivered' | 'failed';

interface SpinUpStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
  durationMs?: number;
}

interface AgentSpinUpStatusProps {
  agent: HyperAgentIdentity;
  /** Called when user navigates away via the fleet link */
  onViewFleet?: () => void;
}

// ---------------------------------------------------------------------------
// Simulated spin-up steps (real orchestration would push these over WS)
// ---------------------------------------------------------------------------
const SPIN_UP_STEPS: Omit<SpinUpStep, 'status'>[] = [
  { id: 'provision', label: 'Provisioning agent environment' },
  { id: 'load_skills', label: 'Loading skills & tools' },
  { id: 'configure', label: 'Applying configuration' },
  { id: 'connect', label: 'Connecting delivery channels' },
  { id: 'ready', label: 'Agent is live and ready' },
];

const PHASE_LABELS: Record<SpinUpPhase, string> = {
  spinning_up: 'Spinning up…',
  running: 'Running first check…',
  delivered: 'Agent is live',
  failed: 'Spin-up failed',
};

const STATUS_DOT_COLORS: Record<SpinUpPhase, string> = {
  spinning_up: 'bg-brand-cyan',
  running: 'bg-brand-cyan',
  delivered: 'bg-status-success',
  failed: 'bg-status-error',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const AgentSpinUpStatus: React.FC<AgentSpinUpStatusProps> = ({ agent, onViewFleet }) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<SpinUpPhase>('spinning_up');
  const [steps, setSteps] = useState<SpinUpStep[]>(
    SPIN_UP_STEPS.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Simulate step progression
  useEffect(() => {
    let currentStep = 0;
    const advance = () => {
      setSteps(prev => {
        const next = [...prev];
        if (currentStep < next.length) {
          if (currentStep > 0) next[currentStep - 1].status = 'done';
          next[currentStep].status = 'running';
        }
        return next;
      });

      if (currentStep === 1) setPhase('running');

      currentStep++;

      if (currentStep >= SPIN_UP_STEPS.length) {
        // Final step
        setTimeout(() => {
          setSteps(prev => prev.map(s => ({ ...s, status: 'done' as const })));
          setPhase('delivered');
          if (timerRef.current) clearInterval(timerRef.current);
        }, 800);
        return;
      }

      // Stagger steps 400–900ms apart
      const delay = 400 + Math.random() * 500;
      setTimeout(advance, delay);
    };

    // Kick off after a 300ms pause
    const kickoff = setTimeout(advance, 300);
    return () => clearTimeout(kickoff);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handleViewFleet = () => {
    onViewFleet?.();
    navigate('/command-center');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      className="rounded-2xl border border-white/10 bg-surface-raised overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(0,243,255,0.03) 0%, rgba(139,92,246,0.03) 100%)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {/* Agent avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 border border-brand-cyan/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-cyan" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{agent.name}</p>
            <p className="text-xs text-white/40">{agent.description?.slice(0, 60)}</p>
          </div>
        </div>

        {/* Phase badge */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_COLORS[phase]} ${phase !== 'delivered' && phase !== 'failed' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${phase === 'delivered' ? 'text-status-success' : phase === 'failed' ? 'text-status-error' : 'text-brand-cyan'}`}>
            {PHASE_LABELS[phase]}
          </span>
        </div>
      </div>

      {/* ── Steps ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2">
        {steps.map((step) => (
          <AnimatePresence key={step.id} mode="wait">
            <motion.div
              className={`flex items-center gap-3 transition-all duration-base ${step.status === 'pending' ? 'opacity-30' : 'opacity-100'}`}
            >
              {step.status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success flex-shrink-0" />
              ) : step.status === 'running' ? (
                <Loader2 className="w-3.5 h-3.5 text-brand-cyan animate-spin flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0" />
              )}
              <span className={`text-xs ${step.status === 'running' ? 'text-white' : 'text-white/50'}`}>
                {step.label}
              </span>
              {step.status === 'running' && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto text-[10px] text-brand-cyan/60 font-mono"
                >
                  {formatDuration(elapsedMs)}
                </motion.span>
              )}
            </motion.div>
          </AnimatePresence>
        ))}
      </div>

      {/* ── Footer — shown when delivered ─────────────────────────── */}
      <AnimatePresence>
        {phase === 'delivered' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="px-4 pb-4"
          >
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              {/* Duration chip */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-white/40 bg-white/[0.04] border border-white/[0.06] rounded-full px-3 py-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(elapsedMs)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-status-success bg-status-success/10 border border-status-success/20 rounded-full px-3 py-1">
                  <Zap className="w-3 h-3" />
                  Live
                </div>
              </div>

              {/* Fleet link */}
              <button
                type="button"
                onClick={handleViewFleet}
                className="flex items-center gap-1.5 text-xs text-brand-cyan hover:text-white transition-colors font-medium"
              >
                View in fleet
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgentSpinUpStatus;
