import React, { useEffect, useState } from 'react';
import { X, Settings as SettingsIcon, Shield, Wrench, TrendingUp, Brain, Lock, Bell, Languages, ChevronDown, Zap, Key, Link2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../services/notifications';
import { languages, useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../i18n';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api/index';
import { UserRole } from '../types/user';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// *Modified* Updated tab configuration with new icons and sections
const tabs = [
  { id: 'general', title: 'general', icon: <SettingsIcon className="w-5 h-5" /> },
  { id: 'ai', title: 'ai_settings', icon: <Brain className="w-5 h-5" /> },
  { id: 'byok', title: 'byok', icon: <Key className="w-5 h-5" /> },
  { id: 'agents', title: 'agent_integrations', icon: <Zap className="w-5 h-5" /> },
  { id: 'security', title: 'security', icon: <Shield className="w-5 h-5" /> },
] as const;

type ByokProviderKey = 'openai' | 'anthropic' | 'gemini' | 'moonshot' | 'deepseek' | 'perplexity' | 'nvidia';

type ByokProviderConfig = {
  enabled: boolean;
  api_key: string;
  default_model: string;
  base_url?: string;
};

type ByokProviderDefinition = {
  key: ByokProviderKey;
  label: string;
  guidance: string;
  limitations: string[];
  suggestions: string[];
  supportsBaseUrl: boolean;
  baseUrl?: string;
};

type AgentIntegrationKey = 'claude_code' | 'codex' | 'pi_agent' | 'openrouter' | 'hermes_agent';

type AgentIntegrationConfig = {
  enabled: boolean;
  api_key: string;
  default_model: string;
  base_url?: string;
};

const byokProviderDefinitions: ByokProviderDefinition[] = [
  {
    key: 'openai',
    label: 'OpenAI',
    guidance: 'Token usage is billed by OpenAI. Smaller models are usually cheaper, while larger models generally use more input and output tokens.',
    limitations: ['Large models can raise costs quickly on long chats.', 'Short-context models may need more prompt pruning.'],
    suggestions: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    supportsBaseUrl: true,
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    key: 'anthropic',
    label: 'Anthropic',
    guidance: 'Claude pricing is token-based. Higher-capability models usually cost more per token and may generate longer outputs.',
    limitations: ['Very long outputs can increase token spend.', 'Some tasks may need careful prompting for strict formatting.'],
    suggestions: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-opus-4-1'],
    supportsBaseUrl: false,
  },
  {
    key: 'gemini',
    label: 'Google Gemini',
    guidance: 'Gemini pricing depends on the model and token volume. Long-context models can consume more tokens for the same task.',
    limitations: ['Long context can increase usage and latency.', 'Model behavior can vary between fast and pro tiers.'],
    suggestions: ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-pro'],
    supportsBaseUrl: false,
  },
  {
    key: 'moonshot',
    label: 'Moonshot',
    guidance: 'Moonshot usage is model and token dependent. More capable models generally cost more and may use longer contexts.',
    limitations: ['Some model names may change between releases.', 'Long context usage can raise token consumption.'],
    suggestions: ['moonshot-v1-32k', 'kimi-k2.5', 'moonshot-v1-128k'],
    supportsBaseUrl: true,
    baseUrl: 'https://api.moonshot.cn/v1',
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    guidance: 'DeepSeek billing is tied to the chosen model and tokens used. Smaller models are usually more cost efficient.',
    limitations: ['Reasoning-heavy models may be slower.', 'Some model variants may need tighter prompts for predictable formatting.'],
    suggestions: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-v3'],
    supportsBaseUrl: true,
    baseUrl: 'https://api.deepseek.com/v1',
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    guidance: 'Perplexity search models can use more tokens because retrieval context is added before the answer is generated.',
    limitations: ['Search-enriched answers can cost more tokens.', 'Retrieval-heavy prompts may add latency.'],
    suggestions: ['sonar', 'sonar-pro', 'sonar-deep-research'],
    supportsBaseUrl: false,
  },
  {
    key: 'nvidia',
    label: 'NVIDIA NIM',
    guidance: 'NVIDIA NIM pricing depends on the catalog model and context size. Larger models and longer prompts typically cost more.',
    limitations: ['Model availability depends on the catalog route.', 'Some catalog models may have different context limits.'],
    suggestions: ['moonshotai/kimi-k2.5', 'meta/llama3-8b-instruct', 'meta/llama3-70b-instruct'],
    supportsBaseUrl: true,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
  },
];

const createDefaultByokProviders = (): Record<ByokProviderKey, ByokProviderConfig> => {
  return byokProviderDefinitions.reduce((acc, provider) => {
    acc[provider.key] = {
      enabled: true,
      api_key: '',
      default_model: provider.suggestions[0] ?? '',
      ...(provider.supportsBaseUrl ? { base_url: provider.baseUrl ?? '' } : {}),
    };
    return acc;
  }, {} as Record<ByokProviderKey, ByokProviderConfig>);
};

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [selectedRole, setSelectedRole] = useState('support');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Record<string, boolean>>({});

  const [byokEnabled, setByokEnabled] = useState(false);
  const [byokSelectedProvider, setByokSelectedProvider] = useState<ByokProviderKey | 'env'>('env');
  const [byokProviders, setByokProviders] = useState<Record<ByokProviderKey, ByokProviderConfig>>(createDefaultByokProviders);

  const createDefaultAgentIntegrations = (): Record<AgentIntegrationKey, AgentIntegrationConfig> => ({
    claude_code: { enabled: false, api_key: '', default_model: 'claude-sonnet-4-5' },
    codex: { enabled: false, api_key: '', default_model: 'gpt-4.1' },
    pi_agent: { enabled: false, api_key: '', default_model: 'anthropic/claude-sonnet-4-5', base_url: '' },
    openrouter: { enabled: false, api_key: '', default_model: 'openai/gpt-4o-mini', base_url: 'https://openrouter.ai/api/v1' },
    hermes_agent: { enabled: false, api_key: '', default_model: 'hermes-2-pro', base_url: '' },
  });

  const [agentIntegrations, setAgentIntegrations] = useState<Record<AgentIntegrationKey, AgentIntegrationConfig>>(createDefaultAgentIntegrations);

  const updateAgentIntegration = (key: AgentIntegrationKey, updates: Partial<AgentIntegrationConfig>) => {
    setAgentIntegrations((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...updates,
      },
    }));
  };

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let active = true;

    const loadSettings = async () => {
      try {
        const response = await api.get('/api/v1/agents/config', { params: { userId: user.id } });
        const agentConfig = response.data;
        if (!active || !agentConfig || typeof agentConfig !== 'object') return;

        if (agentConfig.role) setSelectedRole(agentConfig.role ?? 'support');
        if (typeof agentConfig.temperature === 'number') setTemperature(agentConfig.temperature);
        if (typeof agentConfig.maxTokens === 'number') setMaxTokens(agentConfig.maxTokens);
        if (typeof agentConfig.notifications === 'boolean') setNotifications(agentConfig.notifications);
        if (typeof agentConfig.autoSave === 'boolean') setAutoSave(agentConfig.autoSave);

        const byok = agentConfig.byok;
        if (byok && typeof byok === 'object') {
          const selectedProvider: ByokProviderKey | 'env' = typeof byok.selected_provider === 'string' && byok.selected_provider.trim()
            ? (byok.selected_provider.trim().toLowerCase() as ByokProviderKey | 'env')
            : 'env';
          setByokEnabled(Boolean(byok.enabled));
          setByokSelectedProvider(selectedProvider);

          const incomingProviders = byok.providers && typeof byok.providers === 'object' ? byok.providers : {};
          const nextProviders = createDefaultByokProviders();

          for (const provider of byokProviderDefinitions) {
            const incoming = incomingProviders[provider.key];
            if (!incoming || typeof incoming !== 'object') continue;

            nextProviders[provider.key] = {
              enabled: incoming.enabled ?? true,
              api_key: typeof incoming.api_key === 'string' ? incoming.api_key : '',
              default_model: incoming.default_model ?? nextProviders[provider.key].default_model,
              ...(provider.supportsBaseUrl ? { base_url: incoming.base_url ?? nextProviders[provider.key].base_url ?? provider.baseUrl ?? '' } : {}),
            };
          }

          setByokProviders(nextProviders);
        }

        const agentIntegrationsData = agentConfig.agent_integrations;
        if (agentIntegrationsData && typeof agentIntegrationsData === 'object') {
          const nextIntegrations = createDefaultAgentIntegrations();
          const agentKeys: AgentIntegrationKey[] = ['claude_code', 'codex', 'pi_agent', 'openrouter', 'hermes_agent'];
          for (const key of agentKeys) {
            const incoming = agentIntegrationsData[key];
            if (!incoming || typeof incoming !== 'object') continue;
            nextIntegrations[key] = {
              enabled: incoming.enabled ?? false,
              api_key: typeof incoming.api_key === 'string' ? incoming.api_key : '',
              default_model: typeof incoming.default_model === 'string' ? incoming.default_model : nextIntegrations[key].default_model,
              ...(nextIntegrations[key].base_url !== undefined ? { base_url: typeof incoming.base_url === 'string' ? incoming.base_url : nextIntegrations[key].base_url } : {}),
            };
          }
          setAgentIntegrations(nextIntegrations);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();

    return () => {
      active = false;
    };
  }, [isOpen, user?.id]);

  const updateProviderConfig = (providerKey: ByokProviderKey, updates: Partial<ByokProviderConfig>) => {
    setByokProviders((current) => ({
      ...current,
      [providerKey]: {
        ...current[providerKey],
        ...updates,
      },
    }));
  };

  // *Modified* Role cards with translations
  const roleCards = [
    { id: 'support', name: t('focused'), icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'creative', name: t('creative'), icon: <Wrench className="w-5 h-5" /> },
  ];

  // *Modified* Removed draggable functionality as it's not needed
  const handleSaveSettings = async () => {
    try {
      if (!user?.id) {
        notify.error('Unable to save settings without a signed-in user');
        return;
      }

      const settingsData = {
        role: selectedRole,
        temperature,
        maxTokens,
        language: language.code,
        notifications,
        autoSave,
        byok: {
          enabled: byokEnabled,
          selected_provider: byokSelectedProvider,
          providers: byokProviders,
        },
        agent_integrations: agentIntegrations,
      };

      await api.post('/api/v1/agents/config', {
        userId: user.id,
        ...settingsData,
      });

      notify.success('Settings saved successfully');
      onClose();
    } catch (error) {
      notify.error('Error saving settings');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[800px] neon-card overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 neon-section-header">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-white/70 neon-icon" />
              <h2 className="text-xl font-bold">{t('settings')}</h2>
            </div>
            <button
              onClick={onClose}
              className="neon-btn-secondary p-2 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/10 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'neon-tab-active'
                      : 'neon-tab-inactive'
                  }`}
                >
                  {tab.icon}
                  <span>{t(tab.title)}</span>
                </button>
              ))}
              {user && [UserRole.SUPER_ADMIN, UserRole.RESELLER, UserRole.CUSTOMER].includes(user.role) && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/autonomous-tasks');
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors neon-btn-secondary"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Task Builder</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/tools');
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg transition-colors neon-btn-secondary"
                  >
                    <Wrench className="w-5 h-5" />
                    <span>Tool Manager</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  {/* Language Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('language')}</h3>
                    <div className="relative">
                      <button
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className="w-full flex items-center justify-between p-4 neon-input"
                      >
                        <div className="flex items-center space-x-3">
                          <Languages className="w-5 h-5 text-white/70 neon-icon" />
                          <span className="mr-2">{language.flag}</span>
                          <span>{language.name}</span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isLanguageDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 neon-card shadow-lg z-10 max-h-60 overflow-y-auto">
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setLanguage(lang);
                                setIsLanguageDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 flex items-center neon-btn-secondary transition-colors ${language.code === lang.code ? 'neon-tab-active' : ''}`}
                            >
                              <span className="mr-2">{lang.flag}</span>
                              <span>{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('notifications')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 neon-card">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-white/70 neon-icon" />
                          <div>
                            <p className="font-medium">{t('push_notifications')}</p>
                            <p className="text-sm text-gray-400">{t('get_notified_about_new_messages')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications(!notifications)}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            notifications ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              notifications ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-8">
                  {/* Role Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('ai_role')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {roleCards.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className={`p-4 rounded-lg transition-colors ${
                            selectedRole === role.id
                              ? 'neon-btn-primary'
                              : 'neon-btn-secondary'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {role.icon}
                            <span>{role.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('response_style')}</h3>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>{t('focused')}</span>
                      <span>{t('creative')}</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('response_length')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[1024, 2048, 4096].map((tokens) => (
                        <button
                          key={tokens}
                          onClick={() => setMaxTokens(tokens)}
                          className={`p-3 rounded-lg ${
                            maxTokens === tokens
                              ? 'neon-btn-primary'
                              : 'neon-btn-secondary'
                          }`}
                        >
                          <span>{tokens}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'byok' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Bring Your Own Keys (BYOK)</h3>
                      <button
                        onClick={() => setByokEnabled(!byokEnabled)}
                        className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                          byokEnabled ? 'neon-toggle-thumb' : ''
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full transition-transform ${
                            byokEnabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400">
                      Use your own API keys for AI providers. Your keys stay private to your session and are stored separately from the platform defaults.
                    </p>
                    <div className="p-4 rounded-lg border border-white/10 bg-black/20 text-sm text-gray-300 space-y-2">
                      <p>Model choice is editable for every provider below.</p>
                      <p>Token usage and charges depend on the provider and the model you choose. Larger or more capable models usually cost more and can use more tokens.</p>
                    </div>
                    {!byokEnabled && (
                      <p className="text-sm text-emerald-400">
                        Enable BYOK to configure provider-specific keys and model defaults.
                      </p>
                    )}
                  </div>

                  {byokEnabled && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-md font-medium mb-3">Active Provider</h4>
                        <select
                          value={byokSelectedProvider}
                          onChange={(e) => setByokSelectedProvider(e.target.value as ByokProviderKey | 'env')}
                          className="w-full p-3 neon-input rounded-lg"
                        >
                          <option value="env">Use Platform Keys (Default)</option>
                          {byokProviderDefinitions.map((provider) => (
                            <option key={provider.key} value={provider.key}>
                              {provider.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-2">
                          This selects the preferred provider. You can still edit the default model for every provider.
                        </p>
                      </div>

                      {(() => {
                        const provider = byokProviderDefinitions.find((item) => item.key === byokSelectedProvider);
                        if (!provider) {
                          return (
                            <div className="p-4 rounded-lg border border-white/10 bg-black/20 text-sm text-gray-400">
                              Select a provider to view its configuration.
                            </div>
                          );
                        }

                        const config = byokProviders[provider.key] ?? createDefaultByokProviders()[provider.key];

                        return (
                          <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h4 className="text-md font-medium">{provider.label}</h4>
                                <p className="text-sm text-gray-400">{provider.guidance}</p>
                              </div>
                              <button
                                onClick={() => updateProviderConfig(provider.key, { enabled: !config.enabled })}
                                className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                                  config.enabled ? 'neon-toggle-thumb' : ''
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full transition-transform ${
                                    config.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">API Key</label>
                                <input
                                  type="password"
                                  value={config.api_key}
                                  onChange={(e) => updateProviderConfig(provider.key, { api_key: e.target.value })}
                                  placeholder={`Enter your ${provider.label} API key`}
                                  className="w-full p-3 neon-input rounded-lg"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Leave this blank to keep the saved key. Your API key is protected and only used for your account.
                                </p>
                              </div>

                              {provider.supportsBaseUrl && (
                                <div>
                                  <label className="block text-sm font-medium mb-2">Base URL</label>
                                  <input
                                    type="text"
                                    value={config.base_url || ''}
                                    onChange={(e) => updateProviderConfig(provider.key, { base_url: e.target.value })}
                                    placeholder={provider.baseUrl ?? 'https://api.provider.com/v1'}
                                    className="w-full p-3 neon-input rounded-lg"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium mb-2">Default Model</label>
                                <input
                                  type="text"
                                  list={`${provider.key}-model-suggestions`}
                                  value={config.default_model}
                                  onChange={(e) => updateProviderConfig(provider.key, { default_model: e.target.value })}
                                  placeholder={provider.suggestions[0] ?? 'Enter a model name'}
                                  className="w-full p-3 neon-input rounded-lg"
                                />
                                <datalist id={`${provider.key}-model-suggestions`}>
                                  {provider.suggestions.map((suggestion) => (
                                    <option key={suggestion} value={suggestion} />
                                  ))}
                                </datalist>
                                <p className="text-xs text-gray-500 mt-1">
                                  You can type any model identifier supported by this provider.
                                </p>
                              </div>

                              <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2">
                                <p className="text-sm font-medium text-white">Where this model can be difficult</p>
                                <ul className="space-y-1 text-xs text-gray-400 list-disc pl-5">
                                  {provider.limitations.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Agent Integrations</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Configure external agent integrations for specialized coding and automation tasks.
                    </p>
                    <button
                      onClick={() => setShowIntegrationsModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-all hover:bg-emerald-600/30 hover:border-emerald-500/50 mb-6"
                    >
                      <Link2 className="w-4 h-4" />
                      Connect your integrations
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Claude Code */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-md font-medium">Claude Code</h4>
                          <p className="text-sm text-gray-400">Anthropics CLI coding agent for local codebase work. Requires Anthropic API key and runs locally.</p>
                        </div>
                        <button
                          onClick={() => updateAgentIntegration('claude_code', { enabled: !agentIntegrations.claude_code.enabled })}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            agentIntegrations.claude_code.enabled ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              agentIntegrations.claude_code.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      {agentIntegrations.claude_code.enabled && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input
                              type="password"
                              value={agentIntegrations.claude_code.api_key}
                              onChange={(e) => updateAgentIntegration('claude_code', { api_key: e.target.value })}
                              placeholder="Enter your Anthropic API key"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Default Model</label>
                            <input
                              type="text"
                              value={agentIntegrations.claude_code.default_model}
                              onChange={(e) => updateAgentIntegration('claude_code', { default_model: e.target.value })}
                              placeholder="claude-sonnet-4-5"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2">
                            <p className="text-sm font-medium text-white">Requirements</p>
                            <ul className="space-y-1 text-xs text-gray-400 list-disc pl-5">
                              <li>Requires local CLI installation: npm install -g @anthropic-ai/claude-code</li>
                              <li>Runs commands locally with shell access</li>
                              <li>Requires Anthropic API key with sufficient quota</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* OpenAI Codex */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-md font-medium">OpenAI Codex</h4>
                          <p className="text-sm text-gray-400">OpenAIs coding agent for building, testing, and shipping code. Available as CLI, IDE extension, or cloud.</p>
                        </div>
                        <button
                          onClick={() => updateAgentIntegration('codex', { enabled: !agentIntegrations.codex.enabled })}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            agentIntegrations.codex.enabled ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              agentIntegrations.codex.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      {agentIntegrations.codex.enabled && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input
                              type="password"
                              value={agentIntegrations.codex.api_key}
                              onChange={(e) => updateAgentIntegration('codex', { api_key: e.target.value })}
                              placeholder="Enter your OpenAI API key"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Default Model</label>
                            <input
                              type="text"
                              value={agentIntegrations.codex.default_model}
                              onChange={(e) => updateAgentIntegration('codex', { default_model: e.target.value })}
                              placeholder="gpt-4.1"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2">
                            <p className="text-sm font-medium text-white">Requirements</p>
                            <ul className="space-y-1 text-xs text-gray-400 list-disc pl-5">
                              <li>CLI requires local installation: npm install -g @openai/codex</li>
                              <li>Cloud version requires ChatGPT Plus/Pro subscription</li>
                              <li>Some features limited when using API key vs ChatGPT account</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pi Agent */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-md font-medium">Pi Agent</h4>
                          <p className="text-sm text-gray-400">Open source AI coding agent toolkit with rich tooling support.</p>
                        </div>
                        <button
                          onClick={() => updateAgentIntegration('pi_agent', { enabled: !agentIntegrations.pi_agent.enabled })}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            agentIntegrations.pi_agent.enabled ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              agentIntegrations.pi_agent.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      {agentIntegrations.pi_agent.enabled && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input
                              type="password"
                              value={agentIntegrations.pi_agent.api_key}
                              onChange={(e) => updateAgentIntegration('pi_agent', { api_key: e.target.value })}
                              placeholder="Enter your API key"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Base URL (Optional)</label>
                            <input
                              type="text"
                              value={agentIntegrations.pi_agent.base_url}
                              onChange={(e) => updateAgentIntegration('pi_agent', { base_url: e.target.value })}
                              placeholder="https://api.provider.com/v1"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Default Model</label>
                            <input
                              type="text"
                              value={agentIntegrations.pi_agent.default_model}
                              onChange={(e) => updateAgentIntegration('pi_agent', { default_model: e.target.value })}
                              placeholder="anthropic/claude-sonnet-4-5"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2">
                            <p className="text-sm font-medium text-white">Requirements</p>
                            <ul className="space-y-1 text-xs text-gray-400 list-disc pl-5">
                              <li>Requires local installation: npm install -g @mariozechner/pi-coding-agent</li>
                              <li>Supports many providers but requires compatible API key</li>
                              <li>Uses JSON-RPC for programmatic integration</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* OpenRouter */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-md font-medium">OpenRouter</h4>
                          <p className="text-sm text-gray-400">Routes to many upstream models with unified API access.</p>
                        </div>
                        <button
                          onClick={() => updateAgentIntegration('openrouter', { enabled: !agentIntegrations.openrouter.enabled })}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            agentIntegrations.openrouter.enabled ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              agentIntegrations.openrouter.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      {agentIntegrations.openrouter.enabled && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input
                              type="password"
                              value={agentIntegrations.openrouter.api_key}
                              onChange={(e) => updateAgentIntegration('openrouter', { api_key: e.target.value })}
                              placeholder="Enter your OpenRouter API key"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Base URL (Optional)</label>
                            <input
                              type="text"
                              value={agentIntegrations.openrouter.base_url}
                              onChange={(e) => updateAgentIntegration('openrouter', { base_url: e.target.value })}
                              placeholder="https://openrouter.ai/api/v1"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Default Model</label>
                            <input
                              type="text"
                              value={agentIntegrations.openrouter.default_model}
                              onChange={(e) => updateAgentIntegration('openrouter', { default_model: e.target.value })}
                              placeholder="openai/gpt-4o-mini"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2">
                            <p className="text-sm font-medium text-white">Limitations</p>
                            <ul className="space-y-1 text-xs text-gray-400 list-disc pl-5">
                              <li>Availability and rate limits vary by upstream model</li>
                              <li>Tool support and context size depend on the routed model</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hermes Agent */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-black/20 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-md font-medium">Hermes Agent</h4>
                          <p className="text-sm text-gray-400">Lightweight agent integration for Hermes-based workflows.</p>
                        </div>
                        <button
                          onClick={() => updateAgentIntegration('hermes_agent', { enabled: !agentIntegrations.hermes_agent.enabled })}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            agentIntegrations.hermes_agent.enabled ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              agentIntegrations.hermes_agent.enabled ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                      {agentIntegrations.hermes_agent.enabled && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                          <div>
                            <label className="block text-sm font-medium mb-2">API Key</label>
                            <input
                              type="password"
                              value={agentIntegrations.hermes_agent.api_key}
                              onChange={(e) => updateAgentIntegration('hermes_agent', { api_key: e.target.value })}
                              placeholder="Enter your API key"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Base URL (Optional)</label>
                            <input
                              type="text"
                              value={agentIntegrations.hermes_agent.base_url}
                              onChange={(e) => updateAgentIntegration('hermes_agent', { base_url: e.target.value })}
                              placeholder="https://api.hermes.example.com/v1"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Default Model</label>
                            <input
                              type="text"
                              value={agentIntegrations.hermes_agent.default_model}
                              onChange={(e) => updateAgentIntegration('hermes_agent', { default_model: e.target.value })}
                              placeholder="hermes-2-pro"
                              className="w-full p-3 neon-input rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('privacy')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 neon-card">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-5 h-5 text-white/70 neon-icon" />
                          <div>
                            <p className="font-medium">{t('auto_save_conversations')}</p>
                            <p className="text-sm text-gray-400">{t('save_chat_history_automatically')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAutoSave(!autoSave)}
                          className={`w-12 h-6 rounded-full neon-toggle-track transition-colors ${
                            autoSave ? 'neon-toggle-thumb' : ''
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full transition-transform ${
                              autoSave ? 'translate-x-7 neon-toggle-thumb' : 'translate-x-1 bg-gray-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/10">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 neon-btn-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 neon-btn-primary"
              >
                {t('save_changes')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showIntegrationsModal && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIntegrationsModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-[680px] max-h-[80vh] rounded-xl bg-[#0c0c14] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-lg font-semibold">Integrations</h3>
                <p className="text-sm text-gray-400 mt-1">Connect services and data warehouses for your agent.</p>
              </div>
              <button onClick={() => setShowIntegrationsModal(false)} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-6">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-gray-300">Connection Status</span>
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {Object.values(connectedIntegrations).filter(Boolean).length} connected
                </span>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Featured</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'slack', name: 'Slack', desc: 'Messaging and notifications', icon: '💬' },
                    { id: 'github', name: 'GitHub', desc: 'Code repositories and PRs', icon: '🐙' },
                    { id: 'notion', name: 'Notion', desc: 'Notes and documentation', icon: '📝' },
                    { id: 'airtable', name: 'Airtable', desc: 'Database and spreadsheets', icon: '📊' },
                    { id: 'google_drive', name: 'Google Drive', desc: 'File storage and docs', icon: '📁' },
                    { id: 'jira', name: 'Jira', desc: 'Project management', icon: '📋' },
                    { id: 'hubspot', name: 'HubSpot', desc: 'CRM and marketing', icon: '🎯' },
                    { id: 'gmail', name: 'Gmail', desc: 'Email integration', icon: '📧' },
                  ].map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{integration.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setConnectedIntegrations(prev => ({ ...prev, [integration.id]: !prev[integration.id] }));
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          connectedIntegrations[integration.id]
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {connectedIntegrations[integration.id] ? 'Connected' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Custom</h4>
                <div className="p-4 rounded-lg border border-dashed border-white/10 text-center">
                  <p className="text-sm text-gray-500">Connect to a custom MCP server or API</p>
                  <button className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    Add custom integration
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};