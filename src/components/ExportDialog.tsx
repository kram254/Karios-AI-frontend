import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Download, FileText, FileJson, File, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatTitle: string;
}

const exportFormats = [
  { id: 'markdown', label: 'Markdown', icon: <FileText className="w-5 h-5" />, ext: '.md' },
  { id: 'json', label: 'JSON', icon: <FileJson className="w-5 h-5" />, ext: '.json' },
  { id: 'txt', label: 'Plain Text', icon: <File className="w-5 h-5" />, ext: '.txt' },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, chatId, chatTitle }) => {
  const [selectedFormat, setSelectedFormat] = useState('markdown');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${chatId}/export?format=${selectedFormat}`);
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      const blob = new Blob([data.content], { type: data.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Export Conversation</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-400 mb-4">Export "{chatTitle}" as:</p>
          
          <div className="space-y-2 mb-4">
            {exportFormats.map(format => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  selectedFormat === format.id
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                    : 'bg-gray-700/30 border border-transparent text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                {format.icon}
                <span className="font-medium">{format.label}</span>
                <span className="ml-auto text-xs text-gray-500">{format.ext}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
