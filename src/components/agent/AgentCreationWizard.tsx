import React, { useState, useEffect } from 'react';
import { Agent, AgentConfig, AgentRole, AgentMode, AgentStatus } from '../../types/agent';
import { Category } from '../../types/knowledge';
import { categoryService } from '../../services/api/category.service';
import './AgentCreationWizard.css';

export interface AgentCreationWizardProps {
    open: boolean;
    onClose: () => void;
    onCreateAgent: (agentData: Partial<Agent>) => Promise<void>;
    currentStep: number;
    onStepChange: (step: number) => void;
    agentData: Partial<Agent>;
    onAgentDataChange: (data: Partial<Agent>) => void;
    onKnowledgeSelect: (ids: number[]) => void;
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
    knowledge_item_ids: [],
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
interface AgentFormData {
    name: string;
    description: string;
    ai_role: AgentRole;
    config: AgentConfig;
    category_id?: number;
    selected_knowledge_ids: number[];
    selected_action_types: string[];
}

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
    open,
    onClose,
    onCreateAgent,
    currentStep,
    onStepChange,
    agentData,
    onAgentDataChange,
    onKnowledgeSelect
}) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Initialize form data from props or defaults
    const [formData, setFormData] = useState<AgentFormData>({
        name: agentData.name || '',
        description: agentData.description || '',
        ai_role: agentData.ai_role || AgentRole.SALES_SERVICES,
        config: {
            ...defaultConfig,
            ...(agentData.config || {})
        },
        category_id: undefined,
        selected_knowledge_ids: [],
        selected_action_types: []
    });

    // Fetch categories on component mount
    useEffect(() => {
        if (open) {
            fetchCategories();
        }
    }, [open]);

    // Fetch knowledge items when category changes
    useEffect(() => {
        if (formData.category_id) {
            fetchKnowledgeItems(formData.category_id);
        }
    }, [formData.category_id]);

    // Update parent component when form data changes
    useEffect(() => {
        const updatedAgentData: Partial<Agent> = {
            name: formData.name,
            description: formData.description,
            ai_role: formData.ai_role,
            config: formData.config,
            status: AgentStatus.INACTIVE
        };
        onAgentDataChange(updatedAgentData);
        
        // Update selected knowledge IDs
        onKnowledgeSelect(formData.selected_knowledge_ids);
    }, [formData, onAgentDataChange, onKnowledgeSelect]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getCategories();
            setCategories(response.data);
            
            // Set first category as default if available
            if (response.data.length > 0 && !formData.category_id) {
                setFormData(prev => ({
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
            const response = await categoryService.getKnowledgeItemsByCategory(categoryId);
            setKnowledgeItems(response.data);
        } catch (error) {
            console.error('Failed to fetch knowledge items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep === steps.length - 1) {
            handleSubmit();
        } else {
            onStepChange(currentStep + 1);
        }
    };

    const handleBack = () => {
        onStepChange(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            // Prepare final agent data to match backend expectations
            const finalAgentData = {
                name: formData.name,
                description: formData.description,
                ai_role: formData.ai_role || AgentRole.CUSTOMER_SUPPORT,
                language: formData.config.language || 'en',
                mode: formData.config.mode || AgentMode.TEXT,
                response_style: formData.config.response_style || 0.5,
                response_length: formData.config.response_length || 150,
                knowledge_item_ids: formData.selected_knowledge_ids
            };

            console.log('Submitting agent data:', JSON.stringify(finalAgentData, null, 2));
            await onCreateAgent(finalAgentData);
            onStepChange(0);
            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to create agent:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            ai_role: AgentRole.CUSTOMER_SUPPORT,
            config: { ...defaultConfig },
            selected_knowledge_ids: [],
            selected_action_types: []
        });
    };

    if (!open) return null;

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <div className="step-content">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Agent Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        
                        <textarea
                            className="textarea-field"
                            placeholder="Description"
                            rows={4}
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        
                        <div className="select-container">
                            <label>Agent Role</label>
                            <select
                                value={formData.ai_role}
                                onChange={(e) => setFormData({
                                    ...formData,
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
            case 1:
                return (
                    <div className="step-content">
                        <div className="select-container">
                            <label>Language</label>
                            <select
                                value={formData.config.language}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, language: e.target.value }
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
                                value={formData.config.mode}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, mode: e.target.value as AgentMode }
                                })}
                            >
                                <option value={AgentMode.TEXT}>Text</option>
                                <option value={AgentMode.AUDIO}>Audio</option>
                            </select>
                        </div>
                        
                        <div className="slider-container">
                            <label>Response Style: {formData.config.response_style < 0.33 ? 'Formal' : formData.config.response_style < 0.66 ? 'Balanced' : 'Casual'}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={formData.config.response_style}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, response_style: parseFloat(e.target.value) }
                                })}
                            />
                        </div>
                        
                        <div className="slider-container">
                            <label>Response Length: {formData.config.response_length} tokens</label>
                            <input
                                type="range"
                                min="50"
                                max="500"
                                step="50"
                                value={formData.config.response_length}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    config: { ...formData.config, response_length: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <div className="select-container">
                            <label>Category</label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({
                                    ...formData,
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
                        
                        <div className="knowledge-list">
                            <h4>Knowledge Items</h4>
                            {loading ? (
                                <div className="loading">Loading knowledge items...</div>
                            ) : knowledgeItems.length === 0 ? (
                                <div className="no-items">No knowledge items available for this category</div>
                            ) : (
                                knowledgeItems.map(item => (
                                    <div key={item.id} className="knowledge-item">
                                        <input
                                            type="checkbox"
                                            id={`knowledge-${item.id}`}
                                            checked={formData.selected_knowledge_ids.includes(item.id)}
                                            onChange={(e) => {
                                                const newSelectedIds = e.target.checked
                                                    ? [...formData.selected_knowledge_ids, item.id]
                                                    : formData.selected_knowledge_ids.filter(id => id !== item.id);
                                                setFormData({
                                                    ...formData,
                                                    selected_knowledge_ids: newSelectedIds
                                                });
                                            }}
                                        />
                                        <label htmlFor={`knowledge-${item.id}`}>
                                            <strong>{item.title}</strong>
                                            <p>{item.description}</p>
                                        </label>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <div className="action-list">
                            <h4>Available Actions</h4>
                            <p>Select the actions that this agent can perform:</p>
                            
                            {actionTypes.map(action => (
                                <div key={action.id} className="action-item">
                                    <input
                                        type="checkbox"
                                        id={`action-${action.id}`}
                                        checked={formData.selected_action_types.includes(action.id)}
                                        onChange={(e) => {
                                            const newSelectedActions = e.target.checked
                                                ? [...formData.selected_action_types, action.id]
                                                : formData.selected_action_types.filter(id => id !== action.id);
                                            setFormData({
                                                ...formData,
                                                selected_action_types: newSelectedActions
                                            });
                                        }}
                                    />
                                    <label htmlFor={`action-${action.id}`}>
                                        <strong>{action.name}</strong>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="step-content">
                        <h3>Review Agent Configuration</h3>
                        
                        <div className="review-section">
                            <h4>Basic Information</h4>
                            <div className="review-item">
                                <strong>Name:</strong> {formData.name}
                            </div>
                            <div className="review-item">
                                <strong>Description:</strong> {formData.description || 'N/A'}
                            </div>
                            <div className="review-item">
                                <strong>Role:</strong> {formData.ai_role}
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Configuration</h4>
                            <div className="review-item">
                                <strong>Language:</strong> {languages.find(l => l.code === formData.config.language)?.name || formData.config.language}
                            </div>
                            <div className="review-item">
                                <strong>Mode:</strong> {formData.config.mode}
                            </div>
                            <div className="review-item">
                                <strong>Response Style:</strong> {formData.config.response_style < 0.33 ? 'Formal' : formData.config.response_style < 0.66 ? 'Balanced' : 'Casual'}
                            </div>
                            <div className="review-item">
                                <strong>Response Length:</strong> {formData.config.response_length} tokens
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Knowledge Base</h4>
                            <div className="review-item">
                                <strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name || 'None'}
                            </div>
                            <div className="review-item">
                                <strong>Knowledge Items:</strong> {formData.selected_knowledge_ids.length} selected
                            </div>
                        </div>
                        
                        <div className="review-section">
                            <h4>Actions</h4>
                            <div className="review-item">
                                <strong>Enabled Actions:</strong>{' '}
                                {formData.selected_action_types.map(actionId => 
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
                    <h2>Create New AI Agent</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="wizard-progress">
                    {steps.map((label, index) => (
                        <div 
                            key={label} 
                            className={`progress-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        >
                            <div className="step-number">{index + 1}</div>
                            <div className="step-label">{label}</div>
                        </div>
                    ))}
                </div>
                
                <div className="wizard-content">
                    {renderStepContent(currentStep)}
                </div>
                
                <div className="wizard-actions">
                    <button 
                        className="button secondary"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                    >
                        Back
                    </button>
                    <button 
                        className="button primary"
                        onClick={handleNext}
                    >
                        {currentStep === steps.length - 1 ? 'Create' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};
