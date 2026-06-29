import React, { useState, useEffect, useCallback } from 'react';
import { knowledgeService } from '../../services/api/knowledge.service';
import { KnowledgeItem, WikiPageType } from '../../types/knowledge';
import ReactMarkdown from 'react-markdown';

interface WikiViewerProps {
    initialPageId?: number;
    onPageSelect?: (page: KnowledgeItem) => void;
}

export const WikiViewer: React.FC<WikiViewerProps> = ({ initialPageId, onPageSelect }) => {
    const [wikiPages, setWikiPages] = useState<KnowledgeItem[]>([]);
    const [currentPage, setCurrentPage] = useState<KnowledgeItem | null>(null);
    const [indexPage, setIndexPage] = useState<KnowledgeItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: number; title?: string; score: number; preview: string; page_type?: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'index' | 'pages' | 'search'>('index');
    const [lintResults, setLintResults] = useState<{
        orphan_pages: Array<{ id: number; title?: string }>;
        stale_pages: Array<{ id: number; title?: string }>;
        contradictions: string[];
        suggested_pages: string[];
    } | null>(null);

    const fetchWikiIndex = useCallback(async () => {
        try {
            const response = await knowledgeService.getWikiIndex();
            setIndexPage(response.data);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setIndexPage(null);
            }
        }
    }, []);

    const fetchWikiPages = useCallback(async () => {
        try {
            const response = await knowledgeService.getWikiPages();
            setWikiPages(response.data);
        } catch (err: any) {
            console.error('Failed to fetch wiki pages:', err);
        }
    }, []);

    const fetchLintResults = useCallback(async () => {
        try {
            const response = await knowledgeService.lintWiki();
            setLintResults(response.data);
        } catch (err: any) {
            console.error('Failed to lint wiki:', err);
        }
    }, []);

    useEffect(() => {
        fetchWikiIndex();
        fetchWikiPages();
        fetchLintResults();
    }, [fetchWikiIndex, fetchWikiPages, fetchLintResults]);

    useEffect(() => {
        if (initialPageId) {
            const page = wikiPages.find(p => p.id === initialPageId);
            if (page) {
                setCurrentPage(page);
            }
        }
    }, [initialPageId, wikiPages]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await knowledgeService.searchWiki(searchQuery, 10);
            setSearchResults(response.data.results);
            setActiveTab('search');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateIndex = async () => {
        setLoading(true);
        try {
            await knowledgeService.regenerateWikiIndex();
            await fetchWikiIndex();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to regenerate index');
        } finally {
            setLoading(false);
        }
    };

    const handlePageClick = (page: KnowledgeItem) => {
        setCurrentPage(page);
        onPageSelect?.(page);
    };

    const preprocessWikiLinks = (content: string): string => {
        return content.replace(/\[\[([^\]]+)\]\]/g, '[$1](wiki:$1)');
    };

    const renderWikiLink = ({ href, children }: { href?: string; children?: React.ReactNode }) => {
        if (href?.startsWith('wiki:')) {
            const pageName = href.replace(/^wiki:/, '');
            const linkedPage = wikiPages.find(p => p.title?.toLowerCase().includes(pageName.toLowerCase()));
            
            if (linkedPage) {
                return (
                    <button
                        onClick={() => handlePageClick(linkedPage)}
                        className="wiki-link"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit'
                        }}
                    >
                        {children}
                    </button>
                );
            }
        }
        
        return <a href={href} style={{ color: '#3b82f6' }}>{children}</a>;
    };

    const renderMarkdown = (content?: string) => {
        if (!content) return <p>No content available</p>;
        
        const processedContent = preprocessWikiLinks(content);
        
        return (
            <ReactMarkdown
                components={{
                    a: renderWikiLink
                }}
            >
                {processedContent}
            </ReactMarkdown>
        );
    };

    const getPageTypeIcon = (pageType?: string) => {
        switch (pageType) {
            case 'index': return '📑';
            case 'entity': return '🏷️';
            case 'topic': return '📚';
            case 'source_summary': return '📄';
            case 'comparison': return '⚖️';
            case 'log': return '📝';
            default: return '📄';
        }
    };

    const groupPagesByType = () => {
        const groups: Record<string, KnowledgeItem[]> = {};
        wikiPages.forEach(page => {
            const type = page.metadata?.wiki_page_type || 'other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(page);
        });
        return groups;
    };

    const clearError = () => setError(null);

    return (
        <div className="wiki-viewer" style={{ display: 'flex', height: '100%', gap: '1rem' }}>
            <div className="wiki-sidebar" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '4px', color: '#dc2626' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{error}</span>
                            <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
                                ×
                            </button>
                        </div>
                    </div>
                )}
                <div className="wiki-search" style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search wiki..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1, padding: '0.5rem' }}
                    />
                    <button onClick={handleSearch} disabled={loading}>
                        🔍
                    </button>
                </div>

                <div className="wiki-tabs" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('index')}
                        style={{ flex: 1, padding: '0.5rem', background: activeTab === 'index' ? '#3b82f6' : '#e5e7eb' }}
                    >
                        Index
                    </button>
                    <button
                        onClick={() => setActiveTab('pages')}
                        style={{ flex: 1, padding: '0.5rem', background: activeTab === 'pages' ? '#3b82f6' : '#e5e7eb' }}
                    >
                        Pages
                    </button>
                </div>

                <div className="wiki-list" style={{ flex: 1, overflow: 'auto' }}>
                    {activeTab === 'index' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h3>Wiki Index</h3>
                                <button onClick={handleRegenerateIndex} disabled={loading}>
                                    🔄
                                </button>
                            </div>
                            {!indexPage ? (
                                <p style={{ color: '#6b7280' }}>
                                    No index generated yet. Upload files or URLs to auto-generate wiki pages.
                                </p>
                            ) : (
                                <div className="index-preview">
                                    {renderMarkdown(indexPage.content?.slice(0, 1000))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'pages' && (
                        <div>
                            {Object.entries(groupPagesByType()).map(([type, pages]) => (
                                <div key={type} style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                                        {getPageTypeIcon(type)} {type.replace(/_/g, ' ')}
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {pages.map(page => (
                                            <li
                                                key={page.id}
                                                onClick={() => handlePageClick(page)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer',
                                                    background: currentPage?.id === page.id ? '#e0e7ff' : 'transparent',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                {page.title || `Page ${page.id}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div>
                            <h3>Search Results</h3>
                            {searchResults.length === 0 ? (
                                <p>No results found</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {searchResults.map(result => (
                                        <li
                                            key={result.id}
                                            onClick={() => {
                                                const page = wikiPages.find(p => p.id === result.id);
                                                if (page) handlePageClick(page);
                                            }}
                                            style={{
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #e5e7eb'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>
                                                {getPageTypeIcon(result.page_type)} {result.title || `Page ${result.id}`}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                                {result.preview.slice(0, 100)}...
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                                                Score: {result.score.toFixed(2)}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {lintResults && (lintResults.orphan_pages.length > 0 || lintResults.stale_pages.length > 0) && (
                    <div className="wiki-health" style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '4px' }}>
                        <h4>⚠️ Wiki Health</h4>
                        {lintResults.orphan_pages.length > 0 && (
                            <div>{lintResults.orphan_pages.length} orphan pages</div>
                        )}
                        {lintResults.stale_pages.length > 0 && (
                            <div>{lintResults.stale_pages.length} stale pages</div>
                        )}
                    </div>
                )}
            </div>

            <div className="wiki-content" style={{ flex: 1, overflow: 'auto', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                {currentPage ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h1>{currentPage.title || 'Untitled Page'}</h1>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {getPageTypeIcon(currentPage.metadata?.wiki_page_type)} {currentPage.metadata?.wiki_page_type}
                            </span>
                        </div>
                        {currentPage.metadata?.auto_generated && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                                Auto-generated
                                {currentPage.metadata?.generated_at && (() => {
                                    const date = new Date(currentPage.metadata.generated_at);
                                    return !isNaN(date.getTime()) ? ` • ${date.toLocaleDateString()}` : null;
                                })()}
                            </div>
                        )}
                        <div className="markdown-content">
                            {renderMarkdown(currentPage.content)}
                        </div>
                        {currentPage.metadata?.parent_sources && currentPage.metadata.parent_sources.length > 0 && (
                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                <h3>Source References</h3>
                                <ul>
                                    {currentPage.metadata.parent_sources.map((sourceId: number) => (
                                        <li key={sourceId}>Source #{sourceId}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
                        <p>Select a page from the sidebar or search to view wiki content</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WikiViewer;
