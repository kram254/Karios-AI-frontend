import React, { useRef, useState } from 'react';
import { Settings, GraduationCap, BarChart3, Bookmark, Minimize2, Maximize2, User, Database, Wrench, PlugZap, CreditCard, LogOut, Bot, MessageSquare, Activity, Receipt, FileText } from 'lucide-react';
import { CanvasPopover, CanvasPopoverItem } from './CanvasPopover';
import './canvas.css';

export interface CanvasConfig {
  model: string;
  tools: string[];
  execution: 'inline' | 'external';
  instructions: string;
  messages: number;
  deleteCount: number;
  theme: string;
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface UsageDataRow {
  model: string;
  inputTokens: number | string;
  outputTokens: number | string;
  cost: number | string;
}

interface CanvasTopBarProps {
  modelName?: string;
  tokenCount?: number | string;
  cost?: number | string;
  isLive?: boolean;
  isChatFullscreen?: boolean;
  onSettings?: () => void;
  onLearning?: () => void;
  onUsage?: () => void;
  onBookmark?: () => void;
  onToggleFullscreen?: () => void;
  className?: string;
  settingsItems?: CanvasPopoverItem[];
  learningItems?: CanvasPopoverItem[];
  usageItems?: CanvasPopoverItem[];
  onNavigate?: (path: string) => void;
  onConfigChange?: (config: CanvasConfig) => void;
  usageData?: UsageDataRow[];
  toolsUsageData?: UsageDataRow[];
}

const formatTokens = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '0';
  if (typeof value === 'string') return value;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toString();
};

const formatCost = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '$0.00';
  if (typeof value === 'string') return value.startsWith('$') ? value : `$${value}`;
  return `$${value.toFixed(2)}`;
};

type ActivePopover = 'settings' | 'learning' | 'usage' | null;

