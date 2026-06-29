import React, { useRef, ChangeEvent, KeyboardEvent, useState, useEffect } from 'react';
import { Send, Plus, Globe } from 'lucide-react';
import SearchLockTooltip from './SearchLockTooltip';
import { Attachment } from '../services/api/chat.service';
import { FormatControlPanel, FormatPreferences } from './FormatControlPanel';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  uploadedImages: Attachment[];
  isProcessing: boolean;
  isGenerating: boolean;
  isSearchMode: boolean;
  automationActive: boolean;
  chatType?: string;
  showKariosBrowser?: boolean;
  browserHeadlessMode?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onPlusButtonClick: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleSearchMode: () => void;
  onStopGeneration: () => void;
  performSearch: (query: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  children?: React.ReactNode;
  onFormatChange?: (prefs: FormatPreferences) => void;
  assetsStrip?: React.ReactNode;
}

const MAX_INPUT_HEIGHT = 200; // px — cap before scrolling

export const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  uploadedImages,
  isProcessing,
  isGenerating,
  isSearchMode,
  automationActive,
  chatType,
  showKariosBrowser = false,
  browserHeadlessMode = false,
  onSubmit,
  onPlusButtonClick,
  onFileChange,
  onKeyDown,
  onToggleSearchMode,
  onStopGeneration,
  performSearch,
  fileInputRef,
  children,
  onFormatChange,
  assetsStrip,
}) => {
  const [formatPrefs, setFormatPrefs] = useState<FormatPreferences>({
    length: 'standard',
    format: 'paragraphs',
    tone: 'professional',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea whenever message changes (including after clear on send)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [message]);

  const handleFormatChange = (prefs: FormatPreferences) => {
    setFormatPrefs(prefs);
    onFormatChange?.(prefs);
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Immediate resize on change (the useEffect also fires but this avoids a frame lag)
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isSearchMode && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        performSearch(message);
      }
    } else {
      onKeyDown(e);
    }
  };

  const isInternetSearchChat = chatType === 'internet_search';

  return (
    <div
      className="chat-input-wrapper"
      style={
        showKariosBrowser && !browserHeadlessMode
          ? { maxWidth: '100%', padding: '0 1rem' }
          : { maxWidth: '720px', margin: '0 auto', width: '100%', padding: '0 1rem' }
      }
    >
      <form
        onSubmit={onSubmit}
        className="w-full"
        style={showKariosBrowser && !browserHeadlessMode ? { maxWidth: '100%' } : {}}
      >
        {assetsStrip}

        <div
          className={
            uploadedImages.length > 0
              ? 'chat-input-container-expanded neon-input'
              : 'chat-input-container neon-input'
          }
        >
          <button
            type="button"
            className="chat-action-button neon-btn-secondary"
            onClick={onPlusButtonClick}
            disabled={isProcessing}
            aria-label="Attach file"
          >
            <Plus className="w-4 h-4 neon-icon" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={onFileChange}
          />

          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isSearchMode ? 'Ask Karios AI…' : 'Ask Karios AI'}
              className="chat-textarea"
              rows={1}
              disabled={isProcessing}
              aria-label="Message input"
              aria-multiline="true"
              style={{
                minHeight: '44px',
                maxHeight: `${MAX_INPUT_HEIGHT}px`,
                overflowY: 'auto',
                resize: 'none',
              }}
            />
          </div>

          <div className="chat-input-actions">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="chat-send-button"
                aria-label="Stop generation"
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                </div>
              </button>
            ) : (
              <button
                type="submit"
                className="chat-send-button neon-btn-primary"
                aria-label="Send message"
                disabled={isProcessing || (!message.trim() && uploadedImages.length === 0)}
              >
                <Send className="w-4 h-4 neon-icon" />
              </button>
            )}
          </div>
        </div>

        <div className="chat-input-bottom-section">
          <SearchLockTooltip show={isInternetSearchChat}>
            <button
              type="button"
              className={`search-text-button neon-btn-secondary ${isSearchMode ? 'search-active' : ''}`}
              onClick={() => {
                if (isInternetSearchChat) return;
                onToggleSearchMode();
              }}
              disabled={isInternetSearchChat}
              aria-pressed={isSearchMode}
              style={isInternetSearchChat ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <Globe className="w-4 h-4 neon-icon" />
              Search
            </button>
          </SearchLockTooltip>

          {children}
          <FormatControlPanel
            preferences={formatPrefs}
            onPreferencesChange={handleFormatChange}
          />
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
