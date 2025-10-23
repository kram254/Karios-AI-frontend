import React, { useEffect, useState } from 'react';

interface BrowserStatusMarqueeProps {
  currentAction: string;
  isActive: boolean;
}

export const BrowserStatusMarquee: React.FC<BrowserStatusMarqueeProps> = ({
  currentAction,
  isActive
}) => {
  const [statusLines, setStatusLines] = useState<string[]>([
    'Initializing...',
    'Headless Browser Mode',
    'Waiting for task'
  ]);

  useEffect(() => {
    if (!currentAction) {
      return;
    }

    const actionLower = currentAction.toLowerCase();
    let statusText = '';
    
    if (actionLower.includes('navigat')) {
      statusText = `Navigating to URL`;
    } else if (actionLower.includes('click')) {
      statusText = `Clicking element`;
    } else if (actionLower.includes('type') || actionLower.includes('fill') || actionLower.includes('enter')) {
      statusText = `Typing text`;
    } else if (actionLower.includes('search')) {
      statusText = `Searching page`;
    } else if (actionLower.includes('scrol')) {
      statusText = `Scrolling page`;
    } else if (actionLower.includes('wait')) {
      statusText = `Waiting for load`;
    } else if (actionLower.includes('extract') || actionLower.includes('scrap')) {
      statusText = `Extracting data`;
    } else if (actionLower.includes('screenshot')) {
      statusText = `Capturing screenshot`;
    } else if (actionLower.includes('complet')) {
      statusText = `Task completed`;
    } else {
      statusText = currentAction.substring(0, 50);
    }

    setStatusLines(prev => {
      const newLines = [...prev];
      newLines.shift();
      newLines.push(statusText);
      return newLines;
    });
  }, [currentAction]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="browser-status-marquee">
      <div className="marquee-vertical">
        {statusLines.map((line, index) => (
          <div key={`${line}-${index}`} className="marquee-line-vertical">
            {line}
          </div>
        ))}
      </div>
      
      <style>{`
        .browser-status-marquee {
          width: 100%;
          height: 60px;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(20, 20, 20, 0.95) 50%, 
            rgba(0, 0, 0, 0.95) 100%
          );
          border: 1px solid rgba(100, 100, 100, 0.3);
          border-radius: 6px;
          margin: 8px 0;
          position: relative;
          display: flex;
          align-items: center;
          animation: pulse-border 2s ease-in-out infinite;
        }

        @keyframes pulse-border {
          0%, 100% {
            border-color: rgba(100, 100, 100, 0.3);
          }
          50% {
            border-color: rgba(150, 150, 150, 0.5);
          }
        }

        .marquee-vertical {
          width: 100%;
          display: flex;
          flex-direction: column;
          animation: scroll-up 3s ease-in-out infinite;
        }

        .marquee-line-vertical {
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 400;
          color: rgba(200, 200, 200, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 12px;
          animation: blink-text 1.5s ease-in-out infinite;
        }

        .marquee-line-vertical:nth-child(2) {
          font-weight: 500;
          color: #fff;
          font-size: 13px;
        }

        @keyframes scroll-up {
          0% {
            transform: translateY(0);
          }
          33% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          73% {
            transform: translateY(-20px);
          }
          80% {
            transform: translateY(-40px);
          }
          100% {
            transform: translateY(-40px);
          }
        }

        @keyframes blink-text {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
