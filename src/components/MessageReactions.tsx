import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Share2, Link2, Volume2, Flag, MoreHorizontal, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MessageReactionsProps {
  messageId: string;
  messageContent: string;
  onReaction: (messageId: string, reactionType: string, value: any) => void;
  compact?: boolean;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  messageContent,
  onReaction,
  compact = false
}) => {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const handleReaction = (type: string) => {
    const newValue = activeReaction === type ? null : type;
    setActiveReaction(newValue);
    onReaction(messageId, 'helpfulness', newValue);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#msg-${messageId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
      setShowShareMenu(false);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareToX = () => {
    const text = messageContent.length > 250 ? messageContent.substring(0, 247) + '...' : messageContent;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const handleShareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=550,height=420');
    setShowShareMenu(false);
  };

  const handleReadAloud = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(messageContent);
    utterance.onend = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleReport = () => {
    onReaction(messageId, 'report', true);
    toast.success('Message reported');
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => handleReaction('helpful')}
          className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${activeReaction === 'helpful' ? 'text-green-400' : 'text-gray-500'}`}
          title="Helpful"
          aria-label="Helpful"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleReaction('not_helpful')}
          className={`p-1 rounded hover:bg-gray-700/50 transition-colors ${activeReaction === 'not_helpful' ? 'text-red-400' : 'text-gray-500'}`}
          title="Not helpful"
          aria-label="Not helpful"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
        title="Copy"
        aria-label="Copy"
      >
        {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
      
      <button
        onClick={() => handleReaction('helpful')}
        className={`p-1.5 rounded-md transition-colors hover:bg-gray-700/50 ${activeReaction === 'helpful' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
        title="Helpful"
        aria-label="Helpful"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleReaction('not_helpful')}
        className={`p-1.5 rounded-md transition-colors hover:bg-gray-700/50 ${activeReaction === 'not_helpful' ? 'text-red-400' : 'text-gray-500 hover:text-gray-300'}`}
        title="Not helpful"
        aria-label="Not helpful"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      <button
        onClick={handleReadAloud}
        className={`p-1.5 rounded-md transition-colors hover:bg-gray-700/50 ${isReading ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        title={isReading ? 'Stop reading' : 'Read aloud'}
        aria-label={isReading ? 'Stop reading' : 'Read aloud'}
      >
        <Volume2 className="w-4 h-4" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
          title="Share"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
        
        {showShareMenu && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[140px] z-50">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              <span>Copy link</span>
            </button>
            <button
              onClick={handleShareToX}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Share to X</span>
            </button>
            <button
              onClick={handleShareToLinkedIn}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>LinkedIn</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleReport}
        className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
        title="Report"
        aria-label="Report"
      >
        <Flag className="w-4 h-4" />
      </button>
    </div>
  );
};

export default MessageReactions;
