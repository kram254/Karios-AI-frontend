import React, { useEffect, useState } from 'react';

interface BrowserStatusMarqueeProps {
  currentAction: string;
  isActive: boolean;
}

export const BrowserStatusMarquee: React.FC<BrowserStatusMarqueeProps> = ({
  currentAction,
  isActive
}) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!currentAction) {
      setDisplayText('Initializing browser automation...');
      return;
    }

    const actionLower = currentAction.toLowerCase();
    
    if (actionLower.includes('navigat')) {
      setDisplayText(`🌐 Navigating • ${currentAction}`);
    } else if (actionLower.includes('click')) {
      setDisplayText(`🖱️ Clicking • ${currentAction}`);
    } else if (actionLower.includes('type') || actionLower.includes('fill') || actionLower.includes('enter')) {
      setDisplayText(`⌨️ Typing • ${currentAction}`);
    } else if (actionLower.includes('search')) {
      setDisplayText(`🔍 Searching • ${currentAction}`);
    } else if (actionLower.includes('scrol')) {
      setDisplayText(`📜 Scrolling • ${currentAction}`);
    } else if (actionLower.includes('wait')) {
      setDisplayText(`⏳ Waiting • ${currentAction}`);
    } else if (actionLower.includes('extract') || actionLower.includes('scrap')) {
      setDisplayText(`📊 Extracting data • ${currentAction}`);
    } else if (actionLower.includes('screenshot')) {
      setDisplayText(`📸 Capturing • ${currentAction}`);
    } else if (actionLower.includes('complet')) {
      setDisplayText(`✅ Completed • ${currentAction}`);
    } else {
      setDisplayText(`⚡ ${currentAction}`);
    }
  }, [currentAction]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="browser-status-marquee">
      <div className="marquee-container">
        <div className="marquee-line marquee-line-1">
          <div className="marquee-content">
            {displayText}
          </div>
          <div className="marquee-content" aria-hidden="true">
            {displayText}
          </div>
        </div>
        <div className="marquee-line marquee-line-2">
          <div className="marquee-content-reverse">
            Headless Browser Mode • Real-time Automation
          </div>
          <div className="marquee-content-reverse" aria-hidden="true">
            Headless Browser Mode • Real-time Automation
          </div>
        </div>
      </div>
      
      <style>{`
        .browser-status-marquee {
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(20, 20, 20, 0.95) 50%, 
            rgba(0, 0, 0, 0.95) 100%
          );
          border: 1px solid rgba(100, 100, 100, 0.3);
          border-radius: 6px;
          padding: 8px 0;
          margin: 8px 0;
          position: relative;
        }

        .browser-status-marquee::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(200, 200, 200, 0.3) 50%, 
            transparent 100%
          );
        }

        .browser-status-marquee::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(100, 100, 100, 0.3) 50%, 
            transparent 100%
          );
        }

        .marquee-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .marquee-line {
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .marquee-line-1 .marquee-content {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          white-space: nowrap;
          padding-right: 50px;
          animation: scroll-left 15s linear infinite;
        }

        .marquee-line-2 .marquee-content-reverse {
          font-size: 11px;
          font-weight: 400;
          color: rgba(180, 180, 180, 0.8);
          white-space: nowrap;
          padding-right: 50px;
          animation: scroll-right 20s linear infinite;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes scroll-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }

        .marquee-line:hover .marquee-content,
        .marquee-line:hover .marquee-content-reverse {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
