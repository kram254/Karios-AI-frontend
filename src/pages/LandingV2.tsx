import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { 
  SparklesIcon, 
  TrendingUpIcon, 
  ZapIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  MessageCircleIcon,
  ChevronUpIcon,
  XIcon,
  Zap,
  Brain,
  Network,
  BarChart3,
  Code2,
  Database,
  Search,
  Building2,
  ArrowUpRight,
  Play,
  ChevronDown,
  Bot,
  Cpu,
  Globe,
  Lock
} from 'lucide-react';
import AnimatedBotAvatar from '../components/AnimatedBotAvatar';

const avatarStates: Array<'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle' | 'greeting' | 'success' | 'listening' | 'explaining'> = [
  'greeting',
  'thinking',
  'searching',
  'browsing',
  'explaining',
  'success',
  'idle'
];

const revealUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const revealScale = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const cardHover = {
  rest: { y: 0, boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)' },
  hover: { 
    y: -4, 
    boxShadow: '0 8px 40px rgba(0, 212, 180, 0.15)',
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
  }
};

const partnerLogos = [
  { name: 'OpenAI', icon: Brain },
  { name: 'Anthropic', icon: SparklesIcon },
  { name: 'Google', icon: Globe },
  { name: 'Perplexity', icon: Search },
  { name: 'Together AI', icon: Network }
];

const howItWorksSteps = [
  {
    number: '01',
    title: 'Connect Your Work',
    description: 'Integrate your tools, APIs, and data sources in minutes with our pre-built connectors.',
    icon: Network,
    color: 'cyan'
  },
  {
    number: '02',
    title: 'Deploy Agents',
    description: 'Configure specialized AI agents for your tasks with visual workflow builder.',
    icon: Bot,
    color: 'fuchsia'
  },
  {
    number: '03',
    title: 'Watch Savings Grow',
    description: 'Real-time dashboard showing cost optimization and performance metrics.',
    icon: BarChart3,
    color: 'violet'
  }
];

const faqItems = [
  {
    question: 'How does the cost optimization work?',
    answer: 'Karios analyzes every query in real-time and routes it to the most cost-effective AI model that can handle the task. Simple queries use lightweight models like Gemini Flash, while complex tasks get GPT-4. This automatic routing saves 70-90% on API costs.'
  },
  {
    question: 'Can I use my own API keys?',
    answer: 'Yes! You can bring your own API keys for OpenAI, Anthropic, Google, and other providers. Karios will route traffic through your accounts, giving you full control over your AI infrastructure while still benefiting from our optimization layer.'
  },
  {
    question: 'What models are supported?',
    answer: 'We support all major AI models including GPT-4, GPT-3.5, Claude 3 (Opus/Sonnet/Haiku), Gemini Pro/Flash, Perplexity Sonar, and more. New models are added automatically as they become available.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use enterprise-grade encryption, SOC 2 Type II compliant infrastructure, and offer dedicated deployments for enterprise customers. Your data is never used to train AI models, and we provide full audit logs.'
  },
  {
    question: 'How do agents communicate?',
    answer: 'Our agents use a proprietary communication protocol with structured handoffs, shared context memory, and quality gates. Each agent can delegate subtasks to specialized agents, forming an efficient workflow that maintains context across the entire operation.'
  }
];

const testimonials = [
  {
    type: 'quote',
    content: 'Karios cut our AI costs by 85% while improving response quality. The multi-agent system handles our entire research pipeline autonomously.',
    author: 'Sarah Chen',
    role: 'VP of Engineering',
    company: 'TechCorp',
    size: 'large'
  },
  {
    type: 'metric',
    value: '$50K',
    label: 'saved this quarter',
    size: 'small'
  },
  {
    type: 'metric',
    value: '10x',
    label: 'faster research',
    size: 'small'
  },
  {
    type: 'quote',
    content: 'The visual workflow builder let us deploy complex multi-agent systems in days instead of months. Game changer for our automation team.',
    author: 'Marcus Johnson',
    role: 'Automation Lead',
    company: 'DataFlow Inc',
    size: 'medium'
  }
];

