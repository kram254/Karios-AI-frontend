import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Agent, AgentRole, AgentMode, AgentConfig, EXECUTE_CODE, AgentTemplate, AdvancedModelSettings } from '../../types/agent';
import { useNavigate } from 'react-router-dom';
import './AgentCreationWizard.css';
import './dropdownFix.css';
import { KnowledgeSelector } from '../knowledge/KnowledgeSelector';
import { generateSystemPrompt } from '../../utils/agentRolePrompts';
import { AGENT_ROLE_DESCRIPTIONS, AGENT_CATEGORIES, getRoleDescription } from '../../utils/agentRoleDescriptions';
import { ParameterIntelligencePanel } from './ParameterIntelligencePanel';
import { TemplateMarketplace } from './TemplateMarketplace';
import { ParameterSandbox } from './ParameterSandbox';
import { AgentPerformanceAnalytics } from './AgentPerformanceAnalytics';
import { skillService } from '../../services/api/skill.service';
import { Skill } from '../../types/skill';

// Material UI components
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import FormGroup from '@mui/material/FormGroup';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Material UI icons
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoIcon from '@mui/icons-material/Info';
import TuneIcon from '@mui/icons-material/Tune';
import ScienceIcon from '@mui/icons-material/Science';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CollectionsIcon from '@mui/icons-material/Collections';

// Define the props interface
interface AgentCreationWizardProps {
    open: boolean;
    onClose: () => void;
    onDataChange: (data: Partial<Agent>) => void;
    onKnowledgeSelect: (ids: number[]) => void;
    onSubmit: (agentData: Partial<Agent>) => void;
    initialData?: Partial<Agent>;
    skipDraftRestore?: boolean;
    startStep?: number;
}

// Define the step interface
interface Step {
    label: string;
    description: string;
}

// Steps for the wizard
const STEPS: Step[] = [
    { label: 'Basic Info', description: 'Name and description of your agent' },
    { label: 'Role & Behavior', description: 'Define how your agent interacts' },
    { label: 'Generation Parameters', description: 'Configure AI model settings' },
    { label: 'Knowledge Base', description: 'Select knowledge for your agent' },
    { label: 'Agent Actions', description: 'Choose actions your agent can perform' },
    { label: 'Review', description: 'Review your agent before creation' }
];

