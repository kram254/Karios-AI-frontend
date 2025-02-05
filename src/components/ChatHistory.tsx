import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
}) => {
  return (
    <div className="w-64 bg-[#0A0A0A] border-r border-[#00F3FF]/20 flex flex-col h-full">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="m-4 p-2 bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 text-white rounded-lg transition-all"
      >
        New Chat
      </button>

      {/* Chat Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`p-4 cursor-pointer hover:bg-[#00F3FF]/10 transition-all ${
              currentSessionId === session.id ? 'bg-[#00F3FF]/20' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-white mb-1">
              <MessageSquare size={16} />
              <span className="text-sm font-medium truncate">{session.title}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <Clock size={12} />
              <span>{new Date(session.timestamp).toLocaleString()}</span>
            </div>
            <p className="text-gray-400 text-sm mt-1 truncate">
              {session.lastMessage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
