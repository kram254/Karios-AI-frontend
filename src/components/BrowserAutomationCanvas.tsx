import React, { useState, useEffect, useRef } from 'react';
import { X, Loader, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrowserAutomationCanvasProps {
  isActive: boolean;
  onClose: () => void;
  sessionId?: string;
  chatId?: string;
  taskDescription?: string;
  onSidebarCollapse?: (collapsed: boolean) => void;
}

export const BrowserAutomationCanvas: React.FC<BrowserAutomationCanvasProps> = ({
  isActive,
  onClose,
  sessionId,
  chatId,
  taskDescription,
  onSidebarCollapse
}) => {
  const [browserUrl, setBrowserUrl] = useState('https://example.com');
  const [browserLoading, setBrowserLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isActive) {
      setIsLaunching(true);
      onSidebarCollapse?.(true);
      window.dispatchEvent(new CustomEvent('browser-automation:sidebar-collapse', { detail: { collapse: true } }));
      
      setTimeout(() => {
        setIsLaunching(false);
        setBrowserLoading(true);
        setAutomationStatus('Initializing browser...');
        
        setTimeout(() => {
          setBrowserLoading(false);
          setAutomationStatus('Browser ready');
        }, 1500);
      }, 800);
    } else {
      onSidebarCollapse?.(false);
      window.dispatchEvent(new CustomEvent('browser-automation:sidebar-collapse', { detail: { collapse: false } }));
    }
  }, [isActive, onSidebarCollapse]);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    const ws = new WebSocket(`ws://localhost:8000/api/web-automation/ws/${sessionId}`);

    ws.onopen = () => {
      console.log('🌐 Browser canvas WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🌐 Browser canvas received:', data);

        if (data.type === 'navigation') {
          setBrowserUrl(data.url || browserUrl);
          setBrowserLoading(false);
        } else if (data.type === 'screenshot') {
          setScreenshotUrl(data.screenshot);
        } else if (data.type === 'status') {
          setAutomationStatus(data.message || '');
        } else if (data.type === 'loading') {
          setBrowserLoading(data.loading);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('🌐 Browser canvas WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🌐 Browser canvas WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [isActive, sessionId, browserUrl]);

  const handleClose = () => {
    setIsLaunching(false);
    setBrowserLoading(false);
    setAutomationStatus('');
    setScreenshotUrl(null);
    onClose();
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-0 z-50 bg-white flex flex-col"
        style={{ left: 'auto', right: 0 }}
      >
        <div className="h-14 bg-gray-100 border-b border-gray-300 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => window.history.back()}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
            disabled={browserLoading}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
            disabled={browserLoading}
          >
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => {
              setBrowserLoading(true);
              setTimeout(() => setBrowserLoading(false), 1000);
            }}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
            disabled={browserLoading}
          >
            <RotateCw size={18} className={browserLoading ? 'animate-spin' : ''} />
          </button>
          
          <div className="flex-1 bg-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 flex items-center gap-2">
            {browserLoading && <Loader size={14} className="animate-spin text-blue-500" />}
            <span className="truncate">{browserUrl}</span>
          </div>

          {automationStatus && (
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              {automationStatus}
            </div>
          )}

          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-white relative">
          {isLaunching ? (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-blue-50/20 to-gray-50 flex items-center justify-center animate-pulse">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-600 text-lg font-medium">Launching Browser...</p>
                <p className="text-gray-500 text-sm mt-2">Initializing automation environment</p>
              </div>
            </div>
          ) : browserLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading {browserUrl}...</p>
              </div>
            </div>
          ) : screenshotUrl ? (
            <div className="p-4">
              <img
                src={screenshotUrl}
                alt="Browser screenshot"
                className="w-full h-auto border border-gray-200 rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Browser Automation Active</h1>
                <p className="text-gray-600 mb-6">
                  The AI agent is now controlling this browser to complete your task:
                </p>
                {taskDescription && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-blue-900 mb-1">Current Task:</p>
                    <p className="text-blue-800">{taskDescription}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Navigating to websites</p>
                      <p className="text-sm text-gray-600">Real browser navigation with full page rendering</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Interacting with elements</p>
                      <p className="text-sm text-gray-600">Clicking buttons, filling forms, scrolling pages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Extracting data</p>
                      <p className="text-sm text-gray-600">Collecting information from web pages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Taking screenshots</p>
                      <p className="text-sm text-gray-600">Capturing visual evidence of automation progress</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium">
                    🤖 AI-powered browser automation is running in real-time
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Watch the progress in the chat interface on the left
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BrowserAutomationCanvas;
