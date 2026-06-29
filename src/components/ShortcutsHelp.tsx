import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['Cmd', 'K'], description: 'Open global search' },
    { keys: ['Cmd', '/'], description: 'Show this help' },
  ]},
  { category: 'Actions', items: [
    { keys: ['Cmd', 'N'], description: 'New conversation' },
    { keys: ['Cmd', 'Shift', 'C'], description: 'Copy last response' },
    { keys: ['Cmd', 'Enter'], description: 'Submit with search enabled' },
    { keys: ['Escape'], description: 'Stop generation' },
  ]},
];

const KeyBadge: React.FC<{ children: string }> = ({ children }) => (
  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-300">
    {children}
  </span>
);

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {shortcuts.map(category => (
            <div key={category.category}>
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{category.category}</h3>
              <div className="space-y-2">
                {category.items.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-300">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kidx) => (
                        <React.Fragment key={kidx}>
                          <KeyBadge>{key}</KeyBadge>
                          {kidx < shortcut.keys.length - 1 && <span className="text-gray-600">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;
