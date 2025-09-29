import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableCardProps {
  title: string;
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export const CopyableCard: React.FC<CopyableCardProps> = ({
  title,
  content,
  children,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="text-gray-700">
        {children}
      </div>
    </div>
  );
};
