import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Paintbrush,
  Monitor,
  Users,
  Database,
  Wrench,
  PlugZap,
  Clock,
  Zap,
  Search,
  ArrowRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Chat', path: '/chat', icon: <MessageSquare size={16} strokeWidth={1.8} />, shortcut: 'C' },
  { label: 'Builder Studio', path: '/builder', icon: <Paintbrush size={16} strokeWidth={1.8} />, shortcut: 'B' },
  { label: 'Fleet Dashboard', path: '/command-center', icon: <Monitor size={16} strokeWidth={1.8} /> },
  { label: 'Agent Teams', path: '/teams', icon: <Users size={16} strokeWidth={1.8} /> },
  { label: 'Knowledge', path: '/knowledge', icon: <Database size={16} strokeWidth={1.8} />, shortcut: 'K' },
  { label: 'Skills', path: '/skills', icon: <Wrench size={16} strokeWidth={1.8} /> },
  { label: 'Integrations', path: '/integrations', icon: <PlugZap size={16} strokeWidth={1.8} /> },
  { label: 'Scheduled Tasks', path: '/scheduled-tasks', icon: <Clock size={16} strokeWidth={1.8} /> },
  { label: 'Autonomous Tasks', path: '/autonomous-tasks', icon: <Zap size={16} strokeWidth={1.8} /> },
];

/** Simple fuzzy filter: every char in `query` must appear in order in `text`. */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: { duration: 0.12 },
  },
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { chats } = useChat();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = NAV_ITEMS.filter((item) => fuzzyMatch(item.label, query));

  const filteredChats = (chats ?? [])
    .filter(c => !query || c.title?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Defer focus to after animation frame
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Keep activeIndex in bounds when filter changes
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[activeIndex]) {
          handleSelect(filtered[activeIndex].path);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cp-overlay"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-start justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
          aria-label="Command palette"
        >
          <motion.div
            key="cp-modal"
            className="max-w-lg w-full mx-4 mt-[15vh] rounded-2xl border border-white/10 bg-surface-overlay overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.8)]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07]">
              <Search size={16} className="text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm"
                placeholder="Search pages and actions…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                aria-label="Command palette search"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 text-white/25 text-[10px] font-mono">
                esc
              </kbd>
            </div>

            {/* Results */}
            {filtered.length > 0 ? (
              <ul
                ref={listRef}
                className="max-h-72 overflow-y-auto py-1.5"
                role="listbox"
                aria-label="Navigation results"
              >
                {filtered.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <li
                      key={item.path}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100 ${
                        isSelected
                          ? 'bg-brand-cyan/10 text-brand-cyan'
                          : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelect(item.path)}
                    >
                      <span
                        className={`shrink-0 transition-colors ${
                          isSelected ? 'text-brand-cyan' : 'text-white/35'
                        }`}
                      >
                        {item.icon}
                      </span>

                      <span className="flex-1 text-sm font-medium">{item.label}</span>

                      <span className="flex items-center gap-1.5 ml-auto">
                        {item.shortcut && (
                          <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-white/25 text-[10px] font-mono">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight size={13} className="text-brand-cyan/60" />
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="py-10 text-center text-sm text-white/25">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {filteredChats.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/30">Recent chats</div>
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => { navigate('/chat'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors text-left"
                  >
                    <MessageSquare size={14} className="flex-shrink-0 text-white/30" />
                    <span className="truncate">{chat.title || 'Untitled chat'}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Footer hint */}
            <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.05] text-[11px] text-white/20">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
