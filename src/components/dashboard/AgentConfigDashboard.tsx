import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Bot, Clock3, Plus, Save, RotateCcw, X } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '../../types/user';
import { useNavigate } from 'react-router-dom';
import { monitoringService } from '../../services/api/monitoring.service';
import { userService } from '../../services/api/user.service';
import { api } from '../../services/api/index';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { cn } from '../../utils/cn';

// Using ReactElement | null return type to properly handle conditional rendering
const AgentConfigDashboard = (): React.ReactElement | null => {
    // Get user role from auth context
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Loading and metrics state
    const [loading, setLoading] = useState(true);
    const [agentMetrics, setAgentMetrics] = useState({
        activeAgents: 0,
        successRate: 0,
        averageResponseTime: 0
    });
    
    // Notification state
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    
    // Agent Type Configuration state
    const [agentRole, setAgentRole] = useState<string>('customer_support');
    
    // Generation Parameters state
    const [temperature, setTemperature] = useState<number>(0.7);
    const [maxTokens, setMaxTokens] = useState<number>(200);
    const [topP, setTopP] = useState<number>(0.3);
    
    // Knowledge Access state
    const [respondOnlyIfFound, setRespondOnlyIfFound] = useState<boolean>(true);
    
    // Fetch agent metrics when component mounts
    useEffect(() => {
        const fetchAgentMetrics = async () => {
            try {
                setLoading(true);
                
                // Get current user
                const userResponse = await userService.getCurrentUser();
                const userId = userResponse.data.id;
                
                // Fetch agent performance metrics
                const currentDate = new Date();
                const pastDate = new Date();
                pastDate.setMonth(pastDate.getMonth() - 1);
                
                const startDate = pastDate.toISOString().split('T')[0];
                const endDate = currentDate.toISOString().split('T')[0];
                
                const performanceResponse = await monitoringService.getPerformanceMetrics({
                    startDate,
                    endDate,
                    userId
                });
                
                const metrics = performanceResponse.data;
                setAgentMetrics({
                    activeAgents: metrics.active_agents || 0,
                    successRate: metrics.success_rate || 0,
                    averageResponseTime: metrics.avg_response_time || 0
                });
                
                // Fetch existing agent configuration
                try {
                    const agentConfigResponse = await api.get('/api/v1/agents/config', { params: { userId } });
                    const agentConfig = agentConfigResponse.data;
                    
                    if (agentConfig) {
                        setAgentRole(agentConfig.role ?? 'customer_support');
                        setTemperature(agentConfig.temperature ?? 0.7);
                        setMaxTokens(agentConfig.max_tokens ?? 200);
                        setTopP(agentConfig.top_p ?? 0.3);
                        setRespondOnlyIfFound(agentConfig.respond_only_if_found ?? true);
                        setToneOfVoice(agentConfig.tone_of_voice ?? 'professional');
                        setContextWindow(agentConfig.context_window ?? '8k');
                        setSessionPersistence(agentConfig.session_persistence ?? 'enabled');
                        setModerationActive(agentConfig.moderation_active ?? true);
                        setMaxInputLength(agentConfig.max_input_length ?? 500);
                        setResponseStyle(agentConfig.response_style ?? 'formatted');
                        setLoggingActive(agentConfig.logging_active ?? true);

                        const byok = agentConfig.byok;
                        if (byok && typeof byok === 'object') {
                            setByokEnabled(Boolean(byok.enabled));
                            setByokSelectedProvider(byok.selected_provider ?? 'env');

                            const providers = byok.providers;
                            if (providers && typeof providers === 'object') {
                                const openai = providers.openai;
                                if (openai && typeof openai === 'object') {
                                    setByokOpenaiEnabled(openai.enabled ?? true);
                                    setByokOpenaiApiKey(openai.api_key ?? '');
                                    setByokOpenaiBaseUrl(openai.base_url ?? 'https://api.openai.com/v1');
                                    setByokOpenaiDefaultModel(openai.default_model ?? 'gpt-4o-mini');
                                }
                                const moonshot = (providers as any).moonshot;
                                if (moonshot && typeof moonshot === 'object') {
                                    setByokMoonshotEnabled(moonshot.enabled ?? true);
                                    setByokMoonshotApiKey(moonshot.api_key ?? '');
                                    setByokMoonshotBaseUrl(moonshot.base_url ?? 'https://api.moonshot.cn/v1');
                                    setByokMoonshotDefaultModel(moonshot.default_model ?? 'moonshot-v1-32k');
                                }
                                const anthropic = providers.anthropic;
                                if (anthropic && typeof anthropic === 'object') {
                                    setByokAnthropicEnabled(anthropic.enabled ?? true);
                                    setByokAnthropicApiKey(anthropic.api_key ?? '');
                                    setByokAnthropicDefaultModel(anthropic.default_model ?? 'claude-3-5-sonnet-20241022');
                                }
                                const gemini = providers.gemini;
                                if (gemini && typeof gemini === 'object') {
                                    setByokGeminiEnabled(gemini.enabled ?? true);
                                    setByokGeminiApiKey(gemini.api_key ?? '');
                                    setByokGeminiDefaultModel(gemini.default_model ?? 'gemini-1.5-pro');
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching agent configuration:', error);
                }
                
            } catch (error) {
                console.error('Error fetching agent metrics:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAgentMetrics();
    }, []);

    useEffect(() => {
        if (!openSnackbar) return;
        const t = window.setTimeout(() => setOpenSnackbar(false), 6000);
        return () => window.clearTimeout(t);
    }, [openSnackbar]);
    
    // Voice and Restrictions state
    const [toneOfVoice, setToneOfVoice] = useState<string>('professional');
    
    // Memory and Context state
    const [contextWindow, setContextWindow] = useState<string>('8k');
    const [sessionPersistence, setSessionPersistence] = useState<string>('enabled');
    
    // Security state
    const [moderationActive, setModerationActive] = useState<boolean>(true);
    const [maxInputLength, setMaxInputLength] = useState<number>(500);
    
    // Response Interface state
    const [responseStyle, setResponseStyle] = useState<string>('formatted');
    
    // Logs state
    const [loggingActive, setLoggingActive] = useState<boolean>(true);

    const [byokEnabled, setByokEnabled] = useState<boolean>(false);
    const [byokSelectedProvider, setByokSelectedProvider] = useState<string>('env');
    const [byokOpenaiEnabled, setByokOpenaiEnabled] = useState<boolean>(true);
    const [byokOpenaiApiKey, setByokOpenaiApiKey] = useState<string>('');
    const [byokOpenaiBaseUrl, setByokOpenaiBaseUrl] = useState<string>('https://api.openai.com/v1');
    const [byokOpenaiDefaultModel, setByokOpenaiDefaultModel] = useState<string>('gpt-4o-mini');
    const [byokMoonshotEnabled, setByokMoonshotEnabled] = useState<boolean>(true);
    const [byokMoonshotApiKey, setByokMoonshotApiKey] = useState<string>('');
    const [byokMoonshotBaseUrl, setByokMoonshotBaseUrl] = useState<string>('https://api.moonshot.cn/v1');
    const [byokMoonshotDefaultModel, setByokMoonshotDefaultModel] = useState<string>('moonshot-v1-32k');
    const [byokAnthropicEnabled, setByokAnthropicEnabled] = useState<boolean>(true);
    const [byokAnthropicApiKey, setByokAnthropicApiKey] = useState<string>('');
    const [byokAnthropicDefaultModel, setByokAnthropicDefaultModel] = useState<string>('claude-3-5-sonnet-20241022');
    const [byokGeminiEnabled, setByokGeminiEnabled] = useState<boolean>(true);
    const [byokGeminiApiKey, setByokGeminiApiKey] = useState<string>('');
    const [byokGeminiDefaultModel, setByokGeminiDefaultModel] = useState<string>('gemini-1.5-pro');
    
    // Function to handle creating a new chat
    const handleNewChat = () => {
        navigate('/chat');
    };
    
    // Function to handle save configuration
    const handleSaveConfig = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const userResponse = await userService.getCurrentUser();
            const userId = userResponse.data.id;
            
            // Create config object
            const agentConfig = {
                userId,
                role: agentRole,
                temperature,
                max_tokens: maxTokens,
                top_p: topP,
                respond_only_if_found: respondOnlyIfFound,
                tone_of_voice: toneOfVoice,
                context_window: contextWindow,
                session_persistence: sessionPersistence,
                moderation_active: moderationActive,
                max_input_length: maxInputLength,
                response_style: responseStyle,
                logging_active: loggingActive,
                byok: {
                    enabled: byokEnabled,
                    selected_provider: byokSelectedProvider,
                    providers: {
                        openai: {
                            enabled: byokOpenaiEnabled,
                            api_key: byokOpenaiApiKey,
                            base_url: byokOpenaiBaseUrl,
                            default_model: byokOpenaiDefaultModel,
                        },
                        moonshot: {
                            enabled: byokMoonshotEnabled,
                            api_key: byokMoonshotApiKey,
                            base_url: byokMoonshotBaseUrl,
                            default_model: byokMoonshotDefaultModel,
                        },
                        anthropic: {
                            enabled: byokAnthropicEnabled,
                            api_key: byokAnthropicApiKey,
                            default_model: byokAnthropicDefaultModel,
                        },
                        gemini: {
                            enabled: byokGeminiEnabled,
                            api_key: byokGeminiApiKey,
                            default_model: byokGeminiDefaultModel,
                        },
                    },
                },
            };
            
            console.log('Saving agent configuration:', agentConfig);
            
            // Send configuration to backend
            const response = await api.post('/api/v1/agents/config', agentConfig);
            
            if (response && response.status >= 200 && response.status < 300) {
                // Display success notification
                setSnackbarMessage('Agent configuration saved successfully!');
                setSnackbarSeverity('success');
            } else {
                // Display error notification
                setSnackbarMessage('Failed to save configuration. Please try again.');
                setSnackbarSeverity('error');
            }
        } catch (error) {
            console.error('Error saving agent configuration:', error);
            setSnackbarMessage('Error saving configuration. Please try again.');
            setSnackbarSeverity('error');
        } finally {
            setLoading(false);
            setOpenSnackbar(true);
        }
    };
    
    // Function to reset configuration to defaults
    const handleResetConfig = () => {
        setAgentRole('customer_support');
        setTemperature(0.7);
        setMaxTokens(200);
        setTopP(0.3);
        setRespondOnlyIfFound(true);
        setToneOfVoice('professional');
        setContextWindow('8k');
        setSessionPersistence('enabled');
        setModerationActive(true);
        setMaxInputLength(500);
        setResponseStyle('formatted');
        setLoggingActive(true);

        setByokEnabled(false);
        setByokSelectedProvider('env');
        setByokOpenaiEnabled(true);
        setByokOpenaiApiKey('');
        setByokOpenaiBaseUrl('https://api.openai.com/v1');
        setByokOpenaiDefaultModel('gpt-4o-mini');
        setByokMoonshotEnabled(true);
        setByokMoonshotApiKey('');
        setByokMoonshotBaseUrl('https://api.moonshot.cn/v1');
        setByokMoonshotDefaultModel('moonshot-v1-32k');
        setByokAnthropicEnabled(true);
        setByokAnthropicApiKey('');
        setByokAnthropicDefaultModel('claude-3-5-sonnet-20241022');
        setByokGeminiEnabled(true);
        setByokGeminiApiKey('');
        setByokGeminiDefaultModel('gemini-1.5-pro');
        
        // Display success notification
        setSnackbarMessage('Configuration reset to defaults');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
    };
    
    // Function to handle closing the snackbar
    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return user ? (
        <div className="h-full overflow-auto p-6 md:p-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur">
                                <Bot className="h-5 w-5 text-neon-cyan" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-2xl font-semibold tracking-tight text-white md:text-3xl">Agent Config</div>
                                <div className="mt-1 text-sm text-[color:var(--text-secondary)]">Tune behavior, safety, and output style.</div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">Role: {agentRole}</Badge>
                            <Badge variant="outline">Temp: {temperature.toFixed(1)}</Badge>
                            <Badge variant="outline">Max Tokens: {maxTokens}</Badge>
                            <Badge variant="outline">Top-p: {topP.toFixed(1)}</Badge>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button onClick={handleNewChat} disabled={loading}>
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm text-[color:var(--text-secondary)]">Active Agents</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{agentMetrics.activeAgents}</div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <Activity className="h-5 w-5 text-neon-purple" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm text-[color:var(--text-secondary)]">Success Rate</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{agentMetrics.successRate}%</div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <Activity className="h-5 w-5 text-neon-green" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm text-[color:var(--text-secondary)]">Avg Response Time</div>
                                    <div className="mt-1 text-2xl font-semibold text-white">{agentMetrics.averageResponseTime}ms</div>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                    <Clock3 className="h-5 w-5 text-neon-cyan" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <Card>
                            <CardHeader>
                                <CardTitle>Core Behavior</CardTitle>
                                <CardDescription>Agent role and generation parameters.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="text-sm font-medium text-white">Agent Role</div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => setAgentRole('customer_support')}
                                            className={cn(
                                                'neon-card w-full p-4 text-left transition-transform hover:-translate-y-0.5',
                                                agentRole === 'customer_support' ? 'border-neon-cyan/40' : ''
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-sm font-semibold text-white">Customer Support</div>
                                                <Badge variant={agentRole === 'customer_support' ? 'secondary' : 'outline'}>Recommended</Badge>
                                            </div>
                                            <div className="mt-1 text-xs text-[color:var(--text-secondary)]">General inquiries, policies, FAQs.</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAgentRole('technical_support')}
                                            className={cn(
                                                'neon-card w-full p-4 text-left transition-transform hover:-translate-y-0.5',
                                                agentRole === 'technical_support' ? 'border-neon-cyan/40' : ''
                                            )}
                                        >
                                            <div className="text-sm font-semibold text-white">Technical Support</div>
                                            <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Troubleshooting + step-by-step guides.</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAgentRole('sales_services')}
                                            className={cn(
                                                'neon-card w-full p-4 text-left transition-transform hover:-translate-y-0.5',
                                                agentRole === 'sales_services' ? 'border-neon-cyan/40' : ''
                                            )}
                                        >
                                            <div className="text-sm font-semibold text-white">Sales Services</div>
                                            <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Pricing, positioning, upsell support.</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAgentRole('consulting_services')}
                                            className={cn(
                                                'neon-card w-full p-4 text-left transition-transform hover:-translate-y-0.5',
                                                agentRole === 'consulting_services' ? 'border-neon-cyan/40' : ''
                                            )}
                                        >
                                            <div className="text-sm font-semibold text-white">Consulting Services</div>
                                            <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Expert advice from uploaded knowledge.</div>
                                        </button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-white">Temperature</div>
                                            <div className="text-xs text-[color:var(--text-secondary)]">Controls creativity vs determinism.</div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant={temperature === 0.0 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTemperature(0.0)}
                                                    disabled={loading}
                                                >
                                                    0.0
                                                </Button>
                                                <Button
                                                    variant={temperature === 0.3 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTemperature(0.3)}
                                                    disabled={loading}
                                                >
                                                    0.3
                                                </Button>
                                                <Button
                                                    variant={temperature === 0.7 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTemperature(0.7)}
                                                    disabled={loading}
                                                >
                                                    0.7
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-white">Max Tokens</div>
                                            <div className="text-xs text-[color:var(--text-secondary)]">Maximum response length.</div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant={maxTokens === 100 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setMaxTokens(100)}
                                                    disabled={loading}
                                                >
                                                    100
                                                </Button>
                                                <Button
                                                    variant={maxTokens === 200 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setMaxTokens(200)}
                                                    disabled={loading}
                                                >
                                                    200
                                                </Button>
                                                <Button
                                                    variant={maxTokens === 500 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setMaxTokens(500)}
                                                    disabled={loading}
                                                >
                                                    500
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-white">Top-p</div>
                                            <div className="text-xs text-[color:var(--text-secondary)]">Nucleus sampling cutoff.</div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant={topP === 0.1 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTopP(0.1)}
                                                    disabled={loading}
                                                >
                                                    0.1
                                                </Button>
                                                <Button
                                                    variant={topP === 0.3 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTopP(0.3)}
                                                    disabled={loading}
                                                >
                                                    0.3
                                                </Button>
                                                <Button
                                                    variant={topP === 0.7 ? 'default' : 'secondary'}
                                                    size="sm"
                                                    onClick={() => setTopP(0.7)}
                                                    disabled={loading}
                                                >
                                                    0.7
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-5">
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy & Runtime</CardTitle>
                                <CardDescription>Knowledge access, safety, memory, and observability.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-white">Respond Only If Found</div>
                                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Avoid hallucinations by requiring KB matches.</div>
                                    </div>
                                    <Switch checked={respondOnlyIfFound} onCheckedChange={setRespondOnlyIfFound} disabled={loading} />
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Tone of Voice</div>
                                        <select
                                            className="neon-input w-full px-3 py-2 text-sm"
                                            value={toneOfVoice}
                                            onChange={(e) => setToneOfVoice(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="friendly">Friendly</option>
                                            <option value="direct">Direct</option>
                                            <option value="empathetic">Empathetic</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Response Style</div>
                                        <select
                                            className="neon-input w-full px-3 py-2 text-sm"
                                            value={responseStyle}
                                            onChange={(e) => setResponseStyle(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="formatted">Formatted</option>
                                            <option value="concise">Concise</option>
                                            <option value="detailed">Detailed</option>
                                        </select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Context Window</div>
                                        <select
                                            className="neon-input w-full px-3 py-2 text-sm"
                                            value={contextWindow}
                                            onChange={(e) => setContextWindow(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="4k">4k</option>
                                            <option value="8k">8k</option>
                                            <option value="16k">16k</option>
                                            <option value="32k">32k</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Session Persistence</div>
                                        <select
                                            className="neon-input w-full px-3 py-2 text-sm"
                                            value={sessionPersistence}
                                            onChange={(e) => setSessionPersistence(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="enabled">Enabled</option>
                                            <option value="disabled">Disabled</option>
                                        </select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-white">Moderation</div>
                                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Apply content safeguards to user input.</div>
                                    </div>
                                    <Switch checked={moderationActive} onCheckedChange={setModerationActive} disabled={loading} />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white">Max Input Length</div>
                                    <Input
                                        type="number"
                                        value={maxInputLength}
                                        onChange={(e) => setMaxInputLength(Number(e.target.value))}
                                        disabled={loading}
                                        min={1}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-white">Logging</div>
                                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Collect logs for debugging and monitoring.</div>
                                    </div>
                                    <Switch checked={loggingActive} onCheckedChange={setLoggingActive} disabled={loading} />
                                </div>

                                <Separator />

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-white">Bring Your Own Keys</div>
                                        <div className="mt-1 text-xs text-[color:var(--text-secondary)]">Use your own provider keys instead of server environment keys.</div>
                                    </div>
                                    <Switch checked={byokEnabled} onCheckedChange={setByokEnabled} disabled={loading} />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-white">Selected Provider</div>
                                    <select
                                        className="neon-input w-full px-3 py-2 text-sm"
                                        value={byokSelectedProvider}
                                        onChange={(e) => setByokSelectedProvider(e.target.value)}
                                        disabled={loading || !byokEnabled}
                                    >
                                        <option value="env">Environment</option>
                                        <option value="openai">OpenAI</option>
                                        <option value="moonshot">Moonshot</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="gemini">Gemini</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="text-sm font-medium text-white">OpenAI Enabled</div>
                                        <Switch checked={byokOpenaiEnabled} onCheckedChange={setByokOpenaiEnabled} disabled={loading || !byokEnabled} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">OpenAI API Key</div>
                                        <Input
                                            type="password"
                                            value={byokOpenaiApiKey}
                                            onChange={(e) => setByokOpenaiApiKey(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">OpenAI Base URL</div>
                                        <Input
                                            value={byokOpenaiBaseUrl}
                                            onChange={(e) => setByokOpenaiBaseUrl(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">OpenAI Default Model</div>
                                        <Input
                                            value={byokOpenaiDefaultModel}
                                            onChange={(e) => setByokOpenaiDefaultModel(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="text-sm font-medium text-white">Moonshot Enabled</div>
                                        <Switch checked={byokMoonshotEnabled} onCheckedChange={setByokMoonshotEnabled} disabled={loading || !byokEnabled} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Moonshot API Key</div>
                                        <Input
                                            type="password"
                                            value={byokMoonshotApiKey}
                                            onChange={(e) => setByokMoonshotApiKey(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Moonshot Base URL</div>
                                        <Input
                                            value={byokMoonshotBaseUrl}
                                            onChange={(e) => setByokMoonshotBaseUrl(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Moonshot Default Model</div>
                                        <Input
                                            value={byokMoonshotDefaultModel}
                                            onChange={(e) => setByokMoonshotDefaultModel(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="text-sm font-medium text-white">Anthropic Enabled</div>
                                        <Switch checked={byokAnthropicEnabled} onCheckedChange={setByokAnthropicEnabled} disabled={loading || !byokEnabled} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Anthropic API Key</div>
                                        <Input
                                            type="password"
                                            value={byokAnthropicApiKey}
                                            onChange={(e) => setByokAnthropicApiKey(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Anthropic Default Model</div>
                                        <Input
                                            value={byokAnthropicDefaultModel}
                                            onChange={(e) => setByokAnthropicDefaultModel(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="text-sm font-medium text-white">Gemini Enabled</div>
                                        <Switch checked={byokGeminiEnabled} onCheckedChange={setByokGeminiEnabled} disabled={loading || !byokEnabled} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Gemini API Key</div>
                                        <Input
                                            type="password"
                                            value={byokGeminiApiKey}
                                            onChange={(e) => setByokGeminiApiKey(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-white">Gemini Default Model</div>
                                        <Input
                                            value={byokGeminiDefaultModel}
                                            onChange={(e) => setByokGeminiDefaultModel(e.target.value)}
                                            disabled={loading || !byokEnabled}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="text-xs text-[color:var(--text-secondary)]">
                        Changes are saved per-user and affect new conversations.
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" onClick={handleResetConfig} disabled={loading}>
                            <RotateCcw className="h-4 w-4" />
                            Reset Defaults
                        </Button>
                        <Button onClick={handleSaveConfig} disabled={loading}>
                            <Save className="h-4 w-4" />
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </div>
                </div>
            </div>

            {openSnackbar && (
                <div className="fixed bottom-6 left-1/2 z-50 w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
                    <div
                        className={cn(
                            'neon-card px-4 py-3',
                            snackbarSeverity === 'success'
                                ? 'border-neon-green/30 bg-neon-green/10'
                                : 'border-red-500/30 bg-red-500/10'
                        )}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className={cn('text-sm', snackbarSeverity === 'success' ? 'text-neon-green' : 'text-red-200')}>
                                {snackbarMessage}
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseSnackbar}
                                className="rounded-md p-1 text-white/70 hover:bg-white/5 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : null;
};

export default AgentConfigDashboard;