export default function AgentCreationWizard({
    open,
    onClose,
    onDataChange,
    onKnowledgeSelect,
    onSubmit,
    initialData,
    skipDraftRestore,
    startStep
}: AgentCreationWizardProps) {
    const draftKeyRef = useRef<string>('agent_creation_wizard_draft_v1');
    const restoredDraftRef = useRef<boolean>(false);
    const draftSuppressedRef = useRef<boolean>(false);
    const prevOpenRef = useRef<boolean>(open);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Agent>>(initialData || {
        actions: [],
        ai_role: AgentRole.WEB_SCRAPING,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 150
    });

    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [skillsLoading, setSkillsLoading] = useState(false);
    const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
    const [roleSelectOpen, setRoleSelectOpen] = useState(false);
    const [modeSelectOpen, setModeSelectOpen] = useState(false);
    const [languageSelectOpen, setLanguageSelectOpen] = useState(false);
    const [customRole, setCustomRole] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerificationLoading, setIsVerificationLoading] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState<string>('');

    // New state for agent selection UI
    const [agentSearchQuery, setAgentSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

    // Phase 1 & 2 Enhancement States
    const [activeParameterTab, setActiveParameterTab] = useState<'intelligence' | 'templates' | 'sandbox' | 'analytics'>('intelligence');
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
    const [advancedSettings, setAdvancedSettings] = useState<AdvancedModelSettings>({
        frequency_penalty: 0,
        presence_penalty: 0,
        top_k: 40,
        stop_sequences: [],
        response_format: 'text'
    });

    const persistDraft = useCallback((override?: Partial<{ open: boolean }>) => {
        if (draftSuppressedRef.current) return;
        const isOpen = override?.open ?? open;
        if (!isOpen) return;
        try {
            const payload = {
                v: 1,
                savedAt: Date.now(),
                currentStep,
                formData,
                selectedKnowledgeIds,
                selectedSkillIds,
                customRole,
                agentSearchQuery,
                selectedCategory,
                difficultyFilter,
                activeParameterTab,
                selectedTemplate,
                advancedSettings
            };
            localStorage.setItem(draftKeyRef.current, JSON.stringify(payload));
        } catch {}
    }, [open, currentStep, formData, selectedKnowledgeIds, selectedSkillIds, customRole, agentSearchQuery, selectedCategory, difficultyFilter, activeParameterTab, selectedTemplate, advancedSettings]);

    const clearDraft = useCallback(() => {
        try { localStorage.removeItem(draftKeyRef.current); } catch {}
    }, []);

    const handleClose = useCallback(() => {
        persistDraft({ open: true });
        onClose();
    }, [onClose, persistDraft]);

    useEffect(() => {
        const prev = prevOpenRef.current;
        prevOpenRef.current = open;
        if (prev && !open) {
            persistDraft({ open: true });
        }
    }, [open, persistDraft]);

    // Function to filter agents based on search, category, and difficulty
    const getFilteredAgents = useCallback((): AgentRole[] => {
        let agents = Object.keys(AGENT_ROLE_DESCRIPTIONS) as AgentRole[];

        // Filter by category
        if (selectedCategory !== 'all') {
            const category = AGENT_CATEGORIES.find(c => c.id === selectedCategory);
            if (category) {
                agents = agents.filter(role => category.agents.includes(role));
            }
        }

        // Filter by difficulty
        if (difficultyFilter !== 'all') {
            agents = agents.filter(role => {
                const roleInfo = AGENT_ROLE_DESCRIPTIONS[role];
                return roleInfo.difficulty === difficultyFilter;
            });
        }

        // Filter by search query
        if (agentSearchQuery.trim()) {
            const query = agentSearchQuery.toLowerCase();
            agents = agents.filter(role => {
                const roleInfo = AGENT_ROLE_DESCRIPTIONS[role];
                return (
                    roleInfo.title.toLowerCase().includes(query) ||
                    roleInfo.description.toLowerCase().includes(query) ||
                    roleInfo.specialties.some(s => s.toLowerCase().includes(query)) ||
                    roleInfo.useCases.some(u => u.toLowerCase().includes(query)) ||
                    roleInfo.category.toLowerCase().includes(query)
                );
            });
        }

        return agents;
    }, [agentSearchQuery, selectedCategory, difficultyFilter]);

    // Function to handle opening the modal
    useEffect(() => {
        console.log('Modal open state:', open);
        // Reset the wizard to step 1 whenever it's opened
        if (open) {
            if (skipDraftRestore) {
                draftSuppressedRef.current = false;
                restoredDraftRef.current = false;
                setCurrentStep(typeof startStep === 'number' ? Math.min(Math.max(1, startStep), STEPS.length) : 1);
                setFormData(initialData || {
                    actions: [],
                    ai_role: AgentRole.WEB_SCRAPING,
                    language: 'en',
                    mode: AgentMode.TEXT,
                    response_style: 0.5,
                    response_length: 150
                });
                if (initialData?.config?.knowledge_item_ids) {
                    setSelectedKnowledgeIds(initialData.config.knowledge_item_ids);
                } else if (initialData?.knowledge_items) {
                    setSelectedKnowledgeIds(initialData.knowledge_items.map(item => item.id));
                } else {
                    setSelectedKnowledgeIds([]);
                }

                try {
                    const rawSkillIds = (initialData as any)?.skill_ids || (initialData as any)?.skillIds;
                    if (Array.isArray(rawSkillIds)) {
                        setSelectedSkillIds(rawSkillIds.map((x: any) => String(x)).filter((x: string) => x.trim()));
                    } else if ((initialData as any)?.skills && Array.isArray((initialData as any).skills)) {
                        setSelectedSkillIds((initialData as any).skills.map((s: any) => String(s?.id)).filter((x: string) => x.trim()));
                    } else {
                        setSelectedSkillIds([]);
                    }
                } catch {
                    setSelectedSkillIds([]);
                }
                setCustomRole(false);
                setIsLoading(false);
                return;
            }
            draftSuppressedRef.current = false;
            let restored = false;
            try {
                const raw = localStorage.getItem(draftKeyRef.current);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
                    if (savedAt && (Date.now() - savedAt) < (1000 * 60 * 60 * 24 * 7)) {
                        if (typeof parsed?.currentStep === 'number') {
                            setCurrentStep(Math.min(Math.max(1, parsed.currentStep), STEPS.length));
                        } else {
                            setCurrentStep(1);
                        }
                        if (parsed?.formData && typeof parsed.formData === 'object') {
                            setFormData(parsed.formData);
                        } else {
                            setFormData(initialData || {
                                actions: [],
                                ai_role: AgentRole.WEB_SCRAPING,
                                language: 'en',
                                mode: AgentMode.TEXT,
                                response_style: 0.5,
                                response_length: 150
                            });
                        }
                        if (Array.isArray(parsed?.selectedKnowledgeIds)) {
                            setSelectedKnowledgeIds(parsed.selectedKnowledgeIds);
                        } else {
                            setSelectedKnowledgeIds([]);
                        }
                        if (Array.isArray(parsed?.selectedSkillIds)) {
                            setSelectedSkillIds(parsed.selectedSkillIds.map((x: any) => String(x)).filter((x: string) => x.trim()));
                        } else {
                            setSelectedSkillIds([]);
                        }
                        if (typeof parsed?.customRole === 'boolean') {
                            setCustomRole(parsed.customRole);
                        }
                        if (typeof parsed?.agentSearchQuery === 'string') {
                            setAgentSearchQuery(parsed.agentSearchQuery);
                        }
                        if (typeof parsed?.selectedCategory === 'string') {
                            setSelectedCategory(parsed.selectedCategory);
                        }
                        if (typeof parsed?.difficultyFilter === 'string') {
                            setDifficultyFilter(parsed.difficultyFilter);
                        }
                        if (typeof parsed?.activeParameterTab === 'string') {
                            setActiveParameterTab(parsed.activeParameterTab);
                        }
                        if (parsed?.selectedTemplate && typeof parsed.selectedTemplate === 'object') {
                            setSelectedTemplate(parsed.selectedTemplate);
                        }
                        if (parsed?.advancedSettings && typeof parsed.advancedSettings === 'object') {
                            setAdvancedSettings(parsed.advancedSettings);
                        }
                        restored = true;
                    }
                }
            } catch {}

            restoredDraftRef.current = restored;

            if (!restored) {
                setCurrentStep(typeof startStep === 'number' ? Math.min(Math.max(1, startStep), STEPS.length) : 1);
                setFormData(initialData || {
                    actions: [],
                    ai_role: AgentRole.WEB_SCRAPING,
                    language: 'en',
                    mode: AgentMode.TEXT,
                    response_style: 0.5,
                    response_length: 150
                });
                setSelectedKnowledgeIds([]);
                try {
                    const rawSkillIds = (initialData as any)?.skill_ids || (initialData as any)?.skillIds;
                    if (Array.isArray(rawSkillIds)) {
                        setSelectedSkillIds(rawSkillIds.map((x: any) => String(x)).filter((x: string) => x.trim()));
                    } else if ((initialData as any)?.skills && Array.isArray((initialData as any).skills)) {
                        setSelectedSkillIds((initialData as any).skills.map((s: any) => String(s?.id)).filter((x: string) => x.trim()));
                    } else {
                        setSelectedSkillIds([]);
                    }
                } catch {
                    setSelectedSkillIds([]);
                }
                setCustomRole(false);
                setIsLoading(false);
            }
        }
    }, [open, initialData, skipDraftRestore, startStep]);

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData && !(open && restoredDraftRef.current)) {
            setFormData(initialData);
            // If there are knowledge item IDs, update the selected knowledge IDs
            if (initialData.config?.knowledge_item_ids) {
                setSelectedKnowledgeIds(initialData.config.knowledge_item_ids);
            } else if (initialData.knowledge_items) {
                // Extract IDs from knowledge_items if available
                const knowledgeIds = initialData.knowledge_items.map(item => item.id);
                setSelectedKnowledgeIds(knowledgeIds);
            }

            try {
                const rawSkillIds = (initialData as any)?.skill_ids || (initialData as any)?.skillIds;
                if (Array.isArray(rawSkillIds)) {
                    setSelectedSkillIds(rawSkillIds.map((x: any) => String(x)).filter((x: string) => x.trim()));
                } else if ((initialData as any)?.skills && Array.isArray((initialData as any).skills)) {
                    setSelectedSkillIds((initialData as any).skills.map((s: any) => String(s?.id)).filter((x: string) => x.trim()));
                }
            } catch {}
        }
    }, [initialData, open]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setSkillsLoading(true);
        skillService.listSkills(true)
            .then((res) => {
                if (cancelled) return;
                const data = (res as any)?.data;
                if (Array.isArray(data)) {
                    setAvailableSkills(data);
                } else {
                    setAvailableSkills([]);
                }
            })
            .catch(() => {
                if (cancelled) return;
                setAvailableSkills([]);
            })
            .finally(() => {
                if (!cancelled) {
                    setSkillsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (!formData.ai_role) return;
        if (!Array.isArray(availableSkills) || availableSkills.length === 0) return;

        const roleValue = String(formData.ai_role);
        const roleSkill = availableSkills.find((s) => Array.isArray((s as any)?.tags) && (s as any).tags.includes('role') && (s as any).tags.includes(roleValue));
        if (!roleSkill || !(roleSkill as any).id) return;

        const roleSkillId = String((roleSkill as any).id);
        const keepIds = (selectedSkillIds || []).filter((id) => {
            const skill = availableSkills.find((x) => String((x as any)?.id) === String(id));
            if (!skill) return true;
            return !(Array.isArray((skill as any)?.tags) && (skill as any).tags.includes('role'));
        });

        const nextIds = Array.from(new Set([...keepIds, roleSkillId].map((x) => String(x)).filter((x) => x.trim())));
        const currentIds = (selectedSkillIds || []).map((x) => String(x));
        if (nextIds.length === currentIds.length && nextIds.every((v, i) => v === currentIds[i])) return;

        setSelectedSkillIds(nextIds);
        const updatedData: Partial<Agent> = { ...formData, skill_ids: nextIds };
        setFormData(updatedData);
        onDataChange(updatedData);
    }, [open, formData.ai_role, availableSkills, selectedSkillIds, formData, onDataChange]);

    // Function to handle input changes
    const handleInputChange = (field: keyof Agent, value: any) => {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);
        onDataChange(updatedData);
    };

    const handleSkillSelectionChange = (value: any) => {
        const ids = Array.isArray(value)
            ? value.map((x: any) => String(x)).filter((x: string) => x.trim())
            : [];
        setSelectedSkillIds(ids);
        const updatedData: Partial<Agent> = { ...formData, skill_ids: ids };
        setFormData(updatedData);
        onDataChange(updatedData);
    };

    // Function to handle submit
    const handleSubmit = () => {
        setIsLoading(true);

        // Create a valid config object with all required fields from the AgentConfig interface
        const configUpdate: AgentConfig = {
            // These fields are required according to the AgentConfig interface
            language: formData.language || 'en', // Default to English if not set
            mode: formData.mode || AgentMode.TEXT, // Default to TEXT mode if not set
            response_style: typeof formData.response_style === 'number' ? formData.response_style : 0.5,
            response_length: typeof formData.response_length === 'number' ? formData.response_length : 150,
            // Optional fields
            model: formData.config?.model,
            temperature: formData.config?.temperature,
            max_tokens: formData.config?.max_tokens,
            knowledge_item_ids: selectedKnowledgeIds,
            actions: formData.actions,
            system_prompt: formData.config?.system_prompt,
            webhook_url: formData.config?.webhook_url,
            additional_context: formData.config?.additional_context,
            allowed_domains: formData.config?.allowed_domains,
            blocked_domains: formData.config?.blocked_domains,
            security_profile: formData.config?.security_profile,
            policy_mode: formData.config?.policy_mode,
            enforce_domain_allowlist: formData.config?.enforce_domain_allowlist,
            enforce_tools_allowlist: formData.config?.enforce_tools_allowlist,
            tools_allowlist: formData.config?.tools_allowlist,
            tools_blocklist: formData.config?.tools_blocklist,
            block_risky_actions: formData.config?.block_risky_actions,
            approval_required: formData.config?.approval_required
        };

        // Create a copy of the form data with the updated config
        const updatedData: Partial<Agent> = {
            ...formData,
            config: configUpdate,
            skill_ids: selectedSkillIds
        };

        draftSuppressedRef.current = true;
        clearDraft();
        onSubmit(updatedData);
    };

    useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(() => {
            persistDraft({ open: true });
        }, 250);
        return () => {
            try { window.clearTimeout(t); } catch {}
        };
    }, [open, currentStep, formData, selectedKnowledgeIds, selectedSkillIds, customRole, agentSearchQuery, selectedCategory, difficultyFilter, activeParameterTab, selectedTemplate, advancedSettings, persistDraft]);

    useEffect(() => {
        return () => {
            persistDraft({ open: true });
        };
    }, [persistDraft]);

    // Function to go to the next step
    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Function to go to the previous step
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle opening the custom role input if "Custom" is selected
    useEffect(() => {
        if (formData.ai_role === AgentRole.CUSTOM) {
            setCustomRole(true);
        } else {
            setCustomRole(false);
        }
    }, [formData.ai_role]);

    // Automatically generate and set system prompt when relevant fields change
    useEffect(() => {
        // Only generate if we have the necessary data
        if (formData.ai_role) {
            const systemPrompt = generateSystemPrompt(
                formData.ai_role,
                formData.custom_role, // Pass custom role description if available
                formData.response_style,
                formData.response_length
            );

            // Update the form data with the generated system prompt
            setFormData(prevData => {
                // Create a properly typed config object
                const isQaRole = prevData.ai_role === AgentRole.TESTING_QA;
                const existingTools = Array.isArray((prevData.config as any)?.tools_enabled) ? ((prevData.config as any).tools_enabled as string[]) : [];
                const mergedTools = isQaRole
                    ? Array.from(new Set(["web_automation", "code_execution", "api_integration", ...existingTools]))
                    : existingTools;

                const updatedConfig: AgentConfig = {
                    ...(prevData.config || {}),
                    system_prompt: systemPrompt,
                    // Ensure required fields have default values if they don't exist
                    language: prevData.config?.language || 'en',
                    mode: prevData.config?.mode || AgentMode.TEXT,
                    response_style: prevData.config?.response_style || 0.5,
                    response_length: prevData.config?.response_length || 150,
                    ...(isQaRole ? {
                        browser_automation_enabled: (prevData.config as any)?.browser_automation_enabled ?? true,
                        tools_enabled: mergedTools
                    } : {})
                };

                // Return the updated form data
                return {
                    ...prevData,
                    config: updatedConfig
                };
            });

            console.log('Generated system prompt for role:', formData.ai_role);
        }
    }, [formData.ai_role, formData.custom_role, formData.response_style, formData.response_length]);

    // Add console logs for debugging
    useEffect(() => {
        console.log("AgentCreationWizard - currentStep:", currentStep);
        console.log("AgentCreationWizard - formData:", formData);
        console.log("AgentCreationWizard - selectedKnowledgeIds:", selectedKnowledgeIds);
    }, [currentStep, formData, selectedKnowledgeIds]);

    // Monitor component lifecycle
    useEffect(() => {
        console.log('AgentCreationWizard mounted');
        console.log('AgentCreationWizard open state:', open);
        console.log('Current step:', currentStep);
        console.log('Current form data:', formData);

        const handleBeforeUnload = () => {
            try { persistDraft({ open: true }); } catch {}
            console.log('Page is being unloaded');
        };

        const handlePageHide = () => {
            try { persistDraft({ open: true }); } catch {}
        };

        const handleVisibilityChange = () => {
            try {
                if (document.hidden) {
                    persistDraft({ open: true });
                }
            } catch {}
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            console.log('AgentCreationWizard unmounted');
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [open, currentStep, formData, persistDraft]);

    // Function to generate response examples based on role, style, and length settings
    const renderResponseExample = (): React.ReactNode => {
        // Generate dynamic example based on role
        const getExampleForRole = (role: AgentRole): string => {
            const roleInfo = AGENT_ROLE_DESCRIPTIONS[role];
            if (!roleInfo) {
                return "I'm ready to assist you with your tasks and provide helpful responses.";
            }

            // Generate response based on role's capabilities
            const capabilities = roleInfo.specialties.slice(0, 2).join(' and ');
            const useCase = roleInfo.useCases[0] || 'your specific needs';

            return `I've completed the ${roleInfo.title.toLowerCase()} task successfully. Using ${capabilities}, I've processed your request for ${useCase}. All operations executed with high accuracy and the results are ready for your review.`;
        };

        let example = formData.ai_role
            ? getExampleForRole(formData.ai_role)
            : "I'm ready to assist you with your tasks and provide helpful responses.";

        // Adjust for formality based on response style
        const style = formData.response_style || 0.5;
        if (style <= 0.25) {
            // More formal
            example = example
                .replace(/I'd/g, "I would")
                .replace(/Let's/g, "Let us")
                .replace(/you're/g, "you are")
                .replace(/I'm/g, "I am");

            if (style === 0) { // Very formal
                example = example
                    .replace(/\./g, ".\n\n")
                    .replace("right away", "immediately")
                    .replace("quick demo", "comprehensive demonstration")
                    .trim();
            }
        } else if (style >= 0.75) {
            // More casual
            example = example
                .replace("I understand", "I see")
                .replace("Let me help resolve", "I can fix")
                .replace("I would recommend", "I think you'd love")
                .replace("approximately", "about");

            if (style === 1) { // Very casual
                example = example
                    .replace("Could you please", "Can you")
                    .replace("would like", "want")
                    .replace("It looks like", "Seems like")
                    .replace("I noticed", "I see")
                    .trim();
            }
        }

        // Adjust length based on response_length
        const length = formData.response_length || 150;
        if (length <= 100) {
            // Shorter response
            example = example.split(".")[0] + ".";
        } else if (length >= 350) {
            // Longer response
            const additionalContext = [
                "I'm here to provide all the details you need.",
                "Our team is committed to your complete satisfaction.",
                "We have several additional options that might interest you as well.",
                "Feel free to ask any follow-up questions if you need more information."
            ];

            const randomIndex = Math.floor(Math.random() * additionalContext.length);
            example += " " + additionalContext[randomIndex];

            if (length >= 450) {
                // Even longer response
                example += " I'll be with you every step of the way to ensure all your questions are answered thoroughly and completely.";
            }
        }

        return (
            <Typography sx={{ color: '#FFFFFF', whiteSpace: 'pre-line' }}>
                {example}
            </Typography>
        );
    };

    // Function to validate the current step
    const validateStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!formData.name && formData.name.length > 0;
            case 2:
                return !!formData.ai_role && !!formData.mode;
            case 3:
                return true; // Generation parameters step is always valid (has defaults)
            case 4:
                return true; // Knowledge selection is optional
            case 5:
                return true; // Actions step is always valid
            case 6:
                return true; // Review step is always valid
            default:
                return false;
        }
    };

    const handleTemplateSelect = (template: AgentTemplate) => {
        setSelectedTemplate(template);
        if (template.config) {
            const updatedConfig: AgentConfig = {
                ...formData.config,
                language: formData.config?.language || 'en',
                mode: formData.config?.mode || AgentMode.TEXT,
                response_style: formData.config?.response_style || 0.5,
                response_length: formData.config?.response_length || 150,
                temperature: template.config.temperature,
                max_tokens: template.config.max_tokens,
                top_p: template.config.top_p,
                model: template.config.model,
                selected_template: template.id
            };
            setFormData(prev => ({
                ...prev,
                config: updatedConfig
            }));
        }
    };

    const handleConfigChange = (newConfig: Partial<AgentConfig>) => {
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                language: prev.config?.language || 'en',
                mode: prev.config?.mode || AgentMode.TEXT,
                response_style: prev.config?.response_style || 0.5,
                response_length: prev.config?.response_length || 150,
                ...newConfig
            }
        }));
    };

    const handleAdvancedSettingsChange = (settings: AdvancedModelSettings) => {
        setAdvancedSettings(settings);
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                language: prev.config?.language || 'en',
                mode: prev.config?.mode || AgentMode.TEXT,
                response_style: prev.config?.response_style || 0.5,
                response_length: prev.config?.response_length || 150,
                advanced_settings: settings
            }
        }));
    };

    // Function to handle changes to agent actions
    const handleActionChange = (actionId: string, checked: boolean) => {
        const currentActions = formData.actions || [];
        let updatedActions;

        if (checked) {
            updatedActions = [...currentActions, actionId];
        } else {
            updatedActions = currentActions.filter(id => id !== actionId);
        }

        handleInputChange('actions', updatedActions);
    };

    // Function to check if an action is selected
    const isActionSelected = (actionId: string): boolean => {
        return (formData.actions || []).includes(actionId);
    };

    const handleSendVerificationCode = async () => {
        const email = formData.config?.email_config?.email;
        if (!email) {
            setVerificationMessage('Please enter an email address first');
            return;
        }

        setIsVerificationLoading(true);
        setVerificationMessage('');

        try {
            const response = await fetch('/api/email/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setVerificationMessage('Verification code sent successfully! Check your email.');
                setFormData(prev => ({
                    ...prev,
                    config: {
                        language: 'en',
                        mode: AgentMode.TEXT,
                        response_style: 0.5,
                        response_length: 100,
                        ...prev.config,

                        email_config: {
                            ...prev.config?.email_config,
                            verification_code: '',
                            verification_expires: data.expires_at
                        }
                    }
                }));

            } else {

                setVerificationMessage(data.error_message || 'Failed to send verification code');

            }
        } catch (error) {
            setVerificationMessage('Error sending verification code. Please try again.');
        } finally {
            setIsVerificationLoading(false);
        }
    };

    // Render using Material-UI Modal
    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="agent-creation-wizard-title"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiBackdrop-root': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }
            }}
        >
            <Paper
                className="wizard-container"
                sx={{
                    position: 'relative',
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    backdropFilter: 'blur(20px)',
                    width: '94%',
                    maxWidth: '1600px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    borderRadius: '20px',
                    boxShadow: '0 20px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 243, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transform: open ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(40px)',
                    opacity: open ? 1 : 0,
                    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    overflowX: 'hidden',
                }}
            >
                <Box
                    className="wizard-progress-bar"
                    sx={{
                        width: `${(currentStep / STEPS.length) * 100}%`
                    }}
                />
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2.5,
                    borderBottom: '1px solid #333333'
                }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#FFFFFF' }}>
                        {currentStep === 6 ? 'Create New Agent' : `Create New Agent: ${STEPS[currentStep - 1]?.label}`}
                    </Typography>
                    <IconButton
                        onClick={handleClose}
                        size="large"
                        sx={{
                            color: '#AAAAAA',
                            '&:hover': {
                                color: '#FFFFFF',
                                backgroundColor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Steps indicator */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    px: 3,
                    pt: 2.5,
                    pb: 2,
                    mb: 1
                }}>
                    {STEPS.map((step, index) => {
                        const isActive = currentStep === index + 1;
                        const isCompleted = currentStep > index + 1;

                        return (
                            <React.Fragment key={step.label}>
                                <Box
                                    className={`step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        minWidth: '100px',
                                        position: 'relative'
                                    }}
                                >
                                    <Box
                                        className="step-number"
                                        sx={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            position: 'relative'
                                        }}
                                    >
                                        {index + 1}
                                    </Box>
                                    <Typography
                                        className="step-label"
                                        variant="caption"
                                        sx={{
                                            fontSize: '0.875rem',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {step.label}
                                    </Typography>
                                </Box>

                                {/* Connector line between steps */}
                                {index < STEPS.length - 1 && (
                                    <Box
                                        className={`step-connector ${isCompleted ? 'completed' : ''}`}
                                        sx={{
                                            flex: 1,
                                            height: '1px',
                                            mx: 1.5,
                                            mt: '17px'
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </Box>

                <Box sx={{ p: 3 }}>
                    {currentStep === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF', mb: 1 }}>
                                Basic Information
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, color: 'rgba(156, 163, 175, 1)' }}>
                                Provide a name and description for your agent.
                            </Typography>

                            <Typography sx={{ color: 'rgba(156, 163, 175, 1)', fontSize: '0.85rem', mb: 0.5 }}>
                                Agent Name *
                            </Typography>
                            <TextField
                                fullWidth
                                required
                                placeholder="Agent Name"
                                variant="outlined"
                                value={formData.name || ''}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                margin="normal"
                                InputLabelProps={{
                                    style: { display: 'none' },
                                }}
                                sx={{
                                    mt: 0.5,
                                    mb: 2.5,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#111827',
                                        color: '#FFFFFF',
                                        borderRadius: '14px',
                                        '& fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.5)',
                                        },
                                        '& input::placeholder': {
                                            color: 'rgba(156, 163, 175, 1)',
                                            opacity: 1,
                                        },
                                        '& input': {
                                            padding: '12px 16px',
                                        },
                                    },
                                }}
                            />

                            <Typography sx={{ color: 'rgba(156, 163, 175, 1)', fontSize: '0.85rem', mb: 0.5 }}>
                                Description
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Description"
                                variant="outlined"
                                value={formData.description || ''}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                margin="normal"
                                multiline
                                rows={4}
                                InputLabelProps={{
                                    style: { display: 'none' },
                                }}
                                sx={{
                                    mt: 0.5,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: '#1a2332',
                                        color: '#FFFFFF',
                                        borderRadius: '14px',
                                        '& fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'rgba(75, 85, 99, 0.5)',
                                        },
                                        '& textarea::placeholder': {
                                            color: 'rgba(156, 163, 175, 1)',
                                            opacity: 1,
                                        },
                                        '& textarea': {
                                            padding: '12px 16px',
                                        },
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {currentStep === 2 && (
                        <Box sx={{ p: 3, bgcolor: 'rgba(26, 35, 50, 0.7)', borderRadius: '20px' }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Select Agent Type
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, color: '#AAAAAA' }}>
                                Choose from {Object.keys(AGENT_ROLE_DESCRIPTIONS).length} specialized agents across {AGENT_CATEGORIES.length} categories
                            </Typography>

                            {/* Search Bar */}
                            <Box className="agent-search-container">
                                <input
                                    type="text"
                                    className="agent-search-input"
                                    placeholder="Search agents by name, description, or capability..."
                                    value={agentSearchQuery}
                                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                                />
                                <span className="agent-search-icon">🔍</span>
                                {agentSearchQuery && (
                                    <button
                                        className="search-clear-btn"
                                        onClick={() => setAgentSearchQuery('')}
                                    >
                                        ✕
                                    </button>
                                )}
                            </Box>

                            {/* Category Tabs */}
                            <Box className="agent-category-tabs">
                                <button
                                    className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    <span className="category-tab-icon">🌟</span>
                                    All Agents
                                    <span className="category-tab-count">{Object.keys(AGENT_ROLE_DESCRIPTIONS).length}</span>
                                </button>
                                {AGENT_CATEGORIES.map((category) => (
                                    <button
                                        key={category.id}
                                        className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(category.id)}
                                    >
                                        <span className="category-tab-icon">{category.icon}</span>
                                        {category.name}
                                        <span className="category-tab-count">{category.agents.length}</span>
                                    </button>
                                ))}
                            </Box>

                            {/* Filter Pills */}
                            <Box className="filter-pills-container">
                                <button
                                    className={`filter-pill ${difficultyFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setDifficultyFilter('all')}
                                >
                                    All Levels
                                </button>
                                <button
                                    className={`filter-pill ${difficultyFilter === 'beginner' ? 'active' : ''}`}
                                    onClick={() => setDifficultyFilter('beginner')}
                                >
                                    ⭐ Beginner
                                </button>
                                <button
                                    className={`filter-pill ${difficultyFilter === 'intermediate' ? 'active' : ''}`}
                                    onClick={() => setDifficultyFilter('intermediate')}
                                >
                                    ⭐⭐ Intermediate
                                </button>
                                <button
                                    className={`filter-pill ${difficultyFilter === 'advanced' ? 'active' : ''}`}
                                    onClick={() => setDifficultyFilter('advanced')}
                                >
                                    ⭐⭐⭐ Advanced
                                </button>
                            </Box>

                            {/* Results Count */}
                            <Box className="results-count">
                                Showing <span className="results-count-number">{getFilteredAgents().length}</span> agents
                            </Box>

                            {/* Agent Cards Grid */}
                            <Box className="agent-cards-grid">
                                {getFilteredAgents().length > 0 ? (
                                    getFilteredAgents().map((role) => {
                                        const roleInfo = AGENT_ROLE_DESCRIPTIONS[role];
                                        const isSelected = formData.ai_role === role;

                                        return (
                                            <Box
                                                key={role}
                                                className={`agent-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleInputChange('ai_role', role)}
                                            >
                                                <Box className="agent-card-header">
                                                    <Box
                                                        className="agent-card-icon"
                                                        sx={{ borderColor: roleInfo.color }}
                                                    >
                                                        {roleInfo.icon}
                                                    </Box>
                                                    <Box className="agent-card-check">✓</Box>
                                                </Box>

                                                <Typography className="agent-card-title">
                                                    {roleInfo.title}
                                                </Typography>

                                                <Typography className="agent-card-description">
                                                    {roleInfo.description}
                                                </Typography>

                                                <Box className="agent-card-tags">
                                                    {roleInfo.specialties.slice(0, 3).map((specialty, idx) => (
                                                        <span key={idx} className="agent-card-tag">
                                                            {specialty}
                                                        </span>
                                                    ))}
                                                    {roleInfo.specialties.length > 3 && (
                                                        <span className="agent-card-tag">
                                                            +{roleInfo.specialties.length - 3}
                                                        </span>
                                                    )}
                                                </Box>

                                                <Box className="agent-card-footer">
                                                    <span className={`difficulty-badge ${roleInfo.difficulty}`}>
                                                        {roleInfo.difficulty === 'beginner' && '⭐'}
                                                        {roleInfo.difficulty === 'intermediate' && '⭐⭐'}
                                                        {roleInfo.difficulty === 'advanced' && '⭐⭐⭐'}
                                                        {roleInfo.difficulty.charAt(0).toUpperCase() + roleInfo.difficulty.slice(1)}
                                                    </span>
                                                    <Tooltip title={roleInfo.useCases.join(' • ')} arrow>
                                                        <span className="agent-card-usecases">
                                                            <InfoIcon sx={{ fontSize: 14 }} />
                                                            {roleInfo.useCases.length} use cases
                                                        </span>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Box className="agent-empty-state" sx={{ gridColumn: '1 / -1' }}>
                                        <span className="agent-empty-state-icon">🔍</span>
                                        <Typography className="agent-empty-state-title">
                                            No agents found
                                        </Typography>
                                        <Typography className="agent-empty-state-text">
                                            Try adjusting your search or filters to find more agents
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Selected Agent Preview */}
                            {formData.ai_role && formData.ai_role !== AgentRole.CUSTOM && (
                                <Box className="selected-agent-preview">
                                    <Box className="selected-agent-header">
                                        <Box
                                            className="selected-agent-icon"
                                            sx={{ borderColor: AGENT_ROLE_DESCRIPTIONS[formData.ai_role].color }}
                                        >
                                            {AGENT_ROLE_DESCRIPTIONS[formData.ai_role].icon}
                                        </Box>
                                        <Box className="selected-agent-info">
                                            <Typography className="selected-agent-title">
                                                {AGENT_ROLE_DESCRIPTIONS[formData.ai_role].title}
                                            </Typography>
                                            <Typography className="selected-agent-category">
                                                {AGENT_ROLE_DESCRIPTIONS[formData.ai_role].category} Agent
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box className="selected-agent-details">
                                        <Box className="selected-agent-detail-item">
                                            <Typography className="selected-agent-detail-label">
                                                Description
                                            </Typography>
                                            <Typography className="selected-agent-detail-value">
                                                {AGENT_ROLE_DESCRIPTIONS[formData.ai_role].description}
                                            </Typography>
                                        </Box>

                                        <Box className="selected-agent-detail-item">
                                            <Typography className="selected-agent-detail-label">
                                                Capabilities
                                            </Typography>
                                            <Box className="selected-agent-specialties">
                                                {AGENT_ROLE_DESCRIPTIONS[formData.ai_role].specialties.map((specialty, idx) => (
                                                    <span key={idx} className="selected-agent-specialty">
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {/* Custom Role Input */}
                            {formData.ai_role === AgentRole.CUSTOM && (
                                <Box sx={{ mt: 3 }}>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Custom Role Description"
                                        placeholder="Describe your custom agent role..."
                                        value={formData.custom_role || ''}
                                        onChange={(e) => handleInputChange('custom_role', e.target.value)}
                                        multiline
                                        rows={3}
                                        InputLabelProps={{
                                            style: { color: '#AAAAAA' },
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            style: { color: '#FFFFFF', backgroundColor: '#1a2332', borderRadius: '12px' },
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                '& fieldset': {
                                                    borderColor: '#555',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#00F3FF',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#00F3FF',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            )}

                            {/* Interaction Mode (show after selecting an agent) */}
                            {formData.ai_role && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="body2" sx={{ color: '#AAAAAA', mb: 2 }}>
                                        Interaction Mode
                                    </Typography>
                                    <FormControl fullWidth>
                                        <Select
                                            value={formData.mode || AgentMode.TEXT}
                                            onChange={(e) => handleInputChange('mode', e.target.value)}
                                            open={modeSelectOpen}
                                            onOpen={() => setModeSelectOpen(true)}
                                            onClose={() => setModeSelectOpen(false)}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#1a2332',
                                                    color: '#FFFFFF',
                                                    borderRadius: '14px',
                                                },
                                                '.MuiSvgIcon-root': {
                                                    color: '#FFFFFF',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: '#2A2F3E',
                                                        color: '#FFFFFF',
                                                        borderRadius: '12px',
                                                        '& .MuiMenuItem-root': {
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0, 243, 255, 0.1)',
                                                            },
                                                            '&.Mui-selected': {
                                                                bgcolor: 'rgba(0, 243, 255, 0.15)',
                                                            },
                                                        },
                                                    }
                                                }
                                            }}
                                        >
                                            <MenuItem value={AgentMode.TEXT}>💬 Text Only</MenuItem>
                                            <MenuItem value={AgentMode.AUDIO}>🎤 Audio Enabled</MenuItem>
                                            <MenuItem value={AgentMode.VIDEO}>📹 Video Enabled</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </Box>
                    )}

                    {currentStep === 3 && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF', mb: 1 }}>
                                Generation Parameters
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, color: '#AAAAAA' }}>
                                Configure AI model settings, use templates, or test your configuration in the sandbox.
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                gap: 1,
                                mb: 3,
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                pb: 2
                            }}>
                                <Button
                                    size="small"
                                    onClick={() => setActiveParameterTab('intelligence')}
                                    sx={{
                                        color: activeParameterTab === 'intelligence' ? '#00F3FF' : '#888',
                                        bgcolor: activeParameterTab === 'intelligence' ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        border: activeParameterTab === 'intelligence' ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                                        borderRadius: '8px',
                                        px: 2,
                                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.05)' }
                                    }}
                                >
                                    🧠 AI Intelligence
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setActiveParameterTab('templates')}
                                    sx={{
                                        color: activeParameterTab === 'templates' ? '#00F3FF' : '#888',
                                        bgcolor: activeParameterTab === 'templates' ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        border: activeParameterTab === 'templates' ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                                        borderRadius: '8px',
                                        px: 2,
                                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.05)' }
                                    }}
                                >
                                    📋 Templates
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setActiveParameterTab('sandbox')}
                                    sx={{
                                        color: activeParameterTab === 'sandbox' ? '#00F3FF' : '#888',
                                        bgcolor: activeParameterTab === 'sandbox' ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        border: activeParameterTab === 'sandbox' ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                                        borderRadius: '8px',
                                        px: 2,
                                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.05)' }
                                    }}
                                >
                                    🧪 Sandbox
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setActiveParameterTab('analytics')}
                                    sx={{
                                        color: activeParameterTab === 'analytics' ? '#00F3FF' : '#888',
                                        bgcolor: activeParameterTab === 'analytics' ? 'rgba(0, 243, 255, 0.1)' : 'transparent',
                                        border: activeParameterTab === 'analytics' ? '1px solid rgba(0, 243, 255, 0.3)' : '1px solid transparent',
                                        borderRadius: '8px',
                                        px: 2,
                                        '&:hover': { bgcolor: 'rgba(0, 243, 255, 0.05)' }
                                    }}
                                >
                                    📊 Analytics
                                </Button>
                            </Box>

                            <Box sx={{
                                bgcolor: 'rgba(26, 35, 50, 0.5)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                minHeight: '400px',
                                maxHeight: '500px',
                                overflowY: 'auto'
                            }}>
                                {activeParameterTab === 'intelligence' && (
                                    <ParameterIntelligencePanel
                                        config={formData.config || {}}
                                        agentRole={formData.ai_role}
                                        onConfigChange={handleConfigChange}
                                        onAdvancedSettingsChange={handleAdvancedSettingsChange}
                                    />
                                )}

                                {activeParameterTab === 'templates' && (
                                    <TemplateMarketplace
                                        onTemplateSelect={handleTemplateSelect}
                                        selectedTemplateId={selectedTemplate?.id}
                                        agentRole={formData.ai_role}
                                    />
                                )}

                                {activeParameterTab === 'sandbox' && (
                                    <ParameterSandbox
                                        config={formData.config || {}}
                                        agentRole={formData.ai_role}
                                        onConfigChange={handleConfigChange}
                                    />
                                )}

                                {activeParameterTab === 'analytics' && (
                                    <AgentPerformanceAnalytics
                                        config={formData.config || {}}
                                        agentRole={formData.ai_role}
                                    />
                                )}
                            </Box>

                            {selectedTemplate && (
                                <Box sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: 'rgba(0, 243, 255, 0.05)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0, 243, 255, 0.2)'
                                }}>
                                    <Typography sx={{ color: '#00F3FF', fontSize: '0.85rem', fontWeight: 600 }}>
                                        ✓ Template Applied: {selectedTemplate.name}
                                    </Typography>
                                    <Typography sx={{ color: '#888', fontSize: '0.75rem', mt: 0.5 }}>
                                        Model: {selectedTemplate.config?.model || 'gpt-4-turbo'} •
                                        Temp: {selectedTemplate.config?.temperature || 0.7} •
                                        Tokens: {selectedTemplate.config?.max_tokens || 150}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mt: 2.5, p: 2, bgcolor: 'rgba(30, 35, 48, 0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, mb: 1.5 }}>
                                    Security & Governance
                                </Typography>

                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ color: '#AAAAAA' }}>Security Profile</InputLabel>
                                        <Select
                                            value={(formData.config?.security_profile as any) || 'standard'}
                                            label="Security Profile"
                                            onChange={(e) => handleConfigChange({ security_profile: e.target.value as any })}
                                            sx={{ color: '#FFFFFF', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' } }}
                                        >
                                            <MenuItem value={'standard'}>Standard</MenuItem>
                                            <MenuItem value={'regulated'}>Regulated</MenuItem>
                                            <MenuItem value={'high_security'}>High Security</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth>
                                        <InputLabel sx={{ color: '#AAAAAA' }}>Policy Mode</InputLabel>
                                        <Select
                                            value={(formData.config?.policy_mode as any) || 'log_only'}
                                            label="Policy Mode"
                                            onChange={(e) => handleConfigChange({ policy_mode: e.target.value as any })}
                                            sx={{ color: '#FFFFFF', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' } }}
                                        >
                                            <MenuItem value={'log_only'}>Log Only</MenuItem>
                                            <MenuItem value={'enforce'}>Enforce</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Allowed Domains (comma-separated)"
                                        value={(formData.config?.allowed_domains || []).join(', ')}
                                        onChange={(e) => handleConfigChange({ allowed_domains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        sx={{
                                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                                            '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Blocked Domains (comma-separated)"
                                        value={(formData.config?.blocked_domains || []).join(', ')}
                                        onChange={(e) => handleConfigChange({ blocked_domains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        sx={{
                                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                                            '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Tools Allowlist (comma-separated)"
                                        value={(formData.config?.tools_allowlist || []).join(', ')}
                                        onChange={(e) => handleConfigChange({ tools_allowlist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        sx={{
                                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                                            '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Tools Blocklist (comma-separated)"
                                        value={(formData.config?.tools_blocklist || []).join(', ')}
                                        onChange={(e) => handleConfigChange({ tools_blocklist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        sx={{
                                            '& .MuiInputLabel-root': { color: '#AAAAAA' },
                                            '& .MuiOutlinedInput-root': { color: '#FFFFFF', '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' } }
                                        }}
                                    />
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5, mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            checked={!!formData.config?.enforce_domain_allowlist}
                                            onChange={(e) => handleConfigChange({ enforce_domain_allowlist: e.target.checked })}
                                            sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }}
                                        />
                                        <Typography sx={{ color: '#AAAAAA', fontSize: '0.9rem' }}>Enforce Domain Allowlist</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            checked={!!formData.config?.enforce_tools_allowlist}
                                            onChange={(e) => handleConfigChange({ enforce_tools_allowlist: e.target.checked })}
                                            sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }}
                                        />
                                        <Typography sx={{ color: '#AAAAAA', fontSize: '0.9rem' }}>Enforce Tools Allowlist</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            checked={!!formData.config?.block_risky_actions}
                                            onChange={(e) => handleConfigChange({ block_risky_actions: e.target.checked })}
                                            sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }}
                                        />
                                        <Typography sx={{ color: '#AAAAAA', fontSize: '0.9rem' }}>Block Risky Actions</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Checkbox
                                            checked={!!formData.config?.approval_required}
                                            onChange={(e) => handleConfigChange({ approval_required: e.target.checked })}
                                            sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }}
                                        />
                                        <Typography sx={{ color: '#AAAAAA', fontSize: '0.9rem' }}>Approval Required (Write Actions)</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(5, 46, 70, 0.4)', borderRadius: '12px', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
                                    <Typography sx={{ color: '#00F3FF', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.9rem' }}>
                                        <ScienceIcon sx={{ fontSize: 18 }} /> Advanced Intelligence & Autonomy
                                    </Typography>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                                        {[
                                            { id: 'semantic_action_memory_enabled', label: 'Semantic Action Memory' },
                                            { id: 'autonomous_tool_synthesis_enabled', label: 'Autonomous Tool Synthesis' },
                                            { id: 'adversarial_quality_loop_enabled', label: 'Adversarial Quality Loop' },
                                            { id: 'visual_consistency_verification_enabled', label: 'Visual Verification' },
                                            { id: 'reactive_environment_masking_enabled', label: 'Reactive Stealth Masking' },
                                            { id: 'speculative_path_harvesting_enabled', label: 'Speculative Harvesting' },
                                            { id: 'recursive_task_decomposition_enabled', label: 'Recursive Task Decomposition' },
                                            { id: 'automated_sandbox_provisioning_enabled', label: 'Automated Sandboxing' },
                                            { id: 'knowledge_graph_cross_pollination_enabled', label: 'Knowledge Cross-Pollination' },
                                            { id: 'agentic_discourse_debate_enabled', label: 'Agentic Discourse (Debate)' }
                                        ].map(feature => (
                                            <Box key={feature.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    size="small"
                                                    checked={!!(formData.config as any)?.[feature.id]}
                                                    onChange={(e) => handleConfigChange({ [feature.id]: e.target.checked })}
                                                    sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' }, p: 0.5 }}
                                                />
                                                <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem' }}>{feature.label}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {currentStep === 4 && (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF' }}>
                                Knowledge Base
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 3, color: '#AAAAAA' }}>
                                Select knowledge sources your agent can reference when answering questions.
                            </Typography>

                            <KnowledgeSelector
                                selectedIds={selectedKnowledgeIds}
                                onSelectionChange={(ids: number[]) => {
                                    setSelectedKnowledgeIds(ids);
                                    onKnowledgeSelect(ids);
                                }}
                            />
                        </Box>
                    )}

                    {currentStep === 5 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: '#FFFFFF', mb: 1 }}>
                                Agent Actions
                            </Typography>

                            <Typography variant="body2" paragraph sx={{ color: '#AAAAAA', mb: 3 }}>
                                Select what actions this agent can perform
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1 }}>
                                    Skills
                                </Typography>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Skills</InputLabel>
                                    <Select
                                        multiple
                                        value={selectedSkillIds}
                                        onChange={(e) => handleSkillSelectionChange(e.target.value)}
                                        disabled={skillsLoading}
                                        MenuProps={{
                                            PaperProps: {
                                                sx: {
                                                    bgcolor: '#2A2F3E',
                                                    borderRadius: '14px',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                                }
                                            }
                                        }}
                                        sx={{
                                            color: '#FFFFFF',
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: 'rgba(26, 35, 50, 0.7)',
                                                borderRadius: '14px'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(255, 255, 255, 0.2)'
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'rgba(0, 243, 255, 0.5)'
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00F3FF'
                                            },
                                            '& .MuiSvgIcon-root': {
                                                color: 'rgba(255, 255, 255, 0.7)'
                                            }
                                        }}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {(selected as string[]).map((id) => {
                                                    const s = availableSkills.find(x => String(x.id) === String(id));
                                                    return (
                                                        <Chip
                                                            key={id}
                                                            label={s?.name || id}
                                                            size="small"
                                                            sx={{ bgcolor: 'rgba(0, 243, 255, 0.12)', color: '#00F3FF', border: '1px solid rgba(0, 243, 255, 0.25)' }}
                                                        />
                                                    );
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {skillsLoading && (
                                            <MenuItem value="" disabled>
                                                Loading skills...
                                            </MenuItem>
                                        )}
                                        {!skillsLoading && availableSkills.map((s) => (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <FormHelperText sx={{ color: '#AAAAAA' }}>
                                        Optional. Selected skills will be applied to this agent at runtime.
                                    </FormHelperText>
                                </FormControl>
                            </Box>

                            <Box sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                                gap: 2.5,
                            }}>
                                <Box
                                    onClick={() => { }}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: 'rgba(30, 35, 48, 0.6)',
                                        border: '2px solid rgba(0, 255, 255, 0.8)',
                                        boxShadow: '0 0 25px rgba(0, 255, 255, 0.2)',
                                        cursor: 'not-allowed',
                                        opacity: 0.9,
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>💬</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Text Output
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Make text responses (always enabled)
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={() => handleActionChange('send_file', !isActionSelected('send_file'))}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: isActionSelected('send_file') ? 'rgba(0, 255, 255, 0.05)' : 'rgba(30, 35, 48, 0.6)',
                                        border: isActionSelected('send_file') ? '2px solid rgba(0, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isActionSelected('send_file') ? '0 0 25px rgba(0, 255, 255, 0.2)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            border: '1px solid rgba(0, 255, 255, 0.4)',
                                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {isActionSelected('send_file') && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>📎</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Send File
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Share files and documents with users
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={() => handleActionChange('send_link', !isActionSelected('send_link'))}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: isActionSelected('send_link') ? 'rgba(0, 255, 255, 0.05)' : 'rgba(30, 35, 48, 0.6)',
                                        border: isActionSelected('send_link') ? '2px solid rgba(0, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isActionSelected('send_link') ? '0 0 25px rgba(0, 255, 255, 0.2)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            border: '1px solid rgba(0, 255, 255, 0.4)',
                                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {isActionSelected('send_link') && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>🔗</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Send Link
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Share relevant web links and resources
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={() => handleActionChange('SEND_MAIL', !isActionSelected('SEND_MAIL'))}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: isActionSelected('SEND_MAIL') ? 'rgba(0, 255, 255, 0.05)' : 'rgba(30, 35, 48, 0.6)',
                                        border: isActionSelected('SEND_MAIL') ? '2px solid rgba(0, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isActionSelected('SEND_MAIL') ? '0 0 25px rgba(0, 255, 255, 0.2)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            border: '1px solid rgba(0, 255, 255, 0.4)',
                                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {isActionSelected('SEND_MAIL') && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>📧</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Send Email
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Send responses and summaries via email
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={() => handleActionChange('EXECUTE_CODE', !isActionSelected('EXECUTE_CODE'))}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: isActionSelected('EXECUTE_CODE') ? 'rgba(0, 255, 255, 0.05)' : 'rgba(30, 35, 48, 0.6)',
                                        border: isActionSelected('EXECUTE_CODE') ? '2px solid rgba(0, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isActionSelected('EXECUTE_CODE') ? '0 0 25px rgba(0, 255, 255, 0.2)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            border: '1px solid rgba(0, 255, 255, 0.4)',
                                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {isActionSelected('EXECUTE_CODE') && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>💻</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Code Execution
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Execute Python/JavaScript code for calculations and data manipulation
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={() => handleActionChange('SEARCH_INTERNET', !isActionSelected('SEARCH_INTERNET'))}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        minHeight: '140px',
                                        borderRadius: '12px',
                                        bgcolor: isActionSelected('SEARCH_INTERNET') ? 'rgba(0, 255, 255, 0.05)' : 'rgba(30, 35, 48, 0.6)',
                                        border: isActionSelected('SEARCH_INTERNET') ? '2px solid rgba(0, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        boxShadow: isActionSelected('SEARCH_INTERNET') ? '0 0 25px rgba(0, 255, 255, 0.2)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            border: '1px solid rgba(0, 255, 255, 0.4)',
                                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.15)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}
                                >
                                    {isActionSelected('SEARCH_INTERNET') && (
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '24px', mr: 1.5 }}>🌐</Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#FFFFFF' }}>
                                            Advanced Internet Search
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#A0A8B8', lineHeight: 1.5 }}>
                                        Comprehensive web research with browser automation
                                    </Typography>
                                </Box>
                            </Box>

                            {isActionSelected('SEND_MAIL') && (
                                <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(26, 35, 50, 0.7)', borderRadius: '20px', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 2 }}>
                                        Email Configuration
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Agent Email Address"
                                        type="email"
                                        value={formData.config?.email_config?.email || ''}
                                        onChange={(e) => {
                                            const emailConfig = {
                                                ...formData.config?.email_config,
                                                email: e.target.value,
                                                verified: false
                                            };
                                            handleInputChange('config', {
                                                ...formData.config,
                                                email_config: emailConfig
                                            });
                                            setVerificationMessage('');
                                        }}
                                        margin="normal"
                                        size="small"
                                        InputLabelProps={{
                                            style: { color: '#AAAAAA' },
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            style: { color: '#FFFFFF' },
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#1a2332',
                                                color: '#FFFFFF',
                                                '& fieldset': {
                                                    borderColor: '#555',
                                                },
                                                '&:hover fieldset': {
                                                    borderColor: '#00F3FF',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#00F3FF',
                                                },
                                            },
                                        }}
                                    />

                                    {formData.config?.email_config?.email && (
                                        <Box sx={{ mt: 1, mb: 2 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleSendVerificationCode}
                                                disabled={isVerificationLoading || !formData.config?.email_config?.email}
                                                sx={{
                                                    borderColor: '#00F3FF',
                                                    color: '#00F3FF',
                                                    '&:hover': {
                                                        borderColor: '#00F3FF',
                                                        bgcolor: 'rgba(0, 243, 255, 0.1)',
                                                    },
                                                    '&:disabled': {
                                                        borderColor: '#666',
                                                        color: '#666',
                                                    },
                                                }}
                                            >
                                                {isVerificationLoading ? 'Sending...' : 'Send Verification Code'}
                                            </Button>
                                            <Typography variant="caption" sx={{ color: '#AAAAAA', ml: 2 }}>
                                                {formData.config?.email_config?.verified ? '✅ Verified' : '⚠️ Not verified'}
                                            </Typography>
                                            {verificationMessage && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        color: verificationMessage.includes('successfully') ? '#4CAF50' : '#FF6B6B',
                                                        display: 'block',
                                                        mt: 1
                                                    }}
                                                >
                                                    {verificationMessage}
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    <FormGroup>
                                        <Typography variant="caption" sx={{ color: '#AAAAAA', mb: 1 }}>
                                            Advanced SMTP Settings (Optional)
                                        </Typography>

                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                                            <TextField
                                                label="SMTP Host"
                                                size="small"
                                                value={formData.config?.email_config?.smtp_host || ''}
                                                onChange={(e) => {
                                                    const emailConfig = {
                                                        ...formData.config?.email_config,
                                                        smtp_host: e.target.value
                                                    };
                                                    handleInputChange('config', {
                                                        ...formData.config,
                                                        email_config: emailConfig
                                                    });
                                                }}
                                                InputLabelProps={{ style: { color: '#AAAAAA' } }}
                                                InputProps={{ style: { color: '#FFFFFF' } }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        backgroundColor: '#1a2332',
                                                        color: '#FFFFFF',
                                                        '& fieldset': { borderColor: '#555' },
                                                        '&:hover fieldset': { borderColor: '#00F3FF' },
                                                        '&.Mui-focused fieldset': { borderColor: '#00F3FF' },
                                                    },
                                                }}
                                            />

                                            <TextField
                                                label="SMTP Port"
                                                type="number"
                                                size="small"
                                                value={formData.config?.email_config?.smtp_port || ''}
                                                onChange={(e) => {
                                                    const emailConfig = {
                                                        ...formData.config?.email_config,
                                                        smtp_port: parseInt(e.target.value) || undefined
                                                    };
                                                    handleInputChange('config', {
                                                        ...formData.config,
                                                        email_config: emailConfig
                                                    });
                                                }}
                                                InputLabelProps={{ style: { color: '#AAAAAA' } }}
                                                InputProps={{ style: { color: '#FFFFFF' } }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': { borderColor: '#555' },
                                                        '&:hover fieldset': { borderColor: '#00F3FF' },
                                                        '&.Mui-focused fieldset': { borderColor: '#00F3FF' },
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </FormGroup>
                                </Box>
                            )}

                            {isActionSelected('SEARCH_INTERNET') && (
                                <Box sx={{ mt: 3, p: 3, bgcolor: 'rgba(26, 35, 50, 0.7)', borderRadius: '20px', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#00F3FF', mb: 2 }}>
                                        Search Configuration
                                    </Typography>

                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel sx={{ color: '#AAAAAA' }}>Search Depth</InputLabel>
                                        <Select
                                            value={formData.config?.search_config?.search_depth || 'standard'}
                                            onChange={(e) => {
                                                const searchConfig = {
                                                    ...formData.config?.search_config,
                                                    search_depth: e.target.value as 'quick' | 'standard' | 'comprehensive'
                                                };
                                                handleInputChange('config', {
                                                    ...formData.config,
                                                    search_config: searchConfig
                                                });
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    backgroundColor: '#1a2332',
                                                    color: '#FFFFFF',
                                                    '& fieldset': { borderColor: '#555' },
                                                    '&:hover fieldset': { borderColor: '#00F3FF' },
                                                    '&.Mui-focused fieldset': { borderColor: '#00F3FF' },
                                                },
                                                '.MuiSvgIcon-root': {
                                                    color: '#FFFFFF',
                                                },
                                            }}
                                            MenuProps={{
                                                PaperProps: {
                                                    sx: {
                                                        bgcolor: '#333',
                                                        color: '#FFFFFF',
                                                        '& .MuiMenuItem-root': {
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                            },
                                                        },
                                                    }
                                                }
                                            }}
                                        >
                                            <MenuItem value="quick">⚡ Quick (1-3 sources)</MenuItem>
                                            <MenuItem value="standard">🔍 Standard (3-5 sources)</MenuItem>
                                            <MenuItem value="comprehensive">📚 Comprehensive (5-10 sources)</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        label="Maximum Sources"
                                        type="number"
                                        value={formData.config?.search_config?.max_sources || 5}
                                        onChange={(e) => {
                                            const searchConfig = {
                                                ...formData.config?.search_config,
                                                max_sources: parseInt(e.target.value) || 5
                                            };
                                            handleInputChange('config', {
                                                ...formData.config,
                                                search_config: searchConfig
                                            });
                                        }}
                                        margin="normal"
                                        size="small"
                                        InputLabelProps={{
                                            style: { color: '#AAAAAA' },
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            style: { color: '#FFFFFF' },
                                            inputProps: { min: 1, max: 20 }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                backgroundColor: '#1a2332',
                                                color: '#FFFFFF',
                                                '& fieldset': { borderColor: '#555' },
                                                '&:hover fieldset': { borderColor: '#00F3FF' },
                                                '&.Mui-focused fieldset': { borderColor: '#00F3FF' },
                                            },
                                        }}
                                    />

                                    <FormGroup sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Checkbox
                                                checked={formData.config?.search_config?.enable_browser_automation !== false}
                                                onChange={(e) => {
                                                    const searchConfig = {
                                                        ...formData.config?.search_config,
                                                        enable_browser_automation: e.target.checked
                                                    };
                                                    handleInputChange('config', {
                                                        ...formData.config,
                                                        search_config: searchConfig
                                                    });
                                                }}
                                                sx={{
                                                    color: '#AAAAAA',
                                                    '&.Mui-checked': { color: '#00F3FF' },
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                                🤖 Enable Browser Automation
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Checkbox
                                                checked={formData.config?.search_config?.fact_checking !== false}
                                                onChange={(e) => {
                                                    const searchConfig = {
                                                        ...formData.config?.search_config,
                                                        fact_checking: e.target.checked
                                                    };
                                                    handleInputChange('config', {
                                                        ...formData.config,
                                                        search_config: searchConfig
                                                    });
                                                }}
                                                sx={{
                                                    color: '#AAAAAA',
                                                    '&.Mui-checked': { color: '#00F3FF' },
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
                                                ✅ Enable Fact Checking
                                            </Typography>
                                        </Box>

                                        <FormControl fullWidth margin="normal" size="small">
                                            <InputLabel sx={{ color: '#AAAAAA' }}>Result Filtering</InputLabel>
                                            <Select
                                                value={formData.config?.search_config?.result_filtering || 'basic'}
                                                onChange={(e) => {
                                                    const searchConfig = {
                                                        ...formData.config?.search_config,
                                                        result_filtering: e.target.value as 'basic' | 'advanced'
                                                    };
                                                    handleInputChange('config', {
                                                        ...formData.config,
                                                        search_config: searchConfig
                                                    });
                                                }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        backgroundColor: '#1a2332',
                                                        color: '#FFFFFF',
                                                        '& fieldset': { borderColor: '#555' },
                                                        '&:hover fieldset': { borderColor: '#00F3FF' },
                                                        '&.Mui-focused fieldset': { borderColor: '#00F3FF' },
                                                    },
                                                    '.MuiSvgIcon-root': {
                                                        color: '#FFFFFF',
                                                    },
                                                }}
                                                MenuProps={{
                                                    PaperProps: {
                                                        sx: {
                                                            bgcolor: '#333',
                                                            color: '#FFFFFF',
                                                            '& .MuiMenuItem-root': {
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                                },
                                                                bgcolor: 'rgba(0, 243, 255, 0.08)',
                                                            },
                                                        }
                                                    }
                                                }}
                                            >
                                                <MenuItem value="basic">🔍 Basic Filtering</MenuItem>
                                                <MenuItem value="advanced">🎯 Advanced Filtering</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </FormGroup>
                                </Box>
                            )}
                        </Box>
                    )}

                    {currentStep === 6 && (
                        <Box sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ color: '#FFFFFF', mb: 1.5, fontSize: 24, fontWeight: 600 }}
                            >
                                Review
                            </Typography>

                            <Typography
                                variant="body2"
                                paragraph
                                sx={{ color: '#A0A7B5', mb: 4 }}
                            >
                                Review your agent configuration before creating it
                            </Typography>

                            <Paper
                                sx={{
                                    p: 3,
                                    mt: 3,
                                    bgcolor: '#111722',
                                    borderRadius: '12px',
                                    boxShadow: '0px 4px 18px rgba(0,0,0,0.35)',
                                    border: '1px solid #1C2230'
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#00E5FF',
                                        mb: 2,
                                        fontSize: 18,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Basic Information
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Name:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Description:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.description || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Role:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.ai_role}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Mode:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.mode}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            <Paper
                                sx={{
                                    p: 3,
                                    mt: 3,
                                    bgcolor: '#111722',
                                    borderRadius: '12px',
                                    boxShadow: '0px 4px 18px rgba(0,0,0,0.35)',
                                    border: '1px solid #1C2230'
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#00E5FF',
                                        mb: 2,
                                        fontSize: 18,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Response Configuration
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Response Style:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.response_style === 0 ? 'Very Formal' :
                                                formData.response_style === 0.25 ? 'Formal' :
                                                    formData.response_style === 0.5 ? 'Balanced' :
                                                        formData.response_style === 0.75 ? 'Casual' : 'Very Casual'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Response Length:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.response_length} words
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            <Paper
                                sx={{
                                    p: 3,
                                    mt: 3,
                                    bgcolor: '#111722',
                                    borderRadius: '12px',
                                    boxShadow: '0px 4px 18px rgba(0,0,0,0.35)',
                                    border: '1px solid #1C2230'
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#00E5FF',
                                        mb: 2,
                                        fontSize: 18,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Generation Parameters
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            AI Model:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.config?.model || 'gpt-4-turbo'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Temperature:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.config?.temperature ?? 0.7}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Max Tokens:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.config?.max_tokens ?? 150}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #1C2230' }}>
                                        <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                            Top-P:
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#FFFFFF', width: '70%', fontSize: 15 }}>
                                            {formData.config?.top_p ?? 0.9}
                                        </Typography>
                                    </Box>
                                    {selectedTemplate && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="body2" sx={{ color: '#A0A7B5', width: '30%', fontSize: 14 }}>
                                                Template:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#00F3FF', width: '70%', fontSize: 15 }}>
                                                {selectedTemplate.name}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>

                            <Paper
                                sx={{
                                    p: 3,
                                    mt: 3,
                                    bgcolor: '#111722',
                                    borderRadius: '12px',
                                    boxShadow: '0px 4px 18px rgba(0,0,0,0.35)',
                                    border: '1px solid #1C2230'
                                }}
                            >
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        color: '#00E5FF',
                                        mb: 2,
                                        fontSize: 18,
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Selected Actions
                                </Typography>
                                {(formData.actions || []).length > 0 ? (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
                                        {(formData.actions || []).map((action, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    bgcolor: 'transparent',
                                                    color: '#00E5FF',
                                                    borderRadius: '8px',
                                                    border: '1px solid #00E5FF',
                                                    px: 1.5,
                                                    py: 0.75,
                                                    fontSize: 14
                                                }}
                                            >
                                                {action.toUpperCase()}
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" sx={{ color: '#A0A7B5' }}>
                                        No actions selected
                                    </Typography>
                                )}
                            </Paper>
                        </Box>
                    )}

                </Box>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                    borderTop: '1px solid #333',
                    mt: 'auto'
                }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={prevStep}
                        variant="outlined"
                        sx={{
                            visibility: currentStep === 1 ? 'hidden' : 'visible',
                            borderColor: '#555',
                            color: '#AAAAAA',
                            '&:hover': {
                                borderColor: '#00F3FF',
                                color: '#FFFFFF',
                                backgroundColor: 'rgba(0, 243, 255, 0.08)'
                            }
                        }}
                    >
                        Back
                    </Button>

                    {isLoading ? (
                        <Button
                            variant="contained"
                            disabled
                            sx={{
                                bgcolor: '#555',
                                color: '#888',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                                Creating...
                            </Box>
                        </Button>
                    ) : (
                        <Button
                            endIcon={currentStep < STEPS.length ? <ArrowForwardIcon /> : undefined}
                            onClick={currentStep < STEPS.length ? nextStep : handleSubmit}
                            variant="contained"
                            sx={{
                                bgcolor: '#00F3FF',
                                color: '#000',
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 243, 255, 0.8)',
                                }
                            }}
                        >
                            {currentStep < STEPS.length ? 'Continue' : 'Create Agent'}
                        </Button>
                    )}
                </Box>
            </Paper>
        </Modal>
    );
}