const navigateOr = (path: string, onNavigate?: (path: string) => void) => () => {
  if (onNavigate) {
    onNavigate(path);
  } else if (typeof window !== 'undefined') {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

export const CanvasTopBar: React.FC<CanvasTopBarProps> = ({
  modelName = 'Opus 4.7',
  tokenCount = 0,
  cost = 0,
  isLive = false,
  isChatFullscreen = false,
  onSettings,
  onLearning,
  onUsage,
  onBookmark,
  onToggleFullscreen,
  className = '',
  settingsItems,
  learningItems,
  usageItems,
  onNavigate,
  onConfigChange,
  usageData,
  toolsUsageData
}) => {
  const [active, setActive] = useState<ActivePopover>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const learningRef = useRef<HTMLButtonElement>(null);
  const usageRef = useRef<HTMLButtonElement>(null);

  const [learningTab, setLearningTab] = useState<'configuration' | 'learning' | 'usage'>('learning');
  const [configModel, setConfigModel] = useState<string>(() => { try { return JSON.parse(localStorage.getItem('karios_configModel') ?? 'null') ?? 'Gemini Pro 4.5'; } catch { return 'Gemini Pro 4.5'; } });
  const [configTools, setConfigTools] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('karios_configTools') ?? 'null') ?? ['Exa agents', 'Browser', 'Find Similar', 'Exa Answer', 'Exa Research']; } catch { return ['Exa agents', 'Browser', 'Find Similar', 'Exa Answer', 'Exa Research']; } });
  const [configExecution, setConfigExecution] = useState<'inline' | 'external'>(() => { try { return JSON.parse(localStorage.getItem('karios_configExecution') ?? 'null') ?? 'inline'; } catch { return 'inline'; } });
  const [configInstructions, setConfigInstructions] = useState<string>(() => { try { return JSON.parse(localStorage.getItem('karios_configInstructions') ?? 'null') ?? ''; } catch { return ''; } });
  const [configMessages, setConfigMessages] = useState<number>(() => { try { return JSON.parse(localStorage.getItem('karios_configMessages') ?? 'null') ?? 25; } catch { return 25; } });
  const [configDeleteCount, setConfigDeleteCount] = useState<number>(() => { try { return JSON.parse(localStorage.getItem('karios_configDeleteCount') ?? 'null') ?? 0; } catch { return 0; } });
  const [configTheme, setConfigTheme] = useState<string>(() => { try { return JSON.parse(localStorage.getItem('karios_configTheme') ?? 'null') ?? 'system'; } catch { return 'system'; } });
  const [configDensity, setConfigDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => { try { return JSON.parse(localStorage.getItem('karios_configDensity') ?? 'null') ?? 'comfortable'; } catch { return 'comfortable'; } });
  const [kbSkills, setKbSkills] = useState(true);
  const [kbMemories, setKbMemories] = useState(true);
  const [kbAgents, setKbAgents] = useState(false);
  const [genInsights, setGenInsights] = useState(true);
  const [usageSubTab, setUsageSubTab] = useState<'total' | 'tools'>('total');

  const openPopover = (which: ActivePopover, ref: React.RefObject<HTMLButtonElement>) => {
    if (active === which) {
      setActive(null);
      return;
    }
    if (ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect());
    }
    setActive(which);
  };

  const closePopover = () => setActive(null);

  const handleSettingsClick = () => {
    if (onSettings) {
      onSettings();
      return;
    }
    openPopover('settings', settingsRef);
  };

  const handleLearningClick = () => {
    if (onLearning) {
      onLearning();
      return;
    }
    openPopover('learning', learningRef);
  };

  const handleUsageClick = () => {
    if (onUsage) {
      onUsage();
      return;
    }
    openPopover('usage', usageRef);
  };

  const toggleTool = (tool: string) => {
    setConfigTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const handleApplyConfig = () => {
    try {
      localStorage.setItem('karios_configModel', JSON.stringify(configModel));
      localStorage.setItem('karios_configTools', JSON.stringify(configTools));
      localStorage.setItem('karios_configExecution', JSON.stringify(configExecution));
      localStorage.setItem('karios_configInstructions', JSON.stringify(configInstructions));
      localStorage.setItem('karios_configMessages', JSON.stringify(configMessages));
      localStorage.setItem('karios_configDeleteCount', JSON.stringify(configDeleteCount));
      localStorage.setItem('karios_configTheme', JSON.stringify(configTheme));
      localStorage.setItem('karios_configDensity', JSON.stringify(configDensity));
    } catch {}
    if (onConfigChange) {
      onConfigChange({
        model: configModel,
        tools: configTools,
        execution: configExecution,
        instructions: configInstructions,
        messages: configMessages,
        deleteCount: configDeleteCount,
        theme: configTheme,
        density: configDensity
      });
    }
  };

  const tokenLabel = formatTokens(tokenCount);
  const costLabel = formatCost(cost);

  const totalRows = usageData && usageData.length > 0
    ? usageData.map(row => ({
        model: row.model,
        input: formatTokens(row.inputTokens),
        output: formatTokens(row.outputTokens),
        cost: formatCost(row.cost)
      }))
    : [
        { model: modelName || 'Claude 3.7 Sonnet', input: tokenLabel, output: formatTokens(Math.floor(Number(tokenCount) * 0.35 || 0)), cost: costLabel },
        { model: 'o4 mini', input: '12.4k', output: '3.2k', cost: '$0.02' },
        { model: 'Gemini 2.5 Flash', input: '8.1k', output: '2.8k', cost: '$0.01' }
      ];

  const toolsRows = toolsUsageData && toolsUsageData.length > 0
    ? toolsUsageData.map(row => ({
        model: row.model,
        input: formatTokens(row.inputTokens),
        output: formatTokens(row.outputTokens),
        cost: formatCost(row.cost)
      }))
    : [
        { model: 'Web Search', input: '5.2k', output: '1.8k', cost: '$0.01' },
        { model: 'Code Executor', input: '3.1k', output: '0.9k', cost: '$0.00' },
        { model: 'Browser Tool', input: '8.4k', output: '2.2k', cost: '$0.01' }
      ];

  const defaultSettingsItems: CanvasPopoverItem[] = settingsItems || [
    { id: 'profile', label: 'Profile', icon: <User size={15} />, onClick: navigateOr('/profile', onNavigate) },
    { id: 'agents', label: 'Agent Teams', icon: <Bot size={15} />, onClick: navigateOr('/teams', onNavigate) },
    { id: 'integrations', label: 'Integrations', icon: <PlugZap size={15} />, onClick: navigateOr('/integrations', onNavigate) },
    { id: 'div-1', label: '', divider: true },
    { id: 'pricing', label: 'Pricing & Plans', icon: <CreditCard size={15} />, onClick: navigateOr('/pricing', onNavigate) },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} />, onClick: navigateOr('/settings', onNavigate) },
    { id: 'div-2', label: '', divider: true },
    { id: 'logout', label: 'Sign out', icon: <LogOut size={15} />, destructive: true, onClick: navigateOr('/login', onNavigate) }
  ];

  const defaultLearningItems: CanvasPopoverItem[] = learningItems || [
    { id: 'knowledge', label: 'Knowledge Base', icon: <Database size={15} />, onClick: navigateOr('/knowledge', onNavigate) },
    { id: 'skills', label: 'Skills', icon: <Activity size={15} />, onClick: navigateOr('/skills', onNavigate) },
    { id: 'tools', label: 'Tool Manager', icon: <Wrench size={15} />, onClick: navigateOr('/tools', onNavigate) },
    { id: 'div-1', label: '', divider: true },
    { id: 'qa', label: 'QA Dashboard', icon: <FileText size={15} />, onClick: navigateOr('/qa', onNavigate) },
    { id: 'agent-chat', label: 'Agent Chat', icon: <MessageSquare size={15} />, onClick: navigateOr('/chat', onNavigate) }
  ];

  const defaultUsageItems: CanvasPopoverItem[] = usageItems || [
    { id: 'tokens', label: 'Tokens used', icon: <Activity size={15} />, meta: tokenLabel },
    { id: 'cost', label: 'Cost so far', icon: <Receipt size={15} />, meta: costLabel },
    { id: 'model', label: 'Model', icon: <Bot size={15} />, meta: modelName },
    { id: 'div-1', label: '', divider: true },
    { id: 'analytics', label: 'Analytics dashboard', icon: <BarChart3 size={15} />, onClick: navigateOr('/analytics', onNavigate) },
    { id: 'billing', label: 'Billing & invoices', icon: <CreditCard size={15} />, onClick: navigateOr('/pricing', onNavigate) }
  ];

  return (
    <div className={`canvas-topbar ${className}`}>
      <div className="canvas-topbar-pill">
        <div className="canvas-topbar-model">
          <span className="canvas-topbar-model-name">{modelName}</span>
          <span className="canvas-topbar-tokens">{tokenLabel}</span>
          <span className="canvas-topbar-cost">{costLabel}</span>
        </div>

        <div className="canvas-topbar-live">
          <span className={`canvas-topbar-live-dot ${isLive ? '' : 'idle'}`} />
          <span>{isLive ? 'Live' : 'Idle'}</span>
        </div>

        {onBookmark && (
          <button
            className="canvas-topbar-icon-btn"
            onClick={onBookmark}
            aria-label="Bookmark"
            title="Bookmark"
          >
            <Bookmark size={15} />
          </button>
        )}

        <div className="canvas-topbar-divider" />

        <div className="canvas-topbar-actions">
          <button
            ref={settingsRef}
            className={`canvas-topbar-button ${active === 'settings' ? 'active' : ''}`}
            onClick={handleSettingsClick}
            aria-label="Settings"
            aria-expanded={active === 'settings'}
            aria-haspopup="menu"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
          <button
            ref={learningRef}
            className={`canvas-topbar-button ${active === 'learning' ? 'active' : ''}`}
            onClick={handleLearningClick}
            aria-label="Learning"
            aria-expanded={active === 'learning'}
            aria-haspopup="menu"
          >
            <GraduationCap size={14} />
            <span>Learning</span>
          </button>
          <button
            ref={usageRef}
            className={`canvas-topbar-button ${active === 'usage' ? 'active' : ''}`}
            onClick={handleUsageClick}
            aria-label="Usage"
            aria-expanded={active === 'usage'}
            aria-haspopup="menu"
          >
            <BarChart3 size={14} />
            <span>Usage</span>
          </button>
        </div>

        {onToggleFullscreen && (
          <>
            <div className="canvas-topbar-divider" />
            <button
              className="canvas-topbar-icon-btn"
              onClick={onToggleFullscreen}
              aria-label={isChatFullscreen ? 'Collapse chat' : 'Expand chat'}
              title={isChatFullscreen ? 'Collapse chat' : 'Expand chat'}
            >
              {isChatFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </>
        )}
      </div>

      <CanvasPopover
        open={active === 'settings'}
        onClose={closePopover}
        anchorRect={anchorRect}
        title="Settings"
        items={defaultSettingsItems}
      />

      <CanvasPopover
        open={active === 'learning'}
        onClose={closePopover}
        anchorRect={anchorRect}
        width={420}
      >
        <div className="karios-panel">
          <div className="karios-panel-tabs">
            {(['configuration', 'learning', 'usage'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setLearningTab(tab)}
                className={`karios-panel-tab ${learningTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {learningTab === 'configuration' && (
            <div className="karios-panel-body">
              <div>
                <div className="karios-section-label">Model</div>
                <select
                  value={configModel}
                  onChange={e => setConfigModel(e.target.value)}
                  className="karios-form-select"
                >
                  {['Gemini Pro 4.5', 'Claude Sonnet 3.7', 'Claude Opus 4.7', 'GPT-4o', 'o4 mini', 'Gemini 2.5 Flash'].map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="karios-section-label">Tools</div>
                <div className="karios-tool-pills">
                  {['Exa agents', 'Browser', 'Find Similar', 'Exa Answer', 'Exa Research', 'Exa Welcome'].map(tool => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`karios-tool-pill ${configTools.includes(tool) ? 'active' : ''}`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
              <div className="karios-form-row">
                <div className="karios-form-field">
                  <div className="karios-section-label" style={{ marginBottom: '4px' }}>Messages</div>
                  <input
                    type="number"
                    value={configMessages}
                    onChange={e => setConfigMessages(Number(e.target.value))}
                    className="karios-form-input"
                  />
                </div>
                <div className="karios-form-field">
                  <div className="karios-section-label" style={{ marginBottom: '4px' }}>Delete</div>
                  <input
                    type="number"
                    value={configDeleteCount}
                    onChange={e => setConfigDeleteCount(Number(e.target.value))}
                    className="karios-form-input"
                  />
                </div>
              </div>
              <div>
                <div className="karios-section-label">Execution</div>
                <div className="karios-exec-toggle">
                  {(['inline', 'external'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setConfigExecution(opt)}
                      className={`karios-exec-btn ${configExecution === opt ? 'active' : ''}`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="karios-section-label" style={{ marginBottom: '4px' }}>Instructions</div>
                <textarea
                  value={configInstructions}
                  onChange={e => setConfigInstructions(e.target.value)}
                  placeholder="Add instructions for this agent..."
                  rows={3}
                  className="karios-form-textarea"
                />
              </div>
              <div>
                <div className="karios-section-label">Visual</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Theme</div>
                    <div className="karios-exec-toggle">
                      {(['system', 'light', 'dark'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConfigTheme(opt)}
                          className={`karios-exec-btn ${configTheme === opt ? 'active' : ''}`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Density</div>
                    <div className="karios-exec-toggle">
                      {(['compact', 'comfortable', 'spacious'] as const).map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setConfigDensity(opt)}
                          className={`karios-exec-btn ${configDensity === opt ? 'active' : ''}`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="karios-panel-actions">
                <button
                  type="button"
                  className="karios-btn-primary"
                  onClick={handleApplyConfig}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="karios-btn-secondary"
                  onClick={() => navigateOr('/integrations', onNavigate)()}
                >
                  Connect apps
                </button>
              </div>
            </div>
          )}

          {learningTab === 'learning' && (
            <div className="karios-panel-body-scroll">
              <div className="karios-knowledge-section">
                <div className="karios-section-label-lg">Knowledge</div>
                {([
                  { label: 'Skills', value: kbSkills, setter: setKbSkills },
                  { label: 'Memories', value: kbMemories, setter: setKbMemories },
                  { label: 'Agents', value: kbAgents, setter: setKbAgents }
                ] as { label: string; value: boolean; setter: React.Dispatch<React.SetStateAction<boolean>> }[]).map(({ label, value, setter }) => (
                  <div key={label} className="karios-toggle-row">
                    <span className="karios-toggle-label">{label}</span>
                    <button
                      type="button"
                      onClick={() => setter(!value)}
                      className={`karios-toggle ${value ? 'on' : ''}`}
                    >
                      <span className="karios-toggle-thumb" style={{ left: value ? '18px' : '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="karios-section-block">
                <div className="karios-section-label">Semantic Filters</div>
                <input
                  type="text"
                  placeholder="Filter by topic or context..."
                  className="karios-form-input"
                />
              </div>
              <div className="karios-section-block-sm">
                <div className="karios-section-label-lg">Generation</div>
                <div className="karios-toggle-row-plain">
                  <span className="karios-toggle-label">Insights</span>
                  <button
                    type="button"
                    onClick={() => setGenInsights(!genInsights)}
                    className={`karios-toggle ${genInsights ? 'on' : ''}`}
                  >
                    <span className="karios-toggle-thumb" style={{ left: genInsights ? '18px' : '2px' }} />
                  </button>
                </div>
              </div>
              <div className="karios-insight-section">
                <div className="karios-section-label-lg">Recent Insights</div>
                {[
                  { id: 'ins1', badge: 'Memory', text: 'User prefers concise responses with bullet points when answering complex questions.', time: '2h ago' },
                  { id: 'ins2', badge: 'Memory', text: "Learned user's tech stack: React frontend + Python backend. Recall this for code examples.", time: '4h ago' },
                  { id: 'ins3', badge: 'Skill', text: 'Identified pattern: user frequently asks for data visualizations. Enhance this capability.', time: '1d ago' }
                ].map(ins => (
                  <div key={ins.id} className="karios-insight-card">
                    <div className="karios-insight-header">
                      <span className="karios-insight-badge">{ins.badge}</span>
                      <span className="karios-insight-time">{ins.time}</span>
                    </div>
                    <p className="karios-insight-text">{ins.text}</p>
                    <div className="karios-insight-actions">
                      <button type="button" className="karios-insight-dismiss">Dismiss</button>
                      <button type="button" className="karios-insight-apply">Apply</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {learningTab === 'usage' && (
            <div>
              <div className="karios-usage-breakdown-header">
                <div className="karios-usage-breakdown-title">
                  Usage Breakdown: <span className="karios-usage-breakdown-cost">{costLabel}</span>
                </div>
              </div>
              <div className="karios-usage-scroll">
                <table className="karios-usage-table">
                  <thead>
                    <tr>
                      <th>Model</th>
                      <th>Input</th>
                      <th>Output</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalRows.map((row, i) => (
                      <tr key={i} className="karios-usage-row">
                        <td>{row.model}</td>
                        <td>{row.input}</td>
                        <td>{row.output}</td>
                        <td>{row.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="karios-usage-footer">
                <span className="karios-usage-total-label">Total: {tokenLabel} tokens</span>
                <span className="karios-usage-total-cost">{costLabel}</span>
              </div>
            </div>
          )}
        </div>
      </CanvasPopover>

      <CanvasPopover
        open={active === 'usage'}
        onClose={closePopover}
        anchorRect={anchorRect}
        width={420}
      >
        <div>
          <div className="karios-usage-header">
            <div className="karios-usage-title">
              Usage Breakdown: <span className="karios-usage-title-cost">{costLabel}</span>
            </div>
            <div className="karios-usage-subtabs">
              {(['total', 'tools'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setUsageSubTab(tab)}
                  className={`karios-usage-subtab ${usageSubTab === tab ? 'active' : ''}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="karios-usage-scroll">
            <table className="karios-usage-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Input</th>
                  <th>Output</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {(usageSubTab === 'total' ? totalRows : toolsRows).map((row, i) => (
                  <tr key={i} className="karios-usage-row">
                    <td>{row.model}</td>
                    <td>{row.input}</td>
                    <td>{row.output}</td>
                    <td>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="karios-usage-footer">
            <span className="karios-usage-total-label">Total: {tokenLabel} tokens</span>
            <span className="karios-usage-total-cost">{costLabel}</span>
          </div>
        </div>
      </CanvasPopover>
    </div>
  );
};

export default CanvasTopBar;
