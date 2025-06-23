import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Brain, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Monitor,
  Image as ImageIcon,
  FileText,
  Link
} from 'lucide-react';

interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  icon: React.ReactNode;
  details?: string;
}

interface IntelligentURLProcessorProps {
  url: string;
  onProcessingComplete: (result: any) => void;
  onError: (error: string) => void;
}

export const IntelligentURLProcessor: React.FC<IntelligentURLProcessorProps> = ({
  url,
  onProcessingComplete,
  onError
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processingStages: ProcessingStage[] = [
    {
      id: 'policy',
      name: 'Policy Analysis',
      description: 'Analyzing URL characteristics and determining optimal scraping strategy',
      status: 'pending',
      icon: <Brain className="w-5 h-5" />
    },
    {
      id: 'localization',
      name: 'Visual Localization',
      description: 'Taking screenshot and identifying key content elements',
      status: 'pending',
      icon: <Eye className="w-5 h-5" />
    },
    {
      id: 'extraction',
      name: 'Content Extraction',
      description: 'Extracting and processing content using selected strategy',
      status: 'pending',
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 'validation',
      name: 'Quality Validation',
      description: 'Validating content quality and completeness',
      status: 'pending',
      icon: <CheckCircle className="w-5 h-5" />
    }
  ];

  const [stages, setStages] = useState(processingStages);

  const updateStageStatus = useCallback((stageIndex: number, status: ProcessingStage['status'], details?: string) => {
    setStages(prev => prev.map((stage, index) => 
      index === stageIndex ? { ...stage, status, details } : stage
    ));
  }, []);

  const processURL = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStage(0);

    try {
      // Stage 1: Policy Analysis
      updateStageStatus(0, 'active');
      setCurrentStage(0);
      
      // Simulate policy analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      const siteType = detectSiteType(url);
      updateStageStatus(0, 'completed', `Detected: ${siteType}`);

      // Stage 2: Visual Localization
      setCurrentStage(1);
      updateStageStatus(1, 'active');
      
      // Simulate screenshot capture
      await new Promise(resolve => setTimeout(resolve, 2000));
      setScreenshot('/api/placeholder/800/600'); // Placeholder for actual screenshot
      updateStageStatus(1, 'completed', 'Screenshot captured and analyzed');

      // Stage 3: Content Extraction
      setCurrentStage(2);
      updateStageStatus(2, 'active');
      
      // Simulate content extraction with real-time updates
      const contentChunks = [
        'Extracting main content sections...',
        'Processing navigation elements...',
        'Identifying related pages...',
        'Cleaning and formatting content...'
      ];

      for (const chunk of contentChunks) {
        updateStageStatus(2, 'active', chunk);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setExtractedContent(`
# ${url}

## Main Content
This is the extracted content from the website. The intelligent processor has successfully identified and extracted the key information using advanced visual understanding and content localization.

## Key Features Detected
- Dynamic JavaScript content
- Multi-section layout
- Related navigation links
- Structured data elements

## Processing Strategy
The system automatically selected Browser-Use with enhanced content targeting for optimal extraction results.
      `);
      
      updateStageStatus(2, 'completed', 'Content successfully extracted');

      // Stage 4: Validation
      setCurrentStage(3);
      updateStageStatus(3, 'active');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStageStatus(3, 'completed', 'Content validated - 1,247 words extracted');

      // Complete processing
      onProcessingComplete({
        url,
        content: extractedContent,
        screenshot,
        metadata: {
          siteType,
          wordCount: 1247,
          strategy: 'browser_use_enhanced'
        }
      });

    } catch (error) {
      const currentStageIndex = stages.findIndex(stage => stage.status === 'active');
      if (currentStageIndex !== -1) {
        updateStageStatus(currentStageIndex, 'error', 'Processing failed');
      }
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [url, stages, extractedContent, onProcessingComplete, onError, updateStageStatus]);

  const detectSiteType = (url: string): string => {
    if (url.includes('zendesk')) return 'Zendesk Help Center';
    if (url.includes('notion')) return 'Notion Documentation';
    if (url.includes('docs.')) return 'Technical Documentation';
    if (url.includes('help.') || url.includes('support.')) return 'Support Portal';
    return 'Dynamic Web Application';
  };

  const getStageStatusColor = (status: ProcessingStage['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStageStatusIcon = (stage: ProcessingStage, index: number) => {
    if (stage.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (stage.status === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    } else if (stage.status === 'active') {
      return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
    } else {
      return stage.icon;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Brain className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Intelligent URL Processing
          </h2>
          <p className="text-sm text-gray-600">
            Advanced AI-powered content extraction with visual understanding
          </p>
        </div>
      </div>

      {/* URL Display */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Target URL:</span>
        </div>
        <p className="text-sm text-gray-900 mt-1 break-all">{url}</p>
      </div>

      {/* Processing Stages */}
      <div className="space-y-4 mb-6">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              stage.status === 'active' 
                ? 'border-blue-300 bg-blue-50' 
                : stage.status === 'completed'
                ? 'border-green-300 bg-green-50'
                : stage.status === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className={getStageStatusColor(stage.status)}>
                {getStageStatusIcon(stage, index)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{stage.name}</h3>
                <p className="text-sm text-gray-600">{stage.description}</p>
                {stage.details && (
                  <p className="text-xs text-gray-500 mt-1">{stage.details}</p>
                )}
              </div>
              {stage.status === 'active' && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-600 font-medium">Processing...</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Preview Section */}
      <AnimatePresence>
        {screenshot && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Live Screenshot Analysis
                  </span>
                </div>
              </div>
              <div className="p-4">
                <img 
                  src={screenshot} 
                  alt="Website screenshot"
                  className="w-full h-64 object-cover rounded border"
                />
                <p className="text-xs text-gray-500 mt-2">
                  AI is analyzing visual elements to identify content regions and navigation structure
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Preview */}
      <AnimatePresence>
        {extractedContent && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Extracted Content Preview
                  </span>
                </div>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {extractedContent}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={processURL}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isProcessing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Start Intelligent Processing
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default IntelligentURLProcessor;
