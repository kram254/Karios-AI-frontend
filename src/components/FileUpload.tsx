import React, { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { notify } from '../services/notifications';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete?: (documentId: string) => void;
  onSystemMessage: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onSystemMessage  }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://agentando-ai-backend-1.onrender.com/api/admin/update-knowledge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      onSystemMessage(`File "${file.name}" has been successfully uploaded and processed. You can now ask questions about its contents.`);
      
      if (onUploadComplete) {
        onUploadComplete(data.document_id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      onSystemMessage(`Error uploading file "${file.name}". Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFileUpload);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFileUpload);
  }, []);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging ? 'border-[#00F3FF] bg-[#00F3FF]/5' : 'border-[#00F3FF]/20'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          id="file-upload"
          onChange={handleFileSelect}
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
          multiple
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="w-12 h-12 text-[#00F3FF] mb-4" />
          <p className="text-white text-center mb-2">
            Drag and drop files here or click to browse
          </p>
          <p className="text-sm text-[#00F3FF]/60">
            Supported formats: PDF, DOCX, TXT, JPG, JPEG, PNG
          </p>
          <p className="text-xs text-[#00F3FF]/60 mt-1">
            Maximum file size: 20MB
          </p>
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-white text-sm font-medium">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-2 rounded-lg bg-[#1A1A1A] border border-[#00F3FF]/20"
              >
                <span className="text-sm text-white truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-[#2A2A2A] rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-[#00F3FF]" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00F3FF]"></div>
        </div>
      )}
    </div>
  );
};
