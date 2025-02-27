import React, { useState } from 'react';
import { Agent, AgentConfig } from '../../types/agent';
import './AgentCreationWizard.css';

export interface AgentCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (agentData: Partial<Agent>) => Promise<void>;
}

const steps = ['Basic Information', 'Configuration', 'Knowledge Base', 'Review'];

// *Modizx* Fixed type error by ensuring all AgentConfig fields are non-optional
const defaultConfig: AgentConfig = {
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    language: 'en',
    response_style: 'professional',
    knowledge_base_ids: []
};

// *Modizx* Added interface for agent data with required config
interface AgentFormData extends Partial<Omit<Agent, 'config'>> {
    config: AgentConfig;
}

export const AgentCreationWizard: React.FC<AgentCreationWizardProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const [activeStep, setActiveStep] = useState(0);
    // *Modizx* Updated state type to ensure config is always present
    const [agentData, setAgentData] = useState<AgentFormData>({
        name: '',
        description: '',
        config: defaultConfig
    });

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
            await onCreate(agentData);
            setActiveStep(0);
            setAgentData({
                name: '',
                description: '',
                config: defaultConfig
            });
            onClose();
        } catch (error) {
            console.error('Failed to create agent:', error);
        }
    };

    if (!isOpen) return null;

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <div className="step-content">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Agent Name"
                            value={agentData.name}
                            onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                        />
                        <textarea
                            className="textarea-field"
                            placeholder="Description"
                            rows={4}
                            value={agentData.description}
                            onChange={(e) => setAgentData({ ...agentData, description: e.target.value })}
                        />
                    </div>
                );
            case 1:
                return (
                    <div className="step-content">
                        <div className="select-container">
                            <label>Model</label>
                            <select
                                value={agentData.config.model}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, model: e.target.value }
                                })}
                            >
                                <option value="gpt-4">GPT-4</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>

                        <div className="slider-container">
                            <label>Temperature: {agentData.config.temperature}</label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={agentData.config.temperature}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, temperature: parseFloat(e.target.value) }
                                })}
                            />
                        </div>

                        <div className="select-container">
                            <label>Language</label>
                            <select
                                value={agentData.config.language}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, language: e.target.value }
                                })}
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>

                        <div className="select-container">
                            <label>Response Style</label>
                            <select
                                value={agentData.config.response_style}
                                onChange={(e) => setAgentData({
                                    ...agentData,
                                    config: { ...agentData.config, response_style: e.target.value }
                                })}
                            >
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="friendly">Friendly</option>
                            </select>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h3>Select Knowledge Base</h3>
                        {/* Knowledge base selection will be implemented here */}
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h3>Review Configuration</h3>
                        <div className="review-item">
                            <strong>Name:</strong> {agentData.name}
                        </div>
                        <div className="review-item">
                            <strong>Description:</strong> {agentData.description}
                        </div>
                        <div className="review-item">
                            <strong>Model:</strong> {agentData.config.model}
                        </div>
                        <div className="review-item">
                            <strong>Temperature:</strong> {agentData.config.temperature}
                        </div>
                        <div className="review-item">
                            <strong>Language:</strong> {agentData.config.language}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-container">
                <div className="wizard-header">
                    <h2>Create New Agent</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="stepper">
                    {steps.map((label, index) => (
                        <div 
                            key={label} 
                            className={`step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
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
                        className="secondary-button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    {activeStep > 0 && (
                        <button
                            className="secondary-button"
                            onClick={handleBack}
                        >
                            Back
                        </button>
                    )}
                    <button
                        className="primary-button"
                        onClick={handleNext}
                    >
                        {activeStep === steps.length - 1 ? 'Create' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};
