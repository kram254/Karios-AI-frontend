import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';

const GUEST_MSG_KEY = 'karios_guest_msg_count';
const GUEST_MSG_LIMIT = 10;

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [guestCount, setGuestCount] = useState<number>(() => {
    const stored = localStorage.getItem(GUEST_MSG_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem(GUEST_MSG_KEY, String(guestCount));
    if (guestCount >= GUEST_MSG_LIMIT) {
      setShowLoginPrompt(true);
    }
  }, [guestCount]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (guestCount >= GUEST_MSG_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }
    setGuestCount(prev => prev + 1);
    navigate('/chat', { state: { initialMessage: inputValue.trim() } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    if (guestCount >= GUEST_MSG_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }
    setGuestCount(prev => prev + 1);
    navigate('/chat', { state: { initialMessage: action } });
  };

  const stars = [
    { id: 1, x: 12, y: 8, color: '#FF8C00', size: 3 },
    { id: 2, x: 28, y: 18, color: '#FF8C00', size: 2 },
    { id: 3, x: 55, y: 6, color: '#FF8C00', size: 3.5 },
    { id: 4, x: 72, y: 22, color: '#001BFF', size: 2.5 },
    { id: 5, x: 85, y: 10, color: '#001BFF', size: 3 },
    { id: 6, x: 92, y: 25, color: '#001BFF', size: 2 },
  ];

  const sidebarIcons = [
    {
      label: 'Chat',
      path: '/chat',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'New Chat',
      path: '/chat',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>
      ),
    },
    {
      label: 'Builder Studio',
      path: '/builder',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/>
          <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
          <path d="M14.5 17.5 4.5 15"/>
        </svg>
      ),
    },
    {
      label: 'Scheduled Tasks',
      path: '/scheduled-tasks',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Agent Teams',
      path: '/teams',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'Command Centre',
      path: '/qa',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    },
    {
      label: 'Agent Chat',
      path: '/chat',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8"/>
          <rect width="16" height="12" x="4" y="8" rx="2"/>
          <path d="M2 14h2"/>
          <path d="M20 14h2"/>
          <path d="M15 13v2"/>
          <path d="M9 13v2"/>
        </svg>
      ),
    },
    {
      label: 'Knowledge',
      path: '/knowledge',
      svg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
          <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
        </svg>
      ),
    },
  ];

  const agentCards = [
    {
      title: 'Daily Briefing',
      description: 'Start your day with a curated summary of tasks, meetings, and priorities.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      glow: 'radial-gradient(ellipse at 50% 110%, rgba(255,100,0,0.22) 0%, transparent 70%)',
      border: 'rgba(255,100,0,0.2)',
      accent: '#FF6400',
      action: 'Run my daily briefing',
    },
    {
      title: 'Chief of Staff',
      description: 'Delegate complex multi-step tasks and get strategic recommendations instantly.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      glow: 'radial-gradient(ellipse at 50% 110%, rgba(255,160,0,0.2) 0%, transparent 70%)',
      border: 'rgba(255,160,0,0.2)',
      accent: '#FFA000',
      action: 'Help me plan my week',
    },
    {
      title: 'Data Analyst',
      description: 'Query, visualize, and extract insights from your data with natural language.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      glow: 'radial-gradient(ellipse at 50% 110%, rgba(0,100,255,0.22) 0%, transparent 70%)',
      border: 'rgba(0,100,255,0.2)',
      accent: '#0064FF',
      action: 'Analyze my data',
    },
  ];

  const quickActions = [
    'Draft an email',
    'Summarize a document',
    'Plan a project',
    'Research a topic',
  ];

  const integrationIcons = [
    {
      name: 'Google',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      ),
    },
    {
      name: 'Slack',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A" />
        </svg>
      ),
    },
    {
      name: 'Microsoft',
      svg: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
          <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
          <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
          <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
        </svg>
      ),
    },
  ];

  return (
    <PageShell constrained={false}>
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      background: '#04070F',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes twinkle2 {
          0%, 100% { opacity: 0.6; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes twinkle3 {
          0%, 100% { opacity: 0.8; transform: scale(1.1); }
          33% { opacity: 0.2; transform: scale(0.75); }
          66% { opacity: 1; transform: scale(1); }
        }

        .hs-sidebar-icon {
          color: rgba(255,255,255,0.35);
          transition: color 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .hs-sidebar-icon:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.06);
        }

        .hs-agent-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          cursor: pointer;
        }
        .hs-agent-card:hover {
          transform: translateY(-8px);
        }

        .hs-input-wrap {
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .hs-input-wrap:focus-within .hs-textarea {
          border-color: rgba(255,255,255,0.18);
        }

        .hs-textarea {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 14px;
          outline: none;
          resize: none;
          width: 100%;
          box-sizing: border-box;
          color: rgba(255,255,255,0.9);
          font-size: 15px;
          font-family: inherit;
          line-height: 1.6;
          transition: border-color 0.2s ease;
        }
        .hs-textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .hs-quick-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .hs-quick-pill:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.15);
        }

        .hs-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
          flex-shrink: 0;
        }
        .hs-icon-btn:hover {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          border-color: rgba(255,255,255,0.2);
        }

        .hs-plan-toggle {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .hs-plan-toggle:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.8);
          border-color: rgba(255,255,255,0.2);
        }

        .hs-send-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0064FF 0%, #0033CC 100%);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #ffffff;
          flex-shrink: 0;
          transition: opacity 0.2s ease, transform 0.15s ease;
          box-shadow: 0 2px 12px rgba(0,100,255,0.35);
        }
        .hs-send-btn:hover {
          opacity: 0.88;
          transform: scale(1.05);
        }

        .hs-login-btn {
          background: rgba(0,100,255,0.15);
          border: 1px solid rgba(0,100,255,0.3);
          border-radius: 8px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .hs-login-btn:hover {
          background: rgba(0,100,255,0.3);
        }

        .hs-dismiss-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .hs-dismiss-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.65);
        }

        .hs-integ-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .hs-integ-icon:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '-10%',
          width: '55%',
          height: '60%',
          background: 'radial-gradient(ellipse at center, rgba(255,69,0,0.12) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          top: '-5%',
          right: '-5%',
          width: '45%',
          height: '55%',
          background: 'radial-gradient(ellipse at center, rgba(0,50,255,0.15) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        {stars.map((star, i) => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: '50%',
              background: star.color,
              boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
              animation: `${i % 3 === 0 ? 'twinkle' : i % 3 === 1 ? 'twinkle2' : 'twinkle3'} ${2.5 + i * 0.7}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* DUPLICATE SIDEBAR REMOVED — the shared Sidebar component (components/Sidebar.tsx) rendered
          by the App.tsx layout shell already handles navigation. This bespoke 80px inline sidebar
          duplicated those nav items and should be fully deleted once HomeScreen is migrated.
          Commented out rather than deleted to preserve layout reference during migration.
      */}
      {false && <div style={{
        width: '80px',
        flexShrink: 0,
        height: 'calc(100% - 24px)',
        alignSelf: 'center',
        margin: '12px 0 12px 12px',
        background: 'rgba(14,17,23,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid #1C2130',
        borderRadius: '16px',
        boxShadow: '0 18px 48px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        zIndex: 10,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          borderBottom: '1px solid #1C2130',
          background: 'rgba(10,13,18,1)',
          padding: '8px',
          flexShrink: 0,
        }}>
          <button
            onClick={() => navigate('/chat')}
            style={{
              padding: '8px',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.55)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', paddingTop: '8px', width: '100%' }}>
          {sidebarIcons.map((icon) => (
            <div
              key={icon.label}
              className="hs-sidebar-icon"
              title={icon.label}
              onClick={() => icon.path && navigate(icon.path)}
            >
              {icon.svg}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: '1px solid #1C2130',
          paddingTop: '8px',
          paddingBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'center',
          width: '100%',
          flexShrink: 0,
        }}>
          <div
            className="hs-sidebar-icon"
            title="Profile"
            onClick={() => navigate('/profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div
            className="hs-sidebar-icon"
            title="Settings"
            onClick={() => navigate('/settings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </div>
      </div>}
      {/* END DUPLICATE SIDEBAR */}

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 5,
        overflowY: 'auto',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
        }}>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 64px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            margin: '0 0 16px 0',
            textAlign: 'center',
            lineHeight: 1.1,
          }}>
            Let's get to work.
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: '560px',
            textAlign: 'center',
            lineHeight: 1.7,
            margin: '0 0 40px 0',
          }}>
            Your AI-powered workspace — delegate tasks, automate workflows, and get things done with intelligent agents at your side.
          </p>

          <div
            className="hs-input-wrap"
            style={{
              width: '100%',
              marginBottom: '16px',
            }}
          >
            <textarea
              ref={inputRef}
              className="hs-textarea"
              rows={3}
              placeholder="What's the task?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '10px',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button className="hs-icon-btn" title="Attach file">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button className="hs-icon-btn" title="Add image">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="hs-plan-toggle">Plan</button>
                <button className="hs-send-btn" onClick={handleSend} title="Send">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '52px',
          }}>
            {quickActions.map((action) => (
              <button
                key={action}
                className="hs-quick-pill"
                onClick={() => handleQuickAction(action)}
              >
                {action}
              </button>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            width: '100%',
          }}>
            {agentCards.map((card) => (
              <div
                key={card.title}
                className="hs-agent-card"
                onClick={() => handleQuickAction(card.action)}
                style={{
                  background: `rgba(255,255,255,0.03)`,
                  backgroundImage: card.glow,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${card.border}`,
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `rgba(255,255,255,0.06)`,
                  border: `1px solid ${card.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.accent,
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '5px',
                  }}>
                    {card.title}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.55,
                  }}>
                    {card.description}
                  </div>
                </div>
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: card.accent,
                  opacity: 0.75,
                }}>
                  Start
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {guestCount > 0 && guestCount < GUEST_MSG_LIMIT && (
            <div style={{
              marginTop: '24px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.25)',
            }}>
              {GUEST_MSG_LIMIT - guestCount} free messages remaining
            </div>
          )}
        </div>
      </div>

      {showLoginPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4,7,15,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(0,100,255,0.5) 0%, rgba(100,0,255,0.5) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#FFFFFF',
              margin: '0 0 10px 0',
            }}>
              You've used {GUEST_MSG_LIMIT} free messages
            </h2>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 28px 0',
              lineHeight: 1.6,
            }}>
              Sign in or create a free account to continue with unlimited access to Karios AI.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="hs-dismiss-btn"
                onClick={() => setShowLoginPrompt(false)}
              >
                Maybe later
              </button>
              <button
                className="hs-login-btn"
                onClick={() => navigate('/login')}
              >
                Sign in / Sign up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageShell>
  );
};

export default HomeScreen;
