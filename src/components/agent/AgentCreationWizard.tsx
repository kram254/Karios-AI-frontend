import React, { useState, useEffect } from 'react';
import { Agent, AgentRole, AgentMode } from '../../types/agent';
import { KnowledgeSelector } from '../knowledge/KnowledgeSelector';
import './AgentCreationWizard.css';
import './dropdownFix.css';

// Define the props interface
interface AgentCreationWizardProps {
    open: boolean;
    onClose: () => void;
    onDataChange: (data: Partial<Agent>) => void;
    onKnowledgeSelect: (ids: number[]) => void;
    onSubmit: (agentData: Partial<Agent>) => void;
    initialData?: Partial<Agent>;
}

// Define the steps in the wizard
const STEPS = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Role & Behavior' },
    { id: 3, label: 'Knowledge Base' },
    { id: 4, label: 'Actions' },
    { id: 5, label: 'Review' }
];

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({ 
    open, 
    onClose, 
    onDataChange, 
    onKnowledgeSelect,
    onSubmit,
    initialData
}) => {
    console.log("AgentCreationWizard rendered with open:", open);
    
    // State for the current step
    const [currentStep, setCurrentStep] = useState<number>(1);
    
    // State for form data
    const [formData, setFormData] = useState<Partial<Agent>>(initialData || {
        name: '',
        description: '',
        ai_role: AgentRole.CUSTOMER_SUPPORT,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 150,
        actions: []
    });
    
    // State for selected knowledge IDs
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
    
    // Function to handle input changes
    const handleInputChange = (field: keyof Agent, value: any) => {
        const updatedData = { ...formData, [field]: value };
        setFormData(updatedData);
        onDataChange(updatedData);
    };
    
    // Function to handle submit
    const handleSubmit = () => {
        onSubmit(formData);
    };
    
    // Function to go to the next step
    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        } else if (currentStep === STEPS.length) {
            handleSubmit();
        }
    };
    
    // Function to go to the previous step
    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
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
        
        return () => {
            console.log('AgentCreationWizard unmounted');
        };
    }, [open, currentStep, formData]);
    
    // Function to validate the current step
    const validateStep = (): boolean => {
        switch (currentStep) {
            case 1:
                return !!formData.name && formData.name.length > 0;
            case 2:
                return !!formData.ai_role && !!formData.mode;
            case 3:
                return true; // Knowledge selection is optional
            case 4:
                return true; // Actions step is always valid
            case 5:
                return true; // Review step is always valid
            default:
                return false;
        }
    };

    if (!open) return null;

    return (
        <div className="wizard-overlay">
            <div className="wizard-container">
                {/* Header */}
                <div className="wizard-header">
                    <h2>Create New Agent</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                {/* Progress Steps */}
                <div className="wizard-progress">
                    {STEPS.map((step) => (
                        <div 
                            key={step.id} 
                            className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                            onClick={() => setCurrentStep(step.id)}
                        >
                            <div className="step-number">{step.id}</div>
                            <div className="step-label">{step.label}</div>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="wizard-content">
                    {currentStep === 1 && (
                        <div>
                            <h3>Basic Information</h3>
                            <div className="input-group">
                                <label htmlFor="agent-name">Agent Name *</label>
                                <input
                                    id="agent-name"
                                    type="text"
                                    className="input-field"
                                    value={formData.name || ''}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Enter agent name"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="agent-description">Description</label>
                                <textarea
                                    id="agent-description"
                                    className="input-field textarea-field"
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter agent description"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3>Role & Behavior</h3>
                            <div className="input-group">
                                <label htmlFor="agent-role">Agent Role</label>
                                <div className="select-container">
                                    <select
                                        id="agent-role"
                                        className="select-field"
                                        value={formData.ai_role || ''}
                                        onChange={(e) => handleInputChange('ai_role', e.target.value)}
                                    >
                                        <option value={AgentRole.CUSTOMER_SUPPORT}>Customer Support</option>
                                        <option value={AgentRole.SALES_ASSISTANT}>Sales Assistant</option>
                                        <option value={AgentRole.TECHNICAL_SUPPORT}>Technical Support</option>
                                        <option value={AgentRole.CONSULTING}>Consulting Services</option>
                                        <option value={AgentRole.SALES_SERVICES}>Sales Services</option>
                                        <option value={AgentRole.CUSTOM}>Custom...</option>
                                    </select>
                                    <div className="select-arrow">▼</div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="agent-mode">Interaction Mode</label>
                                <div className="select-container">
                                    <select
                                        id="agent-mode"
                                        className="select-field"
                                        value={formData.mode || ''}
                                        onChange={(e) => handleInputChange('mode', e.target.value)}
                                    >
                                        <option value={AgentMode.TEXT}>Text Only</option>
                                        <option value={AgentMode.AUDIO}>Audio Enabled</option>
                                        <option value={AgentMode.VIDEO}>Video Enabled</option>
                                    </select>
                                    <div className="select-arrow">▼</div>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="agent-language">Language</label>
                                <div className="select-container">
                                    <select
                                        id="agent-language"
                                        className="select-field"
                                        value={formData.language || 'en'}
                                        onChange={(e) => handleInputChange('language', e.target.value)}
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Spanish (Español)</option>
                                        <option value="fr">French (Français)</option>
                                        <option value="de">German (Deutsch)</option>
                                        <option value="it">Italian (Italiano)</option>
                                        <option value="pt">Portuguese (Português)</option>
                                        <option value="ru">Russian (Русский)</option>
                                    </select>
                                    <div className="select-arrow">▼</div>
                                </div>
                                <small>The agent will respond in this language</small>
                            </div>

                            <div className="slider-container">
                                <div className="slider-header">
                                    <span className="slider-label">Response Style:</span>
                                    <span className="slider-value">
                                        {formData.response_style === 0 ? 'Formal' : 
                                        formData.response_style === 1 ? 'Casual' : 
                                        `${formData.response_style ? Math.round(formData.response_style * 100) : 50}% Casual`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    className="slider"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={formData.response_style !== undefined ? formData.response_style : 0.5}
                                    onChange={(e) => handleInputChange('response_style', parseFloat(e.target.value))}
                                />
                                <div className="slider-range">
                                    <span className="slider-min">Formal</span>
                                    <span className="slider-max">Casual</span>
                                </div>
                            </div>

                            <div className="slider-container">
                                <div className="slider-header">
                                    <span className="slider-label">Response Length:</span>
                                    <span className="slider-value">{formData.response_length || 150} words</span>
                                </div>
                                <input
                                    type="range"
                                    className="slider"
                                    min="50"
                                    max="500"
                                    step="50"
                                    value={formData.response_length || 150}
                                    onChange={(e) => handleInputChange('response_length', parseInt(e.target.value))}
                                />
                                <div className="slider-range">
                                    <span className="slider-min">50</span>
                                    <span className="slider-max">500</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3>Knowledge Base</h3>
                            <p>Select the knowledge categories that this agent should have access to when responding to customers.</p>
                            
                            <div className="knowledge-section">
                                <input
                                    type="text"
                                    className="search-box"
                                    placeholder="Search knowledge bases..."
                                />
                                
                                <KnowledgeSelector
                                    selectedIds={selectedKnowledgeIds}
                                    onSelectionChange={(ids) => {
                                        setSelectedKnowledgeIds(ids);
                                        onKnowledgeSelect(ids);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <h3>Agent Actions</h3>
                            <p>Select what actions this agent can perform:</p>
                            
                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="action-text"
                                    className="checkbox"
                                    checked={true}
                                    disabled
                                />
                                <label htmlFor="action-text" className="checkbox-label">Text Output</label>
                            </div>
                            
                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="action-send-file"
                                    className="checkbox"
                                    checked={formData.actions?.includes('send_file') || false}
                                    onChange={(e) => {
                                        const currentActions = formData.actions || [];
                                        let newActions;
                                        if (e.target.checked) {
                                            newActions = [...currentActions, 'send_file'];
                                        } else {
                                            newActions = currentActions.filter(a => a !== 'send_file');
                                        }
                                        handleInputChange('actions', newActions);
                                    }}
                                />
                                <label htmlFor="action-send-file" className="checkbox-label">Send File</label>
                            </div>
                            
                            <div className="checkbox-container">
                                <input
                                    type="checkbox"
                                    id="action-send-link"
                                    className="checkbox"
                                    checked={formData.actions?.includes('send_link') || false}
                                    onChange={(e) => {
                                        const currentActions = formData.actions || [];
                                        let newActions;
                                        if (e.target.checked) {
                                            newActions = [...currentActions, 'send_link'];
                                        } else {
                                            newActions = currentActions.filter(a => a !== 'send_link');
                                        }
                                        handleInputChange('actions', newActions);
                                    }}
                                />
                                <label htmlFor="action-send-link" className="checkbox-label">Send Link</label>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div>
                            <h3>Review</h3>
                            
                            <div className="review-section">
                                <h4 className="review-title">Basic Information</h4>
                                <div className="review-content">
                                    <div className="review-line">
                                        <span className="review-label">Name:</span>
                                        <span className="review-value">{formData.name}</span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Description:</span>
                                        <span className="review-value">{formData.description || 'No description provided.'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="review-section">
                                <h4 className="review-title">Configuration</h4>
                                <div className="review-content">
                                    <div className="review-line">
                                        <span className="review-label">Role:</span>
                                        <span className="review-value">{formData.ai_role}</span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Mode:</span>
                                        <span className="review-value">{formData.mode}</span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Language:</span>
                                        <span className="review-value">{formData.language}</span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Response Style:</span>
                                        <span className="review-value">
                                            {formData.response_style === 0 ? 'Formal' : 
                                            formData.response_style === 1 ? 'Casual' : 
                                            `${formData.response_style ? Math.round(formData.response_style * 100) : 50}% Casual`}
                                        </span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Response Length:</span>
                                        <span className="review-value">{formData.response_length} words</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="review-section">
                                <h4 className="review-title">Knowledge & Actions</h4>
                                <div className="review-content">
                                    <div className="review-line">
                                        <span className="review-label">Knowledge Bases:</span>
                                        <span className="review-value">
                                            {selectedKnowledgeIds.length > 0 ? 
                                                `${selectedKnowledgeIds.length} knowledge base(s) selected` : 
                                                'None selected'}
                                        </span>
                                    </div>
                                    <div className="review-line">
                                        <span className="review-label">Actions:</span>
                                        <span className="review-value">
                                            Text Output
                                            {formData.actions?.includes('send_file') && ', Send File'}
                                            {formData.actions?.includes('send_link') && ', Send Link'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="wizard-footer">
                    <div>
                        {currentStep > 1 && (
                            <button 
                                className="back-button" 
                                onClick={prevStep}
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div>
                        {currentStep < STEPS.length ? (
                            <button 
                                className="next-button" 
                                onClick={nextStep}
                                disabled={!validateStep()}
                            >
                                Next
                            </button>
                        ) : (
                            <button 
                                className="create-button" 
                                onClick={handleSubmit}
                            >
                                Create
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
