/**
 * ChatStreamingSurface — Memoized component that renders live agent output.
 *
 * Isolated so that streaming-state updates (streamingFormatterOutput, agentThoughts,
 * stepProgress) do NOT trigger re-renders of the static message list or the rest of Chat.
 *
 * Renders three main surfaces:
 *  1. Inline streaming formatter (the "Writing response…" card — unified status mode)
 *  2. Tool-action progress cards (ToolActionCard with step progress bar)
 *  3. Standalone streaming output (below-the-fold mode when unified status is hidden)
 *
 * All previous implementations lived directly inside Chat.tsx chatMainContent. Moving
 * them here means only this subtree re-renders on each streamed token.
 */
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import MessageFormatter from '../MessageFormatter';
import { ToolActionCard } from '../ToolActionCard';
import { ReActLoopIndicator } from '../ReActLoopIndicator';
import { HitlPauseGate } from '../HitlPauseGate';
import { ChallengeGate } from '../ChallengeGate';
import { ApprovalGate } from '../ApprovalGate';

// ---------------------------------------------------------------------------
// Types (mirrored from Chat.tsx to avoid a tight import coupling)
// ---------------------------------------------------------------------------
interface StreamingOutput {
  taskId: string;
  text: string;
}

interface ToolCard {
  id?: string | number;
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  details?: any;
  resultContent?: string;
  description?: string;
  timestamp?: string;
  retryCount?: number;
  isBrowserTool?: boolean;
  stepNum?: number;
}

interface ActiveLoopPhase {
  phase: string;
  step: number;
  totalSteps: number;
  tool: string;
  description: string;
}

interface PendingApproval {
  id: string;
  action: string;
  tool: string;
  parameters: any;
  riskLevel: 'low' | 'medium' | 'high';
  policy?: { policy_id: string; reason?: string };
  reason?: string;
  url?: string;
  taskId?: string;
}

interface ChatStreamingSurfaceProps {
  streamingFormatterOutput: StreamingOutput | null;
  progressiveToolCards: ToolCard[];
  activeLoopPhase: ActiveLoopPhase | null;
  pendingApprovals: PendingApproval[];
  showUnifiedStatus: boolean;
  onApprovalResponse: (id: string, approved: boolean, note?: string) => void;
  artifactCount?: number;
}

