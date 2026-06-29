import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Tabs,
    Tab,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    LinearProgress,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Link as LinkIcon,
    Description as DescriptionIcon,
    InsertDriveFile as FileIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { categoryService } from '../../services/api/category.service';
import { KnowledgeItem, ContentType, UpdateFrequency } from '../../types/knowledge';
import './KnowledgeItemManager.css';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div hidden={value !== index} style={{ padding: '16px 0' }}>
        {value === index && children}
    </div>
);

interface KnowledgeItemManagerProps {
    categoryId: string;
    onKnowledgeAdded?: (knowledgeItem: KnowledgeItem) => void;
    onKnowledgeDeleted?: (knowledgeItem: KnowledgeItem) => void;
}

export const KnowledgeItemManager: React.FC<KnowledgeItemManagerProps> = ({ categoryId, onKnowledgeAdded, onKnowledgeDeleted }) => {
    const [tabValue, setTabValue] = useState(0);
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [textContent, setTextContent] = useState({ title: '', content: '', updateFrequency: UpdateFrequency.NEVER });
    const [urlContent, setUrlContent] = useState({
        url: '',
        description: '',
        updateFrequency: UpdateFrequency.NEVER,
        maxDepth: 2,
        extractCodeExamples: true,
        knowledgeType: 'technical'
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileDescription, setFileDescription] = useState('');

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (categoryId) {
            validateCategoryAndFetchItems();
        }
    }, [categoryId]);

    const validateCategoryAndFetchItems = async () => {
        setLoading(true);
        clearMessages();

        try {
            // First verify the category exists and is not deleted
            try {
                await categoryService.getCategoryById(parseInt(categoryId));
            } catch (categoryError) {
                console.error('Category validation failed:', categoryError);
                setError('This category no longer exists. Please create a new category or select a different one.');
                setLoading(false);
                return;
            }

            // Then fetch the knowledge items
            const response = await categoryService.getKnowledgeItemsByCategory(parseInt(categoryId));
            const items = response.data || [];
            console.log(`KnowledgeItemManager: Fetched ${items.length} items for category ${categoryId}:`, items);
            setKnowledgeItems(items);
        } catch (error) {
            console.error('Failed to fetch knowledge items:', error);
            setError('Failed to load knowledge items. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            // Convert FileList to Array
            const filesArray = Array.from(event.target.files);
            setSelectedFiles(filesArray);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const resetForms = () => {
        setTextContent({ title: '', content: '', updateFrequency: UpdateFrequency.NEVER });
        setUrlContent({
            url: '',
            description: '',
            updateFrequency: UpdateFrequency.NEVER,
            maxDepth: 2,
            extractCodeExamples: true,
            knowledgeType: 'technical'
        });
        setSelectedFiles([]);
        setFileDescription('');
    };

    const checkCategoryExists = async (): Promise<boolean> => {
        try {
            // Make a fresh request to check if the category still exists and is not deleted
            await categoryService.getCategoryById(parseInt(categoryId));
            return true;
        } catch (error: any) {
            console.error('Category check failed:', error);
            // Set more specific error messages based on the error status
            if (error.response && error.response.status === 410) {
                setError('This category has been deleted. Please create a new category or select a different one.');
            } else {
                setError('This category is no longer available. Please create a new category or select a different one.');
            }
            return false;
        }
    };

    const handleAddTextContent = async () => {
        setLoading(true);
        clearMessages();

        // Check if category still exists
        if (!await checkCategoryExists()) {
            setLoading(false);
            return;
        }

        try {
            const response = await categoryService.addTextContent(
                parseInt(categoryId),
                textContent.content,
                textContent.title,
                textContent.updateFrequency
            );
            setSuccess('Text content added successfully');
            validateCategoryAndFetchItems();
            resetForms();
            if (onKnowledgeAdded && response.data) {
                onKnowledgeAdded(response.data);
            }
        } catch (error) {
            console.error('Failed to add text content:', error);
            setError('Failed to add text content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Track URL processing status
    const [urlProcessingStatus, setUrlProcessingStatus] = useState<{
        isProcessing: boolean;
        itemId: number | null;
        progress: number;
        status: string;
        statusMessage: string;
        currentPage: string | null;
        pagesProcessed: number;
        totalPages: number;
        chunksStored: number;
        codeExamplesCount: number;
        crawlStrategy: string;
        error: string | null;
    }>({
        isProcessing: false,
        itemId: null,
        progress: 0,
        status: '',
        statusMessage: '',
        currentPage: null,
        pagesProcessed: 0,
        totalPages: 0,
        chunksStored: 0,
        codeExamplesCount: 0,
        crawlStrategy: 'single_page',
        error: null
    });

    // Define interface for metadata structure
    interface ProcessingMetadata {
        processing_status?: string;
        processing_progress?: number;
        status_message?: string;
        current_page?: string | null;
        pages_processed?: number;
        processing_error?: string | null;
    }

    // Function to check URL processing status
    const checkUrlProcessingStatus = async (itemId: number) => {
        try {
            const response = await categoryService.getKnowledgeItem(itemId);
            const item = response.data;

            // Parse metadata from content field (JSON string)
            let metadata: ProcessingMetadata = {};
            if (item && item.content) {
                try {
                    metadata = JSON.parse(item.content) as ProcessingMetadata;
                } catch (e) {
                    console.error('Error parsing content as JSON:', e);
                    metadata = {};
                }

                const status = metadata.processing_status || '';
                const progress = metadata.processing_progress || 0;
                const statusMessage = metadata.status_message || '';
                const currentPage = metadata.current_page || null;
                const pagesProcessed = metadata.pages_processed || 0;
                const processingError = metadata.processing_error || null;

                setUrlProcessingStatus(prev => ({
                    ...prev,
                    progress: progress,
                    status: status,
                    statusMessage: statusMessage,
                    currentPage: currentPage,
                    pagesProcessed: pagesProcessed,
                    error: processingError
                }));

                // Continue polling if still processing
                if (status === 'processing' || status === '') {
                    setTimeout(() => checkUrlProcessingStatus(itemId), 1500); // Poll every 1.5 seconds for more responsive updates
                } else {
                    // Processing complete
                    if (status === 'completed') {
                        setSuccess('Knowledge base updated with URL content successfully!');
                    } else if (status === 'error' || status === 'failed') {
                        setError(`URL processing failed: ${processingError || 'Unknown error'}`);
                    } else if (status === 'limited') {
                        setSuccess('URL processed with limited capability (basic extraction)');
                    }

                    // Reset processing state after showing the result for 3 seconds
                    setTimeout(() => {
                        setUrlProcessingStatus({
                            isProcessing: false,
                            itemId: null,
                            progress: 0,
                            status: '',
                            statusMessage: '',
                            currentPage: null,
                            pagesProcessed: 0,
                            totalPages: 0,
                            chunksStored: 0,
                            codeExamplesCount: 0,
                            crawlStrategy: 'single_page',
                            error: null
                        });
                        validateCategoryAndFetchItems(); // Refresh items
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error checking URL processing status:', error);
            // Stop checking after error
            setUrlProcessingStatus({
                isProcessing: false,
                itemId: null,
                progress: 0,
                status: '',
                statusMessage: '',
                currentPage: null,
                pagesProcessed: 0,
                totalPages: 0,
                chunksStored: 0,
                codeExamplesCount: 0,
                crawlStrategy: 'single_page',
                error: 'Failed to check processing status'
            });
        }
    };

    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!urlContent.url) {
            setError('URL is required');
            return;
        }

        setLoading(true);
        setSuccess(''); // Clear any previous success message
        setError(''); // Clear any previous error message

        try {
            const response = await categoryService.addUrl(
                parseInt(categoryId),
                urlContent.url,
                urlContent.description,
                urlContent.updateFrequency,
                urlContent.maxDepth,
                urlContent.extractCodeExamples,
                urlContent.knowledgeType
            );

            // Start tracking the processing status
            if (response.data && response.data.id) {
                resetForms();
                setLoading(false);

                // Set processing status to start polling
                setUrlProcessingStatus({
                    isProcessing: true,
                    itemId: response.data.id,
                    progress: 0,
                    status: 'processing',
                    statusMessage: '',
                    currentPage: null,
                    pagesProcessed: 0,
                    totalPages: 0,
                    chunksStored: 0,
                    codeExamplesCount: 0,
                    crawlStrategy: 'single_page',
                    error: null
                });

                // Start polling for status updates
                checkUrlProcessingStatus(response.data.id);

                if (onKnowledgeAdded) {
                    onKnowledgeAdded(response.data);
                }
            }
        } catch (error) {
            console.error('Failed to add URL:', error);
            setError('Failed to add URL. Please try again.');
            setLoading(false);
        }
    };

    const handleUploadFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            setError('Please select at least one file to upload');
            return;
        }

        setLoading(true);
        clearMessages();

        // Check if category still exists
        if (!await checkCategoryExists()) {
            setLoading(false);
            return;
        }

        try {
            const formData = fileDescription ? { description: fileDescription } : undefined;
            const uploadResults = [];

            // Upload each file sequentially
            for (const file of selectedFiles) {
                try {
                    const response = await categoryService.uploadFile(parseInt(categoryId), file, formData);
                    uploadResults.push({
                        success: true,
                        fileName: file.name,
                        response: response.data
                    });

                    // Notify parent if callback exists and response has data
                    if (onKnowledgeAdded && response.data) {
                        onKnowledgeAdded(response.data);
                    }
                } catch (err) {
                    console.error(`Failed to upload file ${file.name}:`, err);
                    uploadResults.push({
                        success: false,
                        fileName: file.name,
                        error: err
                    });
                }
            }

            // Count successes and failures
            const successCount = uploadResults.filter(r => r.success).length;
            const failureCount = uploadResults.length - successCount;

            // Create appropriate success message
            if (successCount === uploadResults.length) {
                setSuccess(`Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}`);
            } else if (successCount > 0) {
                setSuccess(`Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}, but ${failureCount} failed`);
            } else {
                setError('Failed to upload files. Please try again.');
            }

            validateCategoryAndFetchItems();
            resetForms();
        } catch (error) {
            console.error('Failed to upload files:', error);
            setError('Failed to upload files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (item: KnowledgeItem) => {
        setItemToDelete(item);
        setDeleteDialogOpen(true);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        setDeleteDialogOpen(false);
        setLoading(true);
        clearMessages();

        try {
            await categoryService.deleteKnowledgeItem(itemToDelete.id);
            setSuccess('Knowledge item deleted successfully');

            // Update the local state by removing the deleted item
            setKnowledgeItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));

            // Important: Notify the parent component to update category counts
            if (onKnowledgeDeleted) {
                console.log('Notifying parent of knowledge item deletion');
                onKnowledgeDeleted(itemToDelete);
            }

            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete knowledge item:', error);
            setError('Failed to delete knowledge item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getItemIcon = (type: ContentType) => {
        switch (type) {
            case ContentType.FILE:
                return <FileIcon />;
            case ContentType.URL:
                return <LinkIcon />;
            case ContentType.TEXT:
                return <DescriptionIcon />;
            default:
                return <DescriptionIcon />;
        }
    };

    const getItemTitle = (item: KnowledgeItem) => {
        switch (item.content_type) {
            case ContentType.FILE:
                // Extract filename from path
                const filePath = item.file_path || item.content as string;
                return filePath.split('/').pop() || 'File';
            case ContentType.URL:
                try {
                    const url = new URL(item.url || '');
                    return url.hostname;
                } catch (e) {
                    return item.url || 'URL';
                }
            case ContentType.TEXT:
                // Use metadata.title if it exists
                return item.metadata?.title || 'Text Content';
            default:
                return 'Knowledge Item';
        }
    };

    const getItemDescription = (item: KnowledgeItem) => {
        switch (item.content_type) {
            case ContentType.FILE:
                // Use metadata.description if it exists
                return item.metadata?.description || 'Uploaded file';
            case ContentType.URL:
                // Use metadata.description or fallback to url
                return item.metadata?.description || item.url || 'External link';
            case ContentType.TEXT:
                // For text content, you might want to show a preview of the content
                return item.content ? `${item.content.substring(0, 100)}${item.content.length > 100 ? '...' : ''}` : '';
            default:
                return item.metadata?.description || '';
        }
    };

    return (
        <div className="kim-container">
            {error && (
                <div className="kim-alert kim-alert-error">
                    <span>{error}</span>
                    <button className="kim-alert-close" onClick={clearMessages}>
                        <DeleteIcon fontSize="small" />
                    </button>
                </div>
            )}

            {success && (
                <div className="kim-alert kim-alert-success">
                    <span>{success}</span>
                    <button className="kim-alert-close" onClick={clearMessages}>
                        <DeleteIcon fontSize="small" />
                    </button>
                </div>
            )}

            <div className="kim-header">
                <h2 className="kim-title">
                    <DescriptionIcon className="kim-title-icon" />
                    Knowledge Items
                </h2>
                <button
                    className="kim-refresh-btn"
                    onClick={validateCategoryAndFetchItems}
                    disabled={loading}
                >
                    <RefreshIcon fontSize="small" />
                    Refresh
                </button>
            </div>

            <div className="kim-content-wrapper">
                <div className="kim-tabs-container">
                    <button
                        className={`kim-tab ${tabValue === 0 ? 'active' : ''}`}
                        onClick={() => setTabValue(0)}
                    >
                        <DescriptionIcon fontSize="small" />
                        All Items
                    </button>
                    <button
                        className={`kim-tab ${tabValue === 1 ? 'active' : ''}`}
                        onClick={() => setTabValue(1)}
                    >
                        <AddIcon fontSize="small" />
                        Add Text
                    </button>
                    <button
                        className={`kim-tab ${tabValue === 2 ? 'active' : ''}`}
                        onClick={() => setTabValue(2)}
                    >
                        <LinkIcon fontSize="small" />
                        Add URL
                    </button>
                    <button
                        className={`kim-tab ${tabValue === 3 ? 'active' : ''}`}
                        onClick={() => setTabValue(3)}
                    >
                        <UploadIcon fontSize="small" />
                        Upload File
                    </button>
                </div>

                <div className="kim-tab-content">
                    {tabValue === 0 && (
                        <>
                            {loading && knowledgeItems.length === 0 ? (
                                <div className="kim-loading">
                                    <div className="kim-loading-spinner"></div>
                                    <span className="kim-loading-text">Loading items...</span>
                                </div>
                            ) : knowledgeItems.length === 0 ? (
                                <div className="kim-empty-state">
                                    <div className="kim-empty-icon">
                                        <DescriptionIcon />
                                    </div>
                                    <h3 className="kim-empty-title">No Knowledge Items</h3>
                                    <p className="kim-empty-text">
                                        Add text, URLs, or upload files to build your knowledge base
                                    </p>
                                </div>
                            ) : (
                                <div className="kim-items-list">
                                    {knowledgeItems.map((item) => (
                                        <div key={item.id} className="kim-item-card">
                                            <div className="kim-item-icon">
                                                {getItemIcon(item.content_type)}
                                            </div>
                                            <div className="kim-item-info">
                                                <h4 className="kim-item-title">{getItemTitle(item)}</h4>
                                                <p className="kim-item-description">{getItemDescription(item)}</p>
                                            </div>
                                            <button
                                                className="kim-item-delete"
                                                onClick={() => openDeleteDialog(item)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tabValue === 1 && (
                        <div className="kim-form-section">
                            <h3 className="kim-form-title">
                                <AddIcon /> Add Text Content
                            </h3>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Title</label>
                                <input
                                    type="text"
                                    className="kim-form-input"
                                    placeholder="Enter a title for this content..."
                                    value={textContent.title}
                                    onChange={(e) => setTextContent({ ...textContent, title: e.target.value })}
                                />
                            </div>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Content</label>
                                <textarea
                                    className="kim-form-textarea"
                                    placeholder="Enter your text content here..."
                                    value={textContent.content}
                                    onChange={(e) => setTextContent({ ...textContent, content: e.target.value })}
                                />
                            </div>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Update Frequency</label>
                                <select
                                    className="kim-form-select"
                                    value={textContent.updateFrequency}
                                    onChange={(e) => setTextContent({ ...textContent, updateFrequency: e.target.value as UpdateFrequency })}
                                >
                                    <option value={UpdateFrequency.NEVER}>Never</option>
                                    <option value={UpdateFrequency.DAILY}>Daily</option>
                                    <option value={UpdateFrequency.WEEKLY}>Weekly</option>
                                    <option value={UpdateFrequency.MONTHLY}>Monthly</option>
                                </select>
                            </div>
                            <button
                                className="kim-submit-btn"
                                onClick={handleAddTextContent}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                Add Text
                            </button>
                        </div>
                    )}

                    {tabValue === 2 && (
                        <div className="kim-form-section">
                            <h3 className="kim-form-title">
                                <LinkIcon /> Add URL
                            </h3>
                            <div className="kim-form-group">
                                <label className="kim-form-label">URL</label>
                                <input
                                    type="text"
                                    className="kim-form-input"
                                    placeholder="https://example.com"
                                    value={urlContent.url}
                                    onChange={(e) => setUrlContent({ ...urlContent, url: e.target.value })}
                                />
                            </div>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Description (Optional)</label>
                                <textarea
                                    className="kim-form-textarea"
                                    style={{ minHeight: '80px' }}
                                    placeholder="Add a description for this URL..."
                                    value={urlContent.description}
                                    onChange={(e) => setUrlContent({ ...urlContent, description: e.target.value })}
                                />
                            </div>
                            <div className="kim-form-row">
                                <div className="kim-form-group" style={{ marginBottom: 0 }}>
                                    <label className="kim-form-label">Max Depth</label>
                                    <input
                                        type="number"
                                        className="kim-form-input"
                                        min={1}
                                        max={5}
                                        value={urlContent.maxDepth}
                                        onChange={(e) => setUrlContent({ ...urlContent, maxDepth: parseInt(e.target.value) || 2 })}
                                    />
                                </div>
                                <div className="kim-form-group" style={{ marginBottom: 0 }}>
                                    <label className="kim-form-label">Knowledge Type</label>
                                    <select
                                        className="kim-form-select"
                                        value={urlContent.knowledgeType}
                                        onChange={(e) => setUrlContent({ ...urlContent, knowledgeType: e.target.value })}
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="general">General</option>
                                        <option value="documentation">Documentation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Update Frequency</label>
                                <select
                                    className="kim-form-select"
                                    value={urlContent.updateFrequency}
                                    onChange={(e) => setUrlContent({ ...urlContent, updateFrequency: e.target.value as UpdateFrequency })}
                                >
                                    <option value={UpdateFrequency.NEVER}>Never</option>
                                    <option value={UpdateFrequency.DAILY}>Daily</option>
                                    <option value={UpdateFrequency.WEEKLY}>Weekly</option>
                                    <option value={UpdateFrequency.MONTHLY}>Monthly</option>
                                </select>
                            </div>
                            {urlProcessingStatus.isProcessing ? (
                                <div className="kim-progress-container">
                                    <div className="kim-progress-header">
                                        <div className="kim-progress-spinner"></div>
                                        <span className="kim-progress-text">
                                            {urlProcessingStatus.crawlStrategy.toUpperCase()} Crawl: {urlProcessingStatus.statusMessage || 'Starting...'}
                                        </span>
                                    </div>
                                    <div className="kim-progress-bar">
                                        <div
                                            className="kim-progress-fill"
                                            style={{ width: `${urlProcessingStatus.progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="kim-progress-details">
                                        <span>{urlProcessingStatus.progress}% - {urlProcessingStatus.pagesProcessed}/{urlProcessingStatus.totalPages} pages</span>
                                        <span>{urlProcessingStatus.chunksStored} chunks • {urlProcessingStatus.codeExamplesCount} code examples</span>
                                    </div>
                                    {urlProcessingStatus.currentPage && (
                                        <p className="kim-progress-current">Current: {urlProcessingStatus.currentPage}</p>
                                    )}
                                </div>
                            ) : (
                                <button
                                    className="kim-submit-btn"
                                    onClick={handleAddUrl}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
                                    Add URL
                                </button>
                            )}
                        </div>
                    )}

                    {tabValue === 3 && (
                        <div className="kim-form-section">
                            <h3 className="kim-form-title">
                                <UploadIcon /> Upload File
                            </h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                multiple
                            />
                            <div className="kim-upload-area" onClick={triggerFileInput}>
                                {selectedFiles.length > 0 ? (
                                    <>
                                        <div className="kim-upload-icon">
                                            <FileIcon />
                                        </div>
                                        <h4 className="kim-upload-title kim-upload-selected">
                                            {selectedFiles.length === 1
                                                ? selectedFiles[0].name
                                                : `${selectedFiles.length} files selected`}
                                        </h4>
                                        <p className="kim-upload-text">
                                            {selectedFiles.length === 1
                                                ? `${(selectedFiles[0].size / 1024).toFixed(2)} KB`
                                                : selectedFiles.map(f => f.name).join(', ')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="kim-upload-icon">
                                            <UploadIcon />
                                        </div>
                                        <h4 className="kim-upload-title">Click to select files</h4>
                                        <p className="kim-upload-text">
                                            Supports PDF, DOCX, TXT, and more. Select multiple files by holding Ctrl/Cmd.
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="kim-form-group">
                                <label className="kim-form-label">Description (Optional)</label>
                                <input
                                    type="text"
                                    className="kim-form-input"
                                    placeholder="Add a description for this file..."
                                    value={fileDescription}
                                    onChange={(e) => setFileDescription(e.target.value)}
                                />
                            </div>
                            <button
                                className="kim-submit-btn"
                                onClick={handleUploadFile}
                                disabled={loading || selectedFiles.length === 0}
                            >
                                {loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                                Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {deleteDialogOpen && (
                <div className="kim-dialog-overlay" onClick={() => setDeleteDialogOpen(false)}>
                    <div className="kim-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="kim-dialog-header">
                            <h3 className="kim-dialog-title">Confirm Deletion</h3>
                            <button className="kim-dialog-close" onClick={() => setDeleteDialogOpen(false)}>
                                ×
                            </button>
                        </div>
                        <div className="kim-dialog-content">
                            <p className="kim-dialog-text">
                                Are you sure you want to delete this knowledge item?
                            </p>
                            <div className="kim-dialog-warning">
                                <DeleteIcon className="kim-dialog-warning-icon" />
                                <p className="kim-dialog-warning-text">
                                    This action cannot be undone. The knowledge item will be permanently removed from this category.
                                </p>
                            </div>
                        </div>
                        <div className="kim-dialog-footer">
                            <button
                                className="kim-btn kim-btn-cancel"
                                onClick={() => setDeleteDialogOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="kim-btn kim-btn-danger"
                                onClick={handleDeleteItem}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeItemManager;    