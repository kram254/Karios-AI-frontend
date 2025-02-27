import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import './KnowledgeSelector.css';

interface KnowledgeBase {
    id: number;
    name: string;
    description: string;
    documentCount: number;
}

interface KnowledgeSelectorProps {
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
}

export const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({
    selectedIds,
    onSelectionChange
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [expandedItems, setExpandedItems] = useState<number[]>([]);

    useEffect(() => {
        fetchKnowledgeBases();
    }, []);

    const fetchKnowledgeBases = async () => {
        setLoading(true);
        try {
            // Mock data for now
            const mockData: KnowledgeBase[] = [
                { id: 1, name: 'Sales Scripts', description: 'Common sales scripts and responses', documentCount: 15 },
                { id: 2, name: 'Product Knowledge', description: 'Detailed product information', documentCount: 25 },
                { id: 3, name: 'FAQ', description: 'Frequently asked questions', documentCount: 30 }
            ];
            setKnowledgeBases(mockData);
        } catch (error) {
            console.error('Error fetching knowledge bases:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = (id: number) => {
        setExpandedItems(prev => 
            prev.includes(id) 
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleToggleSelect = (id: number) => {
        onSelectionChange(
            selectedIds.includes(id)
                ? selectedIds.filter(item => item !== id)
                : [...selectedIds, id]
        );
    };

    const filteredKnowledgeBases = knowledgeBases.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="knowledge-selector">
            <div className="search-container">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search knowledge bases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span>Loading knowledge bases...</span>
                </div>
            ) : (
                <div className="knowledge-list">
                    {filteredKnowledgeBases.map((kb) => (
                        <div key={kb.id} className="knowledge-item">
                            <div className="knowledge-header">
                                <label className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(kb.id)}
                                        onChange={() => handleToggleSelect(kb.id)}
                                    />
                                    <span className="checkmark"></span>
                                </label>
                                <div className="knowledge-info" onClick={() => handleToggleExpand(kb.id)}>
                                    <div className="knowledge-title">
                                        <span>{kb.name}</span>
                                        <div className="knowledge-badges">
                                            <span className="document-count">
                                                <FileText size={16} />
                                                {kb.documentCount}
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        className="expand-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleExpand(kb.id);
                                        }}
                                    >
                                        {expandedItems.includes(kb.id) ? (
                                            <ChevronUp size={20} />
                                        ) : (
                                            <ChevronDown size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {expandedItems.includes(kb.id) && (
                                <div className="knowledge-details">
                                    <p>{kb.description}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
