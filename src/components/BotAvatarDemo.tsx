import React, { useState } from 'react';
import AnimatedBotAvatar from './AnimatedBotAvatar';

const BotAvatarDemo: React.FC = () => {
  const [currentState, setCurrentState] = useState<'idle' | 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'greeting' | 'success' | 'listening' | 'explaining'>('idle');

  const states: Array<{
    value: typeof currentState;
    label: string;
    description: string;
  }> = [
    { value: 'idle', label: 'Idle', description: 'Bot is ready and waiting' },
    { value: 'greeting', label: 'Greeting', description: 'Welcoming the user' },
    { value: 'listening', label: 'Listening', description: 'User is typing' },
    { value: 'thinking', label: 'Thinking', description: 'Planning next steps' },
    { value: 'searching', label: 'Searching', description: 'Searching the web' },
    { value: 'browsing', label: 'Browsing', description: 'Navigating websites' },
    { value: 'scraping', label: 'Scraping', description: 'Extracting data' },
    { value: 'processing', label: 'Processing', description: 'Analyzing results' },
    { value: 'explaining', label: 'Explaining', description: 'Generating response' },
    { value: 'success', label: 'Success', description: 'Task completed' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Animated Bot Avatar Demo
          </h1>
          <p className="text-gray-400">
            Interactive demonstration of bot states during task execution
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800 rounded-2xl p-8 flex items-center justify-center">
            <div className="space-y-6">
              <AnimatedBotAvatar
                state={currentState}
                message={states.find(s => s.value === currentState)?.description}
                size="large"
                showMessage={true}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Bot States</h2>
            <div className="space-y-3">
              {states.map((state) => (
                <button
                  key={state.value}
                  onClick={() => setCurrentState(state.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    currentState === state.value
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{state.label}</div>
                      <div className="text-sm opacity-75">{state.description}</div>
                    </div>
                    {currentState === state.value && (
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {['tiny', 'small', 'normal', 'large'].map((size) => (
            <div key={size} className="bg-gray-800 rounded-xl p-6">
              <div className="flex flex-col items-center gap-4">
                <AnimatedBotAvatar
                  state={currentState}
                  size={size as 'tiny' | 'small' | 'normal' | 'large'}
                  showMessage={false}
                />
                <span className="text-sm text-gray-400 capitalize">{size}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Usage Example</h2>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-green-400">
{`import AnimatedBotAvatar from './components/AnimatedBotAvatar';
import { useBotState } from './hooks/useBotState';

function ChatInterface() {
  const { botState, botMessage } = useBotState({
    isGenerating,
    isSearching,
    isProcessing,
    workflowStage,
    // ... other params
  });

  return (
    <AnimatedBotAvatar
      state={botState}
      message={botMessage}
      size="normal"
      showMessage={true}
    />
  );
}`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default BotAvatarDemo;
