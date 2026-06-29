import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Paperclip, 
  Share2, 
  ToggleLeft, 
  Send,
  Mail,
  Users,
  TrendingUp,
  Sparkles,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnonymousAuth } from '../context/AnonymousAuthContext';
import { useChat } from '../context/ChatContext';

interface Star {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

const generateStars = (count: number, color: string): Star[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 30,
    color,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }));
};

const agentCards = [
  {
    id: 'daily_briefing',
    name: 'Daily Briefing',
    tag: 'Starter',
    description: 'Delivers a structured morning briefing to your inbox every day. Connects to your email, calendar, Slack, and industry...',
    glowColor: 'rgba(255, 120, 80, 0.3)',
    gradient: 'from-orange-400/20 via-pink-400/20 to-rose-400/20',
    icon: Mail,
  },
  {
    id: 'chief_of_staff',
    name: 'Chief of Staff',
    tag: 'Starter',
    description: 'Your trusted advisor delivering a daily brief, clearing your inbox, and preparing you for customer meetings.',
    glowColor: 'rgba(255, 220, 150, 0.3)',
    gradient: 'from-yellow-300/20 via-amber-300/20 to-orange-300/20',
    icon: Users,
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    tag: 'Starter',
    description: 'Ask a business question in plain language and get a chart, table, or direct answer pulled from your data...',
    glowColor: 'rgba(120, 200, 255, 0.3)',
    gradient: 'from-cyan-400/20 via-blue-400/20 to-indigo-400/20',
    icon: TrendingUp,
  },
];

const quickActions = [
  'Design a website',
  'Source candidates',
  'Research a topic',
  'Generate images',
  'More...',
];

const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; remaining: number }> = ({ isOpen, onClose, remaining }) => {
  const navigate = useNavigate();
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md mx-4 p-8 rounded-3xl border border-white/10 bg-[#0A0E1A]/95 backdrop-blur-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-400/20 flex items-center justify-center border border-white/10">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Continue with Karios</h2>
            <p className="text-white/60">
              {remaining > 0 
                ? `You have ${remaining} free message${remaining === 1 ? '' : 's'} remaining`
                : "You've used all your free messages"}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-900 font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/25"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-medium transition-all hover:bg-white/10"
            >
              Sign In
            </button>
          </div>
          
          <p className="mt-6 text-center text-sm text-white/40">
            No credit card required
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { requiresAuthentication, remainingMessages, incrementMessageCount } = useAnonymousAuth();
  const { createNewChat, setCurrentChat } = useChat();
  
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [planEnabled, setPlanEnabled] = useState(false);
  const [orangeStars] = useState(() => generateStars(3, '#FF8C00'));
  const [blueStars] = useState(() => generateStars(3, '#001BFF'));

  useEffect(() => {
    if (requiresAuthentication) {
      setShowAuthModal(true);
    }
  }, [requiresAuthentication]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    if (!isAuthenticated) {
      incrementMessageCount();
    }
    
    if (requiresAuthentication) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const chat = await createNewChat();
      if (chat) {
        setCurrentChat(chat);
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }, [inputValue, isAuthenticated, requiresAuthentication, incrementMessageCount, createNewChat, setCurrentChat, navigate]);

  const handleQuickAction = useCallback((action: string) => {
    setInputValue(action);
  }, []);

  const handleAgentClick = useCallback(async (agentId: string) => {
    if (!isAuthenticated) {
      incrementMessageCount();
    }
    
    if (requiresAuthentication) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      const chat = await createNewChat(`Chat with ${agentCards.find(a => a.id === agentId)?.name}`);
      if (chat) {
        setCurrentChat(chat);
        navigate('/chat');
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  }, [isAuthenticated, requiresAuthentication, incrementMessageCount, createNewChat, setCurrentChat, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070F] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ background: 'rgba(255, 69, 0, 0.12)' }}
        />
        <div 
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{ background: 'rgba(0, 50, 255, 0.15)' }}
        />
        
        {orangeStars.map((star) => (
          <motion.div
            key={`orange-${star.id}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {blueStars.map((star) => (
          <motion.div
            key={`blue-${star.id}`}
            className="absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 4}px ${star.color}`,
            }}
            animate={{
              opacity: [0.3, 0.9, 0.3],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2.5,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-[15vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-4">
            Let's get to work.
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Give me any assignment, large or small. I'll research, build, or analyze whatever you need,
            using real sources and real data, to produce polished deliverables.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl mb-6"
        >
          <div 
            className={`relative rounded-2xl border transition-all duration-300 ${
              isInputFocused 
                ? 'border-white/30 bg-white/[0.05] shadow-lg shadow-white/5' 
                : 'border-white/10 bg-white/[0.03]'
            }`}
            style={{ backdropFilter: 'blur(24px)' }}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="What's the task?"
              className="w-full bg-transparent text-white text-lg placeholder:text-white/40 p-5 pr-32 resize-none outline-none min-h-[80px] max-h-[200px]"
              rows={1}
            />
            
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-2 text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-white/40 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5">
                  <Share2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setPlanEnabled(!planEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    planEnabled 
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30' 
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span>Plan</span>
                  <ToggleLeft className={`w-4 h-4 transition-transform ${planEnabled ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#4A154B] border border-white/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zM15.165 17.688a2.527 2.527 0 0 1-2.521-2.523 2.526 2.526 0 0 1 2.521-2.521h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                    </svg>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#0078D4] border border-white/20 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                      <path d="M11.55 4.5H4.5v6.9h7.05V4.5zm1.05 0v6.9h7.05V4.5h-7.05zm-1.05 8.1H4.5v6.9h7.05v-6.9zm1.05 6.9h7.05v-6.9h-7.05v6.9z"/>
                    </svg>
                  </div>
                </div>
                
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="p-2.5 rounded-xl bg-white text-[#04070F] transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-2 mb-16"
        >
          {quickActions.map((action, index) => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              className="px-4 py-2 rounded-full text-sm text-white/60 border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/80 hover:border-white/20 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {action}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl"
        >
          <h2 className="text-xl font-semibold text-white mb-6 px-2">Start with an agent</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agentCards.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                onClick={() => handleAgentClick(agent.id)}
                className="relative group cursor-pointer rounded-2xl border border-white/10 overflow-hidden"
                style={{ backdropFilter: 'blur(16px)' }}
              >
                <div 
                  className={`absolute inset-0 bg-gradient-to-t ${agent.gradient} opacity-60 group-hover:opacity-80 transition-opacity`}
                />
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ 
                    background: `radial-gradient(circle at 50% 100%, ${agent.glowColor} 0%, transparent 70%)` 
                  }}
                />
                
                <div className="relative p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                        <agent.icon className="w-5 h-5 text-white/80" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/10">
                      {agent.tag}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/60 leading-relaxed mb-4 flex-grow">
                    {agent.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <agent.icon className="w-4 h-4 text-white/50" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all group-hover:gap-3">
                      Launch
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white/70"
            style={{ backdropFilter: 'blur(10px)' }}
          >
            {remainingMessages > 0 ? (
              <span>{remainingMessages} free message{remainingMessages === 1 ? '' : 's'} remaining</span>
            ) : (
              <span>No free messages remaining</span>
            )}
          </motion.div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        remaining={remainingMessages}
      />
    </div>
  );
};

export default Landing;