// ---------------------------------------------------------------------------
// Component (wrapped in React.memo — only re-renders when props change)
// ---------------------------------------------------------------------------
const ChatStreamingSurface: React.FC<ChatStreamingSurfaceProps> = ({
  streamingFormatterOutput,
  progressiveToolCards,
  activeLoopPhase,
  pendingApprovals,
  showUnifiedStatus,
  onApprovalResponse,
  artifactCount,
}) => {
  const hasCards = progressiveToolCards.length > 0;
  const allDone = hasCards && progressiveToolCards.every(c => c.status === 'completed');

  return (
    <div role="status" aria-live="polite" aria-atomic="false" className="space-y-3">

      {/* ── "Finalizing" indicator ──────────────────────────────────── */}
      {allDone && showUnifiedStatus && !streamingFormatterOutput && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5">
          <Loader className="w-4 h-4 text-white/40 animate-spin" aria-hidden="true" />
          <span className="text-sm text-white/50">Finalizing response…</span>
        </div>
      )}

      {/* ── "Writing response" streaming card (unified status mode) ─── */}
      {streamingFormatterOutput && showUnifiedStatus && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-brand-cyan/15 bg-brand-cyan/[0.03] px-4 py-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <Loader className="w-3.5 h-3.5 text-white/40 animate-spin" aria-hidden="true" />
            <span className="text-xs text-white/40 uppercase tracking-wide">Writing response…</span>
          </div>
          <div className="text-sm text-gray-200 leading-relaxed">
            <MessageFormatter content={streamingFormatterOutput.text} role="assistant" />
            {/* Blinking cursor */}
            <span
              className="inline-block w-[2px] h-[1em] bg-white/60 align-middle ml-[1px] animate-pulse"
              aria-hidden="true"
            />
          </div>
        </motion.div>
      )}

      {/* ── ReAct loop indicator ─────────────────────────────────────── */}
      {activeLoopPhase && (
        <ReActLoopIndicator
          phase={activeLoopPhase.phase}
          step={activeLoopPhase.step}
          totalSteps={activeLoopPhase.totalSteps}
          tool={activeLoopPhase.tool}
          description={activeLoopPhase.description}
        />
      )}

      {/* ── Tool-action progress cards ───────────────────────────────── */}
      {hasCards && (() => {
        const totalSteps = progressiveToolCards.length;
        const runningIdx = progressiveToolCards.findIndex(c => c.status === 'running');
        const completedCount = progressiveToolCards.filter(c => c.status === 'completed').length;
        const hasRunning = runningIdx >= 0;
        const stepNumber = hasRunning
          ? runningIdx + 1
          : Math.min(totalSteps, completedCount + (completedCount < totalSteps ? 1 : 0));
        const progressRatio = hasRunning
          ? (runningIdx + 1) / totalSteps
          : completedCount / totalSteps;

        return (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide text-gray-400">Progress</div>
                <div className="text-xs text-gray-300">
                  Step {Math.max(1, stepNumber)} of {totalSteps}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar"
                aria-valuenow={Math.round(progressRatio * 100)} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="h-full bg-brand-cyan/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, Math.min(100, progressRatio * 100))}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Tool cards */}
            <motion.div
              className="space-y-3"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="show"
            >
              {progressiveToolCards.map((card) => {
                const isRunning = card.status === 'running';
                const effectiveStatus: 'running' | 'completed' | 'failed' | 'paused' =
                  isRunning && pendingApprovals.length > 0
                    ? 'paused'
                    : (card.status as 'running' | 'completed' | 'failed');

                return (
                  <motion.div
                    key={String(card.id ?? `${card.toolName}-${card.stepNum}`)}
                    variants={{
                      hidden: { opacity: 0, x: -12 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
                    }}
                  >
                    <ToolActionCard
                      toolName={String(card.toolName || 'tool')}
                      status={effectiveStatus}
                      details={card.details}
                      thought={card.resultContent ? String(card.resultContent) : undefined}
                      subtitle={card.status === 'completed'
                        ? undefined
                        : card.description ? String(card.description) : undefined}
                      startedAt={typeof card.timestamp === 'string' ? card.timestamp : undefined}
                      defaultExpanded={card.status === 'running'}
                      retryCount={card.retryCount || 0}
                      isBrowserTool={card.isBrowserTool === true}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        );
      })()}

      {/* ── Below-the-fold streaming (non-unified status mode) ───────── */}
      {streamingFormatterOutput && !showUnifiedStatus && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="message-container agent group"
        >
          <div className="message-content assistant">
            <div className="message-text">
              <MessageFormatter content={streamingFormatterOutput.text} role="assistant" />
              <span
                className="inline-block w-[2px] h-[1em] bg-gray-400 align-middle ml-[1px] animate-pulse"
                aria-hidden="true"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* ── HITL / Approval gates ────────────────────────────────────── */}
      {pendingApprovals.length > 0 && pendingApprovals.map((approval) => {
        const challengeType: string =
          approval.policy?.reason ||
          (approval.policy?.policy_id === 'challenge_takeover' ? 'captcha' : 'blocked');
        const blockedUrl: string | undefined =
          approval.url ?? approval.parameters?.url ?? approval.parameters?.original_url;

        return (
          <HitlPauseGate
            key={approval.id}
            approvalId={approval.id}
            challengeType={challengeType}
            blockedUrl={blockedUrl}
            tool={approval.tool}
            reason={approval.reason}
            taskId={approval.taskId}
            onAccept={(note) => onApprovalResponse(approval.id, true, note)}
            onDecline={(note) => onApprovalResponse(approval.id, false, note)}
          />
        );
      })}

      {(artifactCount ?? 0) > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-cyan/5 border border-brand-cyan/15 text-xs text-brand-cyan/70">
          <span>↗</span>
          <span>{artifactCount} artifact{artifactCount !== 1 ? 's' : ''} generated</span>
        </div>
      )}

    </div>
  );
};

export default memo(ChatStreamingSurface);