const GradientOrb: React.FC<{ color: string; className: string; delay?: number }> = ({ color, className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`}
    style={{ background: color }}
    animate={{
      x: [0, 30, 0, -30, 0],
      y: [0, -20, 30, -10, 0],
      scale: [1, 1.1, 0.95, 1.05, 1]
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: 'easeInOut',
      delay
    }}
  />
);

const AnnouncementBar: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 border-b border-white/10"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 text-sm">
      <span className="flex items-center gap-2">
        <span className="text-lg">🚀</span>
        <span className="text-slate-200">New: Multi-agent teams with visual workflow builder</span>
      </span>
      <a href="/changelog" className="text-cyan-300 hover:text-cyan-200 font-medium inline-flex items-center gap-1 transition-colors">
        Learn more
        <ArrowUpRight className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={onDismiss}
        className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss announcement"
      >
        <XIcon className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  </motion.div>
);

const LiveDemoWidget: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: 'user', content: 'Research latest AI trends', agent: null },
    { role: 'agent', content: 'Analyzing query complexity...', agent: 'Router', color: 'cyan' },
    { role: 'agent', content: 'Routing to Perplexity Sonar', agent: 'Router', color: 'cyan' },
    { role: 'agent', content: 'Searching 47 sources...', agent: 'Research Agent', color: 'fuchsia' }
  ]);
  const [savings, setSavings] = useState(0);
  const [currentModel, setCurrentModel] = useState('GPT-4');

  useEffect(() => {
    const interval = setInterval(() => {
      setSavings(prev => (prev + 0.12) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const models = ['GPT-4', 'Claude 3', 'Gemini Pro', 'Perplexity'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % models.length;
      setCurrentModel(models[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      variants={revealScale}
      className="rounded-2xl border border-white/10 bg-[#111827]/60 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Demo</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Model:</span>
          <motion.span
            key={currentModel}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-cyan-300"
          >
            {currentModel}
          </motion.span>
        </div>
      </div>

      <div className="space-y-3 mb-4 max-h-48 overflow-hidden">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
                  : 'bg-white/5 border border-white/10 text-slate-300'
              }`}
            >
              {msg.agent && (
                <div className={`text-xs font-medium mb-1 ${
                  msg.color === 'cyan' ? 'text-cyan-400' : 
                  msg.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-violet-400'
                }`}>
                  {msg.agent}
                </div>
              )}
              {msg.content}
            </div>
          </motion.div>
        ))}
        <div className="flex justify-start">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-1">Cost Saved This Session</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ${savings.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">87% savings</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ModelRouterVisualization: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { label: 'Input Query', icon: MessageCircleIcon, color: 'cyan' },
    { label: 'Router Brain', icon: Brain, color: 'violet' },
    { label: 'Model Selection', icon: Cpu, color: 'fuchsia' },
    { label: 'Output Delivery', icon: Zap, color: 'emerald' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative py-12">
      <div className="flex items-center justify-center gap-4 md:gap-8">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div
              className={`relative flex flex-col items-center ${
                activeStep === i ? 'scale-110' : activeStep > i ? 'opacity-60' : 'opacity-40'
              }`}
              animate={{ scale: activeStep === i ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  activeStep === i
                    ? `bg-${step.color}-500/20 border-2 border-${step.color}-400 shadow-[0_0_30px_rgba(var(--${step.color}-rgb),0.3)]`
                    : 'bg-white/5 border border-white/10'
                }`}
                style={{
                  boxShadow: activeStep === i 
                    ? `0 0 30px rgba(${step.color === 'cyan' ? '0,212,180' : step.color === 'violet' ? '139,92,246' : step.color === 'fuchsia' ? '217,70,239' : '16,185,129'},0.3)`
                    : undefined
                }}
              >
                <step.icon className={`w-7 h-7 ${
                  activeStep === i
                    ? step.color === 'cyan' ? 'text-cyan-400' :
                      step.color === 'violet' ? 'text-violet-400' :
                      step.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-emerald-400'
                    : 'text-slate-400'
                }`} />
              </div>
              <span className={`mt-3 text-sm font-medium ${
                activeStep === i ? 'text-white' : 'text-slate-400'
              }`}>
                {step.label}
              </span>
              {activeStep === i && (
                <motion.div
                  className="absolute -inset-4 rounded-3xl border-2 border-dashed border-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </motion.div>
            {i < steps.length - 1 && (
              <div className="relative w-12 md:w-20 h-0.5 bg-white/10 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-violet-400"
                  initial={{ width: '0%' }}
                  animate={{ width: activeStep > i ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {['GPT-4', 'Claude 3', 'Gemini Pro', 'Perplexity'].map((model, i) => (
          <motion.div
            key={model}
            className={`rounded-xl border px-4 py-3 text-center transition-all ${
              activeStep === 2 && i === Math.floor(Date.now() / 2000) % 4
                ? 'bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            animate={activeStep === 2 && i === Math.floor(Date.now() / 2000) % 4 ? {
              boxShadow: ['0 0 0px rgba(217,70,239,0)', '0 0 20px rgba(217,70,239,0.3)', '0 0 0px rgba(217,70,239,0)']
            } : {}}
            transition={{ duration: 1, repeat: activeStep === 2 ? Infinity : 0 }}
          >
            <Cpu className="w-5 h-5 mx-auto mb-1" />
            <span className="text-sm font-medium">{model}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const FAQAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqItems.map((item, index) => (
        <motion.div
          key={index}
          initial={false}
          className={`rounded-xl border transition-all duration-300 ${
            openIndex === index
              ? 'bg-white/10 border-cyan-400/30 shadow-[0_0_20px_rgba(0,212,180,0.1)]'
              : 'bg-white/5 border-white/10 hover:border-white/20'
          }`}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <span className={`font-medium ${openIndex === index ? 'text-white' : 'text-slate-300'}`}>
              {item.question}
            </span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <ChevronDown className={`w-5 h-5 ${openIndex === index ? 'text-cyan-400' : 'text-slate-400'}`} />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-slate-400 leading-relaxed">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

const LandingV2: React.FC = () => {
  const [activeAvatarState, setActiveAvatarState] = useState<typeof avatarStates[number]>('greeting');
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activePricingTab, setActivePricingTab] = useState<'monthly' | 'annual'>('monthly');
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);
  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const heroYSpring = useSpring(heroY, springConfig);

  useEffect(() => {
    let index = 0;
    const interval = window.setInterval(() => {
      index = (index + 1) % avatarStates.length;
      setActiveAvatarState(avatarStates[index]);
    }, 2200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04070f] text-slate-100">
      <div className="fixed inset-0 pointer-events-none">
        <GradientOrb color="rgba(0, 212, 180, 0.12)" className="top-0 left-1/4 w-[600px] h-[600px]" delay={0} />
        <GradientOrb color="rgba(139, 92, 246, 0.1)" className="top-1/3 right-0 w-[500px] h-[500px]" delay={5} />
        <GradientOrb color="rgba(217, 70, 239, 0.08)" className="bottom-0 left-1/3 w-[400px] h-[400px]" delay={10} />
        
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10">
        <AnimatePresence>
          {showAnnouncement && <AnnouncementBar onDismiss={() => setShowAnnouncement(false)} />}
        </AnimatePresence>

        <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#04070f]/70 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <SparklesIcon className="w-8 h-8 text-cyan-300" />
                </motion.div>
                <span className="ml-2 text-2xl font-semibold tracking-tight text-white">Karios AI</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center space-x-1">
                  {['Features', 'Pricing', 'Docs', 'Login'].map((item) => (
                    <a
                      key={item}
                      href={item === 'Login' ? '/login' : item === 'Pricing' ? '/pricing' : item === 'Docs' ? '/docs' : '#features'}
                      className="relative px-4 py-2 text-slate-300 hover:text-white transition-colors group"
                    >
                      {item}
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-cyan-400 group-hover:w-1/2 transition-all duration-300" />
                    </a>
                  ))}
                </div>
                <motion.a
                  href="/signup"
                  className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-violet-900/30"
                  whileHover={{ scale: 1.02, brightness: 1.1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  Start Free
                </motion.a>
              </div>
            </div>
          </div>
        </nav>

        <motion.section 
          className="relative min-h-[90vh] flex items-center py-14 md:py-24"
          style={{ y: heroYSpring, opacity: heroOpacity }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] items-center">
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7">
                <motion.div 
                  variants={revealUp}
                  className="inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-200 hover:border-cyan-300/50 transition-colors cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse" />
                  Live multi-agent automation for teams
                </motion.div>
                
                <motion.h1 
                  variants={revealUp}
                  className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-white tracking-tight"
                >
                  AI Research & Automation
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                    That Saves You 90%
                  </span>
                </motion.h1>
                
                <motion.p 
                  variants={revealUp}
                  className="max-w-2xl text-lg text-slate-400 leading-relaxed"
                >
                  Stop overpaying for AI APIs. Karios combines intelligent model routing, semantic caching,
                  and multi-agent automation to deliver enterprise-grade AI at a fraction of the cost.
                </motion.p>
                
                <motion.div 
                  variants={revealUp}
                  className="flex flex-wrap items-center gap-4"
                >
                  <motion.a
                    href="/signup"
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-violet-900/40"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    Start Building
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="/login"
                    className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-xl hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.a>
                </motion.div>
                
                <motion.p variants={revealUp} className="text-sm text-slate-500">
                  No credit card required • 10 queries free forever
                </motion.p>

                <motion.div variants={revealUp} className="pt-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Trusted by innovative teams</p>
                  <div className="flex items-center gap-6 opacity-50">
                    {partnerLogos.map((partner) => (
                      <motion.div
                        key={partner.name}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors cursor-default"
                        whileHover={{ scale: 1.05, opacity: 1 }}
                      >
                        <partner.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{partner.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                variants={revealUp} 
                initial="hidden" 
                animate="show" 
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="grid gap-6">
                  <motion.div
                    className="rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
                    whileHover={{ y: -4, boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-center">
                      <AnimatedBotAvatar state={activeAvatarState} message="" size="large" showMessage={false} />
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                      {['Routing', 'Agents', 'Automation'].map((tag, i) => (
                        <motion.div
                          key={tag}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                            i === 0 ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200' :
                            i === 1 ? 'border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-200' :
                            'border-violet-300/30 bg-violet-400/10 text-violet-200'
                          }`}
                          whileHover={{ scale: 1.05, y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          {tag}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <LiveDemoWidget />
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-xs text-slate-500">Scroll to explore</span>
            <ChevronDown className="w-5 h-5 text-slate-500" />
          </motion.div>
        </motion.section>

        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { value: '90%', label: 'Cost Savings', color: 'cyan' },
                { value: '10x', label: 'Faster Results', color: 'fuchsia' },
                { value: '99.9%', label: 'Uptime SLA', color: 'violet' },
                { value: '6+', label: 'AI Models', color: 'emerald' }
              ].map((metric) => (
                <motion.div
                  key={metric.label}
                  variants={revealUp}
                  className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-6 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
                  whileHover={{ y: -4, boxShadow: `0 20px 40px rgba(0,0,0,0.3)` }}
                >
                  <motion.div 
                    className={`text-3xl font-semibold mb-1 ${
                      metric.color === 'cyan' ? 'text-cyan-300' :
                      metric.color === 'fuchsia' ? 'text-fuchsia-300' :
                      metric.color === 'violet' ? 'text-violet-300' : 'text-emerald-300'
                    }`}
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {metric.value}
                  </motion.div>
                  <div className="text-sm text-slate-400">{metric.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                How Karios Works
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Three simple steps to 90% cost savings and enterprise-grade AI automation
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {howItWorksSteps.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={revealUp}
                  className="relative group"
                >
                  <motion.div
                    className="h-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl overflow-hidden"
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-${step.color}-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
                    
                    <div className={`text-6xl font-bold mb-4 ${
                      step.color === 'cyan' ? 'text-cyan-500/20' :
                      step.color === 'fuchsia' ? 'text-fuchsia-500/20' : 'text-violet-500/20'
                    }`}>
                      {step.number}
                    </div>
                    
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                      step.color === 'cyan' ? 'bg-cyan-500/20' :
                      step.color === 'fuchsia' ? 'bg-fuchsia-500/20' : 'bg-violet-500/20'
                    }`}>
                      <step.icon className={`w-7 h-7 ${
                        step.color === 'cyan' ? 'text-cyan-400' :
                        step.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-violet-400'
                      }`} />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{step.description}</p>

                    {i < howItWorksSteps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-white/20 to-transparent" />
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Intelligent Model Routing
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                The right model for every task, automatically selected in milliseconds
              </p>
            </motion.div>

            <motion.div
              variants={revealScale}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 backdrop-blur-xl"
            >
              <ModelRouterVisualization />
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Why Choose Karios AI?
              </h2>
              <p className="text-lg text-slate-400">
                Enterprise features at startup prices
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[{
                icon: TrendingUpIcon,
                title: 'Intelligent Cost Optimization',
                color: 'cyan',
                description: 'Our AI router analyzes every query and automatically selects the most cost-effective model. Simple questions use Gemini Flash ($0.000075/1M tokens), complex ones use GPT-4.',
                features: ['70-90% cost reduction vs always using premium models', 'Semantic caching eliminates redundant API calls', 'Real-time cost tracking and analytics']
              }, {
                icon: ZapIcon,
                title: 'Multi-Agent Automation',
                color: 'fuchsia',
                description: 'Our specialized AI agents work together to tackle complex tasks. From research to execution, with built-in quality gates ensuring 80%+ accuracy.',
                features: ['Web automation with visual AI element detection', 'Agent-to-Agent communication protocol', 'Human-in-the-loop for critical decisions']
              }, {
                icon: ShieldCheckIcon,
                title: 'Enterprise-Grade Security',
                color: 'violet',
                description: 'Built for teams and organizations with advanced security, compliance, and governance features that scale with your needs.',
                features: ['SSO, RBAC, and audit logs (Enterprise)', '99.9% uptime SLA guarantee', 'SOC 2 Type II compliant infrastructure']
              }].map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={revealUp}
                  className="group"
                >
                  <motion.div
                    className="h-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl hover:border-white/20 transition-all duration-300"
                    whileHover={{ y: -4 }}
                  >
                    <motion.div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                        feature.color === 'cyan' ? 'bg-cyan-500/20 border border-cyan-500/30' :
                        feature.color === 'fuchsia' ? 'bg-fuchsia-500/20 border border-fuchsia-500/30' :
                        'bg-violet-500/20 border border-violet-500/30'
                      }`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <feature.icon className={`w-6 h-6 ${
                        feature.color === 'cyan' ? 'text-cyan-400' :
                        feature.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-violet-400'
                      }`} />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed">{feature.description}</p>
                    
                    <ul className="space-y-3">
                      {feature.features.map((item, i) => (
                        <motion.li
                          key={i}
                          className="flex items-start text-sm text-slate-400"
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <CheckIcon className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                            feature.color === 'cyan' ? 'text-cyan-400' :
                            feature.color === 'fuchsia' ? 'text-fuchsia-400' : 'text-violet-400'
                          }`} />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Use Cases
              </h2>
              <p className="text-lg text-slate-400">
                One platform, infinite possibilities
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[{
                title: 'For Developers',
                icon: Code2,
                color: 'cyan',
                description: 'Your AI-powered research assistant that never sleeps. Get instant answers to coding questions, documentation lookups, and error debugging.',
                features: ['Real-time Stack Overflow + docs search', 'Code generation with best practices', 'API documentation generation']
              }, {
                title: 'For Data Teams',
                icon: Database,
                color: 'fuchsia',
                description: 'Automate web scraping, data extraction, and competitive intelligence gathering at scale with visual AI.',
                features: ['Visual element detection (no brittle selectors)', 'Anti-detection stealth for protected sites', 'Structured data export to CSV/JSON/Database']
              }, {
                title: 'For Researchers',
                icon: Search,
                color: 'emerald',
                description: 'Comprehensive market research and competitive intelligence with citations, powered by Perplexity Sonar and multi-source aggregation.',
                features: ['Real-time web search with source citations', 'Multi-source data aggregation', 'Export to PDF, Notion, Google Docs']
              }, {
                title: 'For Enterprises',
                icon: Building2,
                color: 'amber',
                description: 'Scale your AI operations with multi-agent orchestration, team collaboration, and enterprise-grade governance.',
                features: ['Unlimited team members and workspaces', 'SSO, RBAC, and compliance controls', 'Dedicated support and SLA guarantees']
              }].map((useCase) => (
                <motion.div
                  key={useCase.title}
                  variants={revealUp}
                  className="group"
                >
                  <motion.div
                    className="h-full rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl overflow-hidden relative"
                    whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.2)' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`absolute top-0 right-0 w-40 h-40 opacity-20 ${
                      useCase.color === 'cyan' ? 'bg-cyan-500' :
                      useCase.color === 'fuchsia' ? 'bg-fuchsia-500' :
                      useCase.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                    } rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`} />
                    
                    <div className="relative">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                          useCase.color === 'cyan' ? 'bg-cyan-500/20' :
                          useCase.color === 'fuchsia' ? 'bg-fuchsia-500/20' :
                          useCase.color === 'emerald' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                        }`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <useCase.icon className={`w-6 h-6 ${
                          useCase.color === 'cyan' ? 'text-cyan-400' :
                          useCase.color === 'fuchsia' ? 'text-fuchsia-400' :
                          useCase.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                        }`} />
                      </motion.div>
                      
                      <h3 className="text-2xl font-semibold text-white mb-3">{useCase.title}</h3>
                      <p className="text-slate-400 mb-6 leading-relaxed">{useCase.description}</p>
                      
                      <ul className="space-y-2">
                        {useCase.features.map((feature, i) => (
                          <li key={i} className="flex items-start text-slate-300">
                            <CheckIcon className={`w-5 h-5 mr-2 mt-0.5 flex-shrink-0 ${
                              useCase.color === 'cyan' ? 'text-cyan-400' :
                              useCase.color === 'fuchsia' ? 'text-fuchsia-400' :
                              useCase.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
                            }`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Loved by Teams Worldwide
              </h2>
              <p className="text-lg text-slate-400">
                See what our customers are building with Karios AI
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]"
            >
              <motion.div
                variants={revealUp}
                className="md:col-span-2 md:row-span-2 group"
              >
                <motion.div
                  className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-8 backdrop-blur-xl flex flex-col justify-between"
                  whileHover={{ y: -4, borderColor: 'rgba(0,212,180,0.3)' }}
                >
                  <div>
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <SparklesIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xl md:text-2xl text-white leading-relaxed">
                      "Karios cut our AI costs by 85% while improving response quality. The multi-agent system handles our entire research pipeline autonomously, from data collection to report generation."
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white font-semibold">
                      SC
                    </div>
                    <div>
                      <div className="font-medium text-white">Sarah Chen</div>
                      <div className="text-sm text-slate-400">VP of Engineering, TechCorp</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                variants={revealUp}
                className="group"
              >
                <motion.div
                  className="h-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-xl flex flex-col justify-center items-center text-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-4xl font-bold text-emerald-400 mb-2">$50K</div>
                  <div className="text-slate-300">saved this quarter</div>
                </motion.div>
              </motion.div>

              <motion.div
                variants={revealUp}
                className="group"
              >
                <motion.div
                  className="h-full rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-6 backdrop-blur-xl flex flex-col justify-center items-center text-center"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-4xl font-bold text-fuchsia-400 mb-2">10x</div>
                  <div className="text-slate-300">faster research</div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-400">
                Start free, scale as you grow
              </p>

              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setActivePricingTab('monthly')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activePricingTab === 'monthly'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setActivePricingTab('annual')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    activePricingTab === 'annual'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Annual
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[{
                name: 'Free',
                price: activePricingTab === 'monthly' ? '$0' : '$0',
                period: 'forever',
                description: 'Perfect for trying out Karios',
                features: ['10 queries / month', 'Basic model routing', 'Community support', 'API access'],
                cta: 'Get Started',
                highlighted: false
              }, {
                name: 'Pro',
                price: activePricingTab === 'monthly' ? '$29' : '$23',
                period: '/month',
                description: 'For professionals and small teams',
                features: ['500 queries / month', 'Advanced routing', 'Priority support', 'Team collaboration', 'Custom agents'],
                cta: 'Start Free Trial',
                highlighted: true
              }, {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For organizations at scale',
                features: ['Unlimited queries', 'Dedicated infrastructure', 'SSO & RBAC', 'SLA guarantee', 'Custom integrations', 'Dedicated support'],
                cta: 'Contact Sales',
                highlighted: false
              }].map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={revealUp}
                  className={`rounded-2xl border p-8 backdrop-blur-xl transition-all ${
                    plan.highlighted
                      ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent scale-105 md:scale-110 z-10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  whileHover={!plan.highlighted ? { y: -4 } : {}}
                >
                  {plan.highlighted && (
                    <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
                      Most Popular
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                  
                  <motion.button
                    className={`w-full py-3 rounded-xl font-semibold transition-all mb-6 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
                  </motion.button>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-slate-300">
                        <CheckIcon className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-8">
              <a href="/pricing" className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors">
                Compare all features
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-slate-400">
                Everything you need to know about Karios AI
              </p>
            </motion.div>

            <motion.div
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              <FAQAccordion />
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={revealScale}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.35 }}
              className="rounded-3xl border border-white/15 bg-gradient-to-br from-cyan-400/15 via-fuchsia-400/10 to-violet-400/15 px-8 py-12 md:px-12 md:py-16 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.45)] text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-violet-500/5 animate-pulse" />
              
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
                  Ready to Save 90% on AI Costs?
                </h2>
                <p className="text-lg mb-8 text-slate-300 max-w-xl mx-auto">
                  Join thousands of developers, researchers, and teams using Karios AI to power their workflows
                </p>
                <div className="flex justify-center flex-wrap gap-4">
                  <motion.a
                    href="/signup"
                    className="inline-flex items-center rounded-xl bg-white px-8 py-4 font-semibold text-slate-900 transition-colors hover:bg-slate-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start Free Trial
                    <ArrowRightIcon className="ml-2 w-5 h-5" />
                  </motion.a>
                  <motion.a
                    href="/login"
                    className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.a>
                </div>
                <p className="text-sm text-slate-400 mt-6">No credit card required • Cancel anytime</p>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-[#03050c]/80 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4 text-white">Product</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="/features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="/demo" className="hover:text-white transition-colors">Demo</a></li>
                  <li><a href="/changelog" className="hover:text-white transition-colors">Changelog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Resources</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="/api" className="hover:text-white transition-colors">API Reference</a></li>
                  <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="/guides" className="hover:text-white transition-colors">Guides</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Company</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="/careers" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-white">Connect</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="/twitter" className="hover:text-white transition-colors">Twitter</a></li>
                  <li><a href="/github" className="hover:text-white transition-colors">GitHub</a></li>
                  <li><a href="/discord" className="hover:text-white transition-colors">Discord</a></li>
                  <li><a href="/linkedin" className="hover:text-white transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <SparklesIcon className="w-6 h-6 text-cyan-300 mr-2" />
                <span className="font-semibold">Karios AI</span>
              </div>
              <p className="text-slate-400 text-sm">&copy; 2024 Karios AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-24 right-6 z-40 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl text-white hover:bg-white/20 transition-all"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: showBackToTop ? 1 : 0, scale: showBackToTop ? 1 : 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUpIcon className="w-5 h-5" />
      </motion.button>

      <motion.button
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircleIcon className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default LandingV2;
