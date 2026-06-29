import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ShieldOff, LogIn, Ban, ExternalLink, CheckCircle, SkipForward, Monitor, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChallengeGateProps {
  approvalId: string;
  challengeType: 'captcha' | 'login_required' | 'forbidden' | 'blocked' | string;
  blockedUrl?: string;
  tool: string;
  reason: string;
  onContinue: () => void;
  onSkip: (reason?: string) => void;
}

const TIMEOUT_SECONDS = 300;

const CHALLENGE_META: Record<string, { icon: React.ReactNode; title: string; body: string; continueLabel: string; steps: string[] }> = {
  captcha: {
    icon: <ShieldOff className="w-5 h-5 text-orange-500" />,
    title: 'CAPTCHA / Bot Challenge Detected',
    body: 'The website is blocking automated access and requires human verification. Complete the challenge below or open it in a new tab.',
    continueLabel: "I've solved the CAPTCHA — resume",
    steps: [
      'Open the page in a new tab using the button below',
      'Complete the CAPTCHA or bot challenge on the page',
      'Once done, click "I\'ve solved the CAPTCHA — resume"',
    ],
  },
  login_required: {
    icon: <LogIn className="w-5 h-5 text-blue-500" />,
    title: 'Login Required',
    body: 'The page requires authentication. Log in and then confirm to let the agent continue.',
    continueLabel: "I've logged in — resume",
    steps: [
      'Open the page in a new tab using the button below',
      'Log in with your credentials',
      'Once logged in, click "I\'ve logged in — resume"',
    ],
  },
  forbidden: {
    icon: <Ban className="w-5 h-5 text-red-500" />,
    title: 'Access Denied (403)',
    body: 'The website is actively blocking this request. You may need to change IP or auth credentials.',
    continueLabel: 'Retry anyway',
    steps: [
      'Check if the URL requires special access or login',
      'Try opening the page directly to verify access',
      'Click "Retry anyway" to let the agent try again',
    ],
  },
  blocked: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    title: 'Anti-Bot Protection Active',
    body: 'The site detected automated traffic. You may need to solve a challenge or switch to a different access method.',
    continueLabel: 'Try to resume',
    steps: [
      'Open the page in a new tab to check for a challenge',
      'Complete any verification if prompted',
      'Click "Try to resume" once the page loads normally',
    ],
  },
};

function getMeta(type: string) {
  return (
    CHALLENGE_META[type] ||
    CHALLENGE_META[type.replace('blocked_', '')] ||
    {
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      title: 'Human Intervention Required',
      body: 'The agent was blocked and needs your help to continue.',
      continueLabel: 'Resume',
      steps: [
        'Open the page in a new tab using the button below',
        'Complete any verification or challenge shown',
        'Click "Resume" once done',
      ],
    }
  );
}

function formatCountdown(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export const ChallengeGate: React.FC<ChallengeGateProps> = ({
  challengeType,
  blockedUrl,
  tool,
  reason,
  onContinue,
  onSkip,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [showDetail, setShowDetail] = useState(false);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const resolvedRef = useRef(false);
  const meta = getMeta(challengeType);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!resolvedRef.current) {
            resolvedRef.current = true;
            onSkip('timeout');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onSkip]);

  const handleContinue = () => {
    resolvedRef.current = true;
    onContinue();
  };

  const handleSkip = () => {
    resolvedRef.current = true;
    onSkip('user_skipped');
  };

  const isUrgent = secondsLeft < 60;
  const isCaptchaOrLogin = challengeType === 'captcha' || challengeType === 'login_required' || challengeType.includes('captcha') || challengeType.includes('login');

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-orange-400 dark:border-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{meta.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {meta.title}
              </h3>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0 ${
                  isUrgent
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {formatCountdown(secondsLeft)}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{meta.body}</p>

            <div className="mb-3 p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-orange-200 dark:border-orange-800/40">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Steps to resolve:</p>
              <ol className="space-y-1">
                {meta.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-orange-200 dark:bg-orange-800/60 text-orange-700 dark:text-orange-300 flex items-center justify-center text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {blockedUrl && (
              <div className="mb-3 rounded-lg border border-orange-300 dark:border-orange-700/50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-700/40">
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1 font-mono">{blockedUrl}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCaptchaOrLogin && (
                      <button
                        onClick={() => setShowEmbedded((v) => !v)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-200 dark:bg-orange-800/50 text-orange-800 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-700/60 transition-colors font-medium"
                      >
                        <Monitor className="w-3 h-3" />
                        {showEmbedded ? 'Hide' : 'Open inline'}
                      </button>
                    )}
                    <a
                      href={blockedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in tab
                    </a>
                  </div>
                </div>

                {showEmbedded && (
                  <div className="relative">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Embedded browser — complete the challenge here
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIframeKey((k) => k + 1)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                          title="Reload"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setShowEmbedded(false)}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          title="Close"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <iframe
                      key={iframeKey}
                      src={blockedUrl}
                      className="w-full border-0"
                      style={{ height: '380px' }}
                      sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-top-navigation-by-user-activation"
                      title="Challenge page"
                    />
                  </div>
                )}
              </div>
            )}

            {!blockedUrl && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400">
                No URL available — the agent was blocked before reaching the target page.
                Open your browser manually and check if the site requires verification.
              </div>
            )}

            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono">{tool}</span>
              <span>was blocked during automation</span>
            </div>

            <button
              onClick={() => setShowDetail((v) => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              {showDetail ? 'Hide' : 'Show'} technical details
            </button>

            {showDetail && (
              <div className="mb-3 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
                  {reason || 'No additional detail available.'}
                </pre>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                {meta.continueLabel}
              </button>
              <button
                onClick={handleSkip}
                className="flex items-center justify-center gap-2 py-2.5 px-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
