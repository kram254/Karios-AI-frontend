import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import './KnowledgeSelector.css';
import { categoryService } from '../../services/api/category.service';
import { Category } from '../../types/knowledge';

interface KnowledgeBase {
    id: number;
    name: string;
    description: string;
    documentCount: number;
}

interface KnowledgeSelectorProps {
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    agentId?: number;
}

export const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({
    selectedIds,
    onSelectionChange,
    agentId
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [expandedItems, setExpandedItems] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchKnowledgeBases();
        // If we have an agentId, we can use it to fetch agent-specific knowledge bases
        if (agentId) {
            console.log(`Fetching knowledge bases for agent ${agentId}`);
        }
    }, [agentId]);

    const fetchKnowledgeBases = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch real data from the backend
            const response = await categoryService.getCategories();
            
            if (response && response.data && response.data.length > 0) {
                // For accurate knowledge item counts, fetch each category individually to get full details
                const detailedCategories = await Promise.all(response.data.map(async (category) => {
                    try {
                        const detailedResponse = await categoryService.getCategoryById(category.id);
                        console.log(`Detailed data for category ${category.id}:`, detailedResponse.data);
                        
                        // If the detailed response doesn't have knowledge_items or it's empty, try the specialized endpoint
                        if (!detailedResponse.data.knowledge_items || detailedResponse.data.knowledge_items.length === 0) {
                            try {
                                const itemsResponse = await categoryService.getKnowledgeItemsByCategory(category.id);
                                console.log(`Additional items for category ${category.id}:`, itemsResponse.data);
                                
                                // Return category with items added
                                return {
                                    ...detailedResponse.data,
                                    knowledge_items: itemsResponse.data || []
                                };
                            } catch (itemErr) {
                                console.error(`Failed to fetch knowledge items for category ${category.id}:`, itemErr);
                                return detailedResponse.data;
                            }
                        }
                        
                        return detailedResponse.data;
                    } catch (err) {
                        console.error(`Failed to fetch detailed data for category ${category.id}:`, err);
                        return category;
                    }
                }));
                
                const categories = detailedCategories.map((category: Category) => {
                    const itemCount = category.knowledge_items?.length || 0;
                    console.log(`KnowledgeSelector: Category ${category.name} has ${itemCount} items:`, category.knowledge_items);
                    
                    return {
                        id: category.id,
                        name: category.name,
                        description: category.description || 'No description available',
                        documentCount: itemCount
                    };
                });
                
                setKnowledgeBases(categories);
                console.log('Fetched knowledge categories with correct counts:', categories);
            } else {
                setKnowledgeBases([]);
                setError('No categories found. Please create some knowledge categories first.');
            }
        } catch (error) {
            console.error('Error fetching knowledge bases:', error);
            setError('Failed to load knowledge categories. Please try again.');
            setKnowledgeBases([]);
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
                    <span>Loading knowledge categories...</span>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>{error}</p>
                </div>
            ) : filteredKnowledgeBases.length === 0 ? (
                <div className="empty-container">
                    <p>No knowledge categories found. Please create some in the Knowledge Management section first.</p>
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
                                                {(() => {
                                                    console.log(`Document count for ${kb.name}:`, kb.documentCount);
                                                    return kb.documentCount;
                                                })()}
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
