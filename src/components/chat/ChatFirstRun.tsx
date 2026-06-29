/**
 * ChatFirstRun — Full-page welcome/empty-state rendered when there is no active chat.
 *
 * Shows the Karios hero greeting, an auto-grow composer, starter-prompt chips,
 * and the full canvas shell (endless canvas, top bar, project badge).
 *
 * Extracted from Chat.tsx to isolate this code path from the active-chat path
 * and to remove 170 lines from the monolith.
 */
import React, { KeyboardEvent, ChangeEvent, useRef, useEffect } from 'react';
import { MessageSquare, Send, Plus, Globe, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import AgentSelectionModal, { AgentSelectionResult } from '../agent/AgentSelectionModal';
import {
  CanvasTopBar,
  EndlessCanvas,
  CanvasProjectBadge,
  CanvasBottomDock,
} from '../canvas';
import type { CanvasConfig, UsageDataRow } from '../canvas/CanvasTopBar';

// ---------------------------------------------------------------------------
// Starter prompts — shown as clickable chips
// ---------------------------------------------------------------------------
const STARTER_PROMPTS = [
  { label: 'Build an agent', prompt: 'Build me an agent that monitors competitor pricing weekly and sends a Slack digest.' },
  { label: 'Research a topic', prompt: 'Research the latest trends in multi-agent AI orchestration and summarise the key findings.' },
  { label: 'Create a workflow', prompt: 'Create a workflow that scrapes job postings, ranks them, and emails me the top 5 every morning.' },
  { label: 'Analyse & report', prompt: 'Analyse this week\'s sales data and generate an executive summary dashboard.' },
  { label: 'Summarise a URL', prompt: 'Summarise the key points from this URL: ' },
  { label: 'Schedule a task', prompt: 'Set up a recurring weekly report that tracks our GitHub issues and sends a digest every Monday.' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ChatFirstRunProps {
  compact?: boolean;
  message: string;
  setMessage: (v: string) => void;
  isProcessing: boolean;
  isGenerating: boolean;
  isSearchMode: boolean;
  isChatFullscreen: boolean;
  showAgentModal: boolean;
  canvasUsageRows: UsageDataRow[];
  canvasToolsRows: UsageDataRow[];
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onStopGeneration: () => void;
  onToggleSearchMode: () => void;
  onToggleFullscreen: () => void;
  onNavigate: (path: string) => void;
  onCanvasConfigChange: (cfg: CanvasConfig) => void;
  onCloseAgentModal: () => void;
  onSelectAgent: (selection: AgentSelectionResult) => void;
  onCreateAgent: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ChatFirstRun: React.FC<ChatFirstRunProps> = ({
  compact,
  message,
  setMessage,
  isProcessing,
  isGenerating,
  isSearchMode,
  isChatFullscreen,
  showAgentModal,
  canvasUsageRows,
  canvasToolsRows,
  onSubmit,
  onKeyDown,
  onStopGeneration,
  onToggleSearchMode,
  onToggleFullscreen,
  onNavigate,
  onCanvasConfigChange,
  onCloseAgentModal,
  onSelectAgent,
  onCreateAgent,
}) => {
  const { translate } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea whenever message changes
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [message]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleStarterClick = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="canvas-split-shell" style={{ minHeight: compact ? undefined : '100vh' }}>
      <div className="canvas-chat-column-attached">
        <div className="canvas-chat-column-frame">
          <div
            className={`flex flex-col ${compact ? 'h-full' : 'h-screen'} text-white relative overflow-hidden`}
            style={{ background: '#07070A' }}
          >
            {/* ── Center content ─────────────────────────────────────── */}
            <div className="flex flex-col items-center justify-center flex-1 w-full mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 relative z-10">

              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/[0.06] flex items-center justify-center mb-6 sm:mb-8 border border-white/10 shadow-glow-cyan"
              >
                <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-brand-cyan/70" />
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.35 }}
                className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-3 text-white text-center"
              >
                {translate('greeting')}
              </motion.h1>
              <motion.p
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.3 }}
                className="text-white/55 text-center text-sm sm:text-base mb-6 sm:mb-8 max-w-md"
              >
                Brief me once — I'll research, build, and keep the work current.
              </motion.p>

              {/* Composer */}
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="w-full max-w-md sm:max-w-lg md:max-w-2xl bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-lg overflow-hidden border border-white/10 hover:border-brand-cyan/20 transition-colors duration-base"
              >
                <form onSubmit={onSubmit} className="relative">
                  <div className="flex items-start w-full px-1 py-1 gap-1">
                    <button
                      type="button"
                      aria-label="Attach file"
                      className="text-white/40 hover:text-brand-cyan p-2 mt-1.5 ml-1 transition-colors duration-base flex-shrink-0"
                      onClick={() => { /* file attach — future */ }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    <textarea
                      ref={textareaRef}
                      placeholder={translate('ask_placeholder')}
                      value={message}
                      onChange={handleChange}
                      onKeyDown={onKeyDown}
                      rows={1}
                      className="flex-1 bg-transparent text-white outline-none border-none py-3 px-2 resize-none min-h-[48px] max-h-[200px] placeholder-white/35 focus:placeholder-brand-cyan/30 transition-all overflow-y-auto text-sm leading-relaxed"
                      disabled={isProcessing}
                      aria-label="Message input"
                    />

                    {isGenerating ? (
                      <button
                        type="button"
                        onClick={onStopGeneration}
                        aria-label="Stop generation"
                        className="p-2 mt-1.5 mr-1 rounded-full text-red-400 hover:bg-red-500/10 flex-shrink-0 transition-colors"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-3 h-3 bg-current rounded-sm" />
                        </div>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        aria-label="Send message"
                        disabled={!message.trim() || isProcessing}
                        className="p-2 mt-1.5 mr-1 rounded-full flex-shrink-0 transition-all duration-base disabled:text-white/25 enabled:text-brand-cyan enabled:hover:bg-brand-cyan/10"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center px-4 py-2 border-t border-white/[0.05]">
                    <button
                      type="button"
                      aria-pressed={isSearchMode}
                      onClick={onToggleSearchMode}
                      className={`flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-medium transition-all duration-base ${
                        isSearchMode
                          ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/40'
                          : 'bg-white/[0.05] text-white/50 border border-transparent hover:text-white/80 hover:border-white/10'
                      }`}
                    >
                      <Globe className={`w-3.5 h-3.5 ${isSearchMode ? 'animate-pulse' : ''}`} />
                      {isSearchMode ? 'Web search on' : 'Search'}
                    </button>
                    <span className="ml-auto text-xs text-white/25">Karios AI · verify important info</span>
                  </div>
                </form>
              </motion.div>

              {/* Starter prompt chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="flex flex-wrap justify-center gap-2 mt-5 max-w-2xl"
                role="list"
                aria-label="Starter prompts"
              >
                {STARTER_PROMPTS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    role="listitem"
                    onClick={() => handleStarterClick(prompt)}
                    className="flex items-center gap-1.5 text-xs text-white/50 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.07] hover:border-white/15 rounded-full px-3 py-1.5 transition-all duration-base"
                  >
                    <ArrowRight className="w-3 h-3 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(600px circle at 50% 80%, rgba(0,243,255,0.025), transparent 70%)' }}
              aria-hidden="true"
            />

            {/* Agent selection modal */}
            <AgentSelectionModal
              isOpen={showAgentModal}
              onClose={onCloseAgentModal}
              onSelectAgent={onSelectAgent}
              onCreateAgent={onCreateAgent}
            />
          </div>
        </div>
      </div>

      {/* Canvas region */}
      <div className="canvas-canvas-region">
        <EndlessCanvas
          artifacts={[]}
          showBackground
          emptyHint="Start a chat to see your generated artifacts and resources here."
        />
        <CanvasProjectBadge name="Karios Labs" description="Project document for Karios Labs" />
        <CanvasBottomDock />
      </div>

      {/* Top bar */}
      <CanvasTopBar
        modelName="Opus 4.7"
        tokenCount={0}
        cost={0}
        isLive={false}
        isChatFullscreen={isChatFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onNavigate={onNavigate}
        onConfigChange={onCanvasConfigChange}
        usageData={canvasUsageRows}
        toolsUsageData={canvasToolsRows}
      />
    </div>
  );
};

export default ChatFirstRun;
