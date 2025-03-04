import React, { useState, useEffect } from 'react';
import { Agent, AgentConfig, AgentRole, AgentMode } from '../../types/agent';
import { CategoryItem } from '../../types/knowledge';
import { categoryService } from '../../services/api/category.service';
import './AgentCreationWizard.css';

export interface AgentCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (agentData: Partial<Agent>) => Promise<void>;
}

const steps = ['Basic Information', 'Configuration', 'Knowledge Base', 'Actions', 'Review'];

// Default agent configuration
const defaultConfig: AgentConfig = {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    language: 'en',
    response_style: 0.5, // Middle of formal to casual scale (0-1)
    response_length: 150, // Default token limit
    knowledge_base_ids: [],
    mode: AgentMode.TEXT,
    actions: []
};

// Available languages
const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' }
];

// Available action types
const actionTypes = [
    { id: 'text', name: 'Text Output' },
    { id: 'send_file', name: 'Send File' },
    { id: 'send_link', name: 'Send Link' },
    { id: 'custom', name: 'Custom Action' }
];

// Interface for agent data with required config
interface AgentFormData extends Partial<Omit<Agent, 'config'>> {
    config: AgentConfig;
    category_id?: number;
    selected_knowledge_ids: number[];
    selected_action_types: string[];
}

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Updated state to include all required agent properties
    const [agentData, setAgentData] = useState<AgentFormData>({
        name: '',
        description: '',
        ai_role: AgentRole.CUSTOMER_SUPPORT,
        config: defaultConfig,
        category_id: undefined,
        selected_knowledge_ids: [],
        selected_action_types: ['text']
    });

    // Fetch categories on component mount
    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    // Fetch knowledge items when category changes
    useEffect(() => {
        if (agentData.category_id) {
            fetchKnowledgeItems(agentData.category_id);
        }
    }, [agentData.category_id]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getCategories();
            setCategories(response.data);
            
            // Set first category as default if available
            if (response.data.length > 0 && !agentData.category_id) {
                setAgentData(prev => ({
                    ...prev,
                    category_id: response.data[0].id
                }));
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKnowledgeItems = async (categoryId: number) => {
        setLoading(true);
        try {
            const response = await categoryService.getCategoryItems(categoryId);
            setKnowledgeItems(response.data);
        } catch (error) {
            console.error('Failed to fetch knowledge items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            handleSubmit();
        } else {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async () => {
        try {
            // Prepare final agent data
            const finalAgentData = {
                name: agentData.name,
                ai_role: agentData.ai_role,
                language: agentData.config.language,
                mode: agentData.config.mode,
                response_style: agentData.config.response_style,
                response_length: agentData.config.response_length,
                owner_id: 1, // This will be ignored and replaced by the backend
                knowledge_item_ids: agentData.selected_knowledge_ids,
            };

            await onCreate(finalAgentData);
            setActiveStep(0);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to create agent:', error);
        }
    };

    const resetForm = () => {
        setAgentData({
            name: '',
            description: '',
            ai_role: AgentRole.CUSTOMER_SUPPORT,
            config: defaultConfig,
            category_id: categories.length > 0 ? categories[0].id : undefined,
            selected_knowledge_ids: [],
            selected_action_types: ['text']
        });
    };

    if (!isOpen) return null;

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0: // Basic Information
                return (
                    <div className="step-content">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Agent Name"
                            value={agentData.name}
                            onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                            required
                        />
                        
                        <textarea
                            className="textarea-field"
                            placeholder="Description"
                            rows={4}
                            value={agentData.description || ''}
                            onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                        />
                        
                        <div className="select-container">
                            <label>Agent Role</label>
                            <select
                                value={agentData.ai_role}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    ai_role: e.target.value as AgentRole
                                })}
                            >
                                <option value={AgentRole.CUSTOMER_SUPPORT}>Customer Support</option>
                                <option value={AgentRole.TECHNICAL_SUPPORT}>Technical Support</option>
                                <option value={AgentRole.SALES_SERVICES}>Sales Services</option>
                                <option value={AgentRole.CONSULTING}>Consulting Services</option>
                            </select>
                        </div>
                    </div>
                );
                
            case 1: // Configuration
                return (
                    <div className="step-content">
                        <div className="select-container">
                            <label>Language</label>
                            <select
                                value={agentData.config.language}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, language: e.target.value }
                                })}
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="select-container">
                            <label>Input/Output Mode</label>
                            <select
                                value={agentData.config.mode}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, mode: e.target.value as AgentMode }
                                })}
                            >
                                <option value={AgentMode.TEXT}>Text</option>
                                <option value={AgentMode.AUDIO}>Audio</option>
                                <option value={AgentMode.VIDEO}>Video</option>
                            </select>
                        </div>
                        
                        <div className="slider-container">
                            <label>Response Style: {agentData.config.response_style < 0.33 ? 'Formal' : agentData.config.response_style < 0.66 ? 'Balanced' : 'Casual'}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={agentData.config.response_style}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, response_style: parseFloat(e.target.value) }
                                })}
                            />
                        </div>
                        
                        <div className="slider-container">
                            <label>Response Length: {agentData.config.response_length} tokens</label>
                            <input
                                type="range"
                                min="50"
                                max="500"
                                step="50"
                                value={agentData.config.response_length}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, response_length: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </div>
                );
                
            case 2: // Knowledge Base
                return (
                    <div className="step-content">
                        <div className="select-container">
                            <label>Category</label>
                            <select
                                value={agentData.category_id}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    category_id: parseInt(e.target.value)
                                })}
                                disabled={categories.length === 0}
                            >
                                {categories.length === 0 ? (
                                    <option value="">No categories available</option>
                                ) : (
                                    categories.map(category => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                        
                        <h3 className="section-title">Select Knowledge Items</h3>
                        {loading ? (
                            <div className="loading">Loading knowledge items...</div>
                        ) : knowledgeItems.length === 0 ? (
                            <div className="empty-state">No knowledge items available for this category</div>
                        ) : (
                            <div className="checkbox-list">
                                {knowledgeItems.map(item => (
                                    <div key={item.id} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            id={`knowledge-${item.id}`}
                                            checked={agentData.selected_knowledge_ids.includes(item.id)}
                                            onChange={(e) => {
                                                const newSelectedIds = e.target.checked
                                                    ? [...agentData.selected_knowledge_ids, item.id]
                                                    : agentData.selected_knowledge_ids.filter(id => id !== item.id);
                                                setAgentData({
                                                    ...agentData,
                                                    selected_knowledge_ids: newSelectedIds
                                                });
                                            }}
                                        />
                                        <label htmlFor={`knowledge-${item.id}`}>
                                            {item.content_type === 'file' ? `📄 ${item.content.substring(0, 30)}...` :
                                             item.content_type === 'text' ? `📝 ${item.content.substring(0, 30)}...` :
                                             `🔗 ${item.url}`}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
                
            case 3: // Actions
                return (
                    <div className="step-content">
                        <h3 className="section-title">Agent Actions</h3>
                        <p className="description">Select what actions this agent can perform:</p>
                        
                        <div className="checkbox-list">
                            {actionTypes.map(action => (
                                <div key={action.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        id={`action-${action.id}`}
                                        checked={agentData.selected_action_types.includes(action.id)}
                                        onChange={(e) => {
                                            const newSelectedActions = e.target.checked
                                                ? [...agentData.selected_action_types, action.id]
                                                : agentData.selected_action_types.filter(id => id !== action.id);
                                            setAgentData({
                                                ...agentData,
                                                selected_action_types: newSelectedActions
                                            });
                                        }}
                                    />
                                    <label htmlFor={`action-${action.id}`}>{action.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
                
            case 4: // Review
                return (
                    <div className="step-content">
                        <h3 className="review-title">Review Configuration</h3>
                        
                        <div className="review-section">
                            <h4>Basic Information</h4>
                            <div className="review-item">
                                <strong>Name:</strong> {agentData.name}
                            </div>
                            <div className="review-item">
                                <strong>Description:</strong> {agentData.description || 'N/A'}
                            </div>
                            <div className="review-item">
                                <strong>Role:</strong> {agentData.ai_role}
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Configuration</h4>
                            <div className="review-item">
                                <strong>Language:</strong> {languages.find(l => l.code === agentData.config.language)?.name || agentData.config.language}
                            </div>
                            <div className="review-item">
                                <strong>Mode:</strong> {agentData.config.mode}
                            </div>
                            <div className="review-item">
                                <strong>Response Style:</strong> {agentData.config.response_style < 0.33 ? 'Formal' : agentData.config.response_style < 0.66 ? 'Balanced' : 'Casual'}
                            </div>
                            <div className="review-item">
                                <strong>Response Length:</strong> {agentData.config.response_length} tokens
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Knowledge Base</h4>
                            <div className="review-item">
                                <strong>Category:</strong> {categories.find(c => c.id === agentData.category_id)?.name || 'None'}
                            </div>
                            <div className="review-item">
                                <strong>Knowledge Items:</strong> {agentData.selected_knowledge_ids.length} selected
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Actions</h4>
                            <div className="review-item">
                                <strong>Enabled Actions:</strong>{' '}
                                {agentData.selected_action_types.map(actionId => 
                                    actionTypes.find(a => a.id === actionId)?.name
                                ).join(', ')}
                            </div>
                        </div>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <div className="agent-wizard-overlay">
            <div className="agent-wizard-container">
                <div className="wizard-header">
                    <h2>Create New Agent</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="wizard-progress">
                    {steps.map((label, index) => (
                        <div 
                            key={label} 
                            className={`progress-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
                        >
                            <div className="step-number">{index + 1}</div>
                            <div className="step-label">{label}</div>
                        </div>
                    ))}
                </div>
                
                <div className="wizard-content">
                    {renderStepContent(activeStep)}
                </div>
                
                <div className="wizard-actions">
                    <button 
                        className="button secondary"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                    >
                        Back
                    </button>
                    <button 
                        className="button primary"
                        onClick={handleNext}
                    >
                        {activeStep === steps.length - 1 ? 'Create' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};
