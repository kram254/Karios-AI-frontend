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
        updateFrequency: UpdateFrequency.NEVER 
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
        setUrlContent({ url: '', description: '', updateFrequency: UpdateFrequency.NEVER });
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

    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        
        // Check if category still exists
        if (!await checkCategoryExists()) {
            setLoading(false);
            return;
        }
        
        try {
            const response = await categoryService.addUrl(
                parseInt(categoryId), 
                urlContent.url,
                urlContent.description,
                urlContent.updateFrequency
            );
            setSuccess('URL added successfully');
            validateCategoryAndFetchItems();
            resetForms();
            if (onKnowledgeAdded && response.data) {
                onKnowledgeAdded(response.data);
            }
        } catch (error) {
            console.error('Failed to add URL:', error);
            setError('Failed to add URL. Please try again.');
        } finally {
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
        <Box sx={{ py: 3 }}>
            {error && (
                <Alert 
                    severity="error" 
                    onClose={clearMessages}
                    sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336' }}
                >
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert 
                    severity="success" 
                    onClose={clearMessages}
                    sx={{ mb: 3, bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#4caf50' }}
                >
                    {success}
                </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2">
                    Knowledge Items
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={validateCategoryAndFetchItems}
                    disabled={loading}
                    sx={{
                        borderColor: '#00F3FF',
                        color: '#00F3FF',
                        '&:hover': {
                            borderColor: '#00D4E0',
                            bgcolor: 'rgba(0, 243, 255, 0.1)'
                        }
                    }}
                >
                    Refresh
                </Button>
            </Box>
            
            <Paper 
                sx={{ 
                    bgcolor: '#1A1A1A',
                    color: '#FFFFFF',
                    border: '1px solid rgba(0, 243, 255, 0.2)',
                    mb: 4
                }}
            >
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-selected': {
                                color: '#00F3FF'
                            }
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: '#00F3FF'
                        }
                    }}
                >
                    <Tab label="All Items" />
                    <Tab label="Add Text" />
                    <Tab label="Add URL" />
                    <Tab label="Upload File" />
                </Tabs>
                
                <Box sx={{ p: 3 }}>
                    <TabPanel value={tabValue} index={0}>
                        {loading && knowledgeItems.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress sx={{ color: '#00F3FF' }} />
                            </Box>
                        ) : knowledgeItems.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <DescriptionIcon sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    No Knowledge Items
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Add text, URLs, or upload files to build your knowledge base
                                </Typography>
                            </Box>
                        ) : (
                            <div className="scrollable-container">
                                <List sx={{ width: '100%' }}>
                                    {knowledgeItems.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            {index > 0 && <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />}
                                            <ListItem 
                                                sx={{ 
                                                    py: 2,
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 243, 255, 0.05)'
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ color: '#00F3FF' }}>
                                                    {getItemIcon(item.content_type)}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" sx={{ color: '#FFFFFF' }}>
                                                            {getItemTitle(item)}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                            {getItemDescription(item)}
                                                        </Typography>
                                                    }
                                                />
                                                <ListItemSecondaryAction>
                                                    <Tooltip title="Delete Item">
                                                        <IconButton 
                                                            edge="end" 
                                                            onClick={() => openDeleteDialog(item)}
                                                            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </ListItemSecondaryAction>
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            </div>
                        )}
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={1}>
                        <div className="scrollable-form-container">
                            <Typography variant="h6" gutterBottom>
                                Add Text Content
                            </Typography>
                            <TextField
                                fullWidth
                                label="Title"
                                margin="normal"
                                value={textContent.title}
                                onChange={(e) => setTextContent({ ...textContent, title: e.target.value })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Content"
                                multiline
                                rows={8}
                                margin="normal"
                                value={textContent.content}
                                onChange={(e) => setTextContent({ ...textContent, content: e.target.value })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Update Frequency"
                                select
                                margin="normal"
                                value={textContent.updateFrequency}
                                onChange={(e) => setTextContent({ ...textContent, updateFrequency: e.target.value as UpdateFrequency })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            >
                                <MenuItem value={UpdateFrequency.NEVER}>Never</MenuItem>
                                <MenuItem value={UpdateFrequency.DAILY}>Daily</MenuItem>
                                <MenuItem value={UpdateFrequency.WEEKLY}>Weekly</MenuItem>
                                <MenuItem value={UpdateFrequency.MONTHLY}>Monthly</MenuItem>
                            </TextField>
                            <Button
                                variant="contained"
                                onClick={handleAddTextContent}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                sx={{
                                    bgcolor: '#00F3FF',
                                    color: '#000000',
                                    '&:hover': {
                                        bgcolor: '#00D4E0'
                                    }
                                }}
                            >
                                Add Text
                            </Button>
                        </div>
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={2}>
                        <div className="scrollable-form-container">
                            <Typography variant="h6" gutterBottom>
                                Add URL
                            </Typography>
                            <TextField
                                fullWidth
                                label="URL"
                                placeholder="https://example.com"
                                margin="normal"
                                value={urlContent.url}
                                onChange={(e) => setUrlContent({ ...urlContent, url: e.target.value })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Description (Optional)"
                                margin="normal"
                                value={urlContent.description}
                                onChange={(e) => setUrlContent({ ...urlContent, description: e.target.value })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Update Frequency"
                                select
                                margin="normal"
                                value={urlContent.updateFrequency}
                                onChange={(e) => setUrlContent({ ...urlContent, updateFrequency: e.target.value as UpdateFrequency })}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            >
                                <MenuItem value={UpdateFrequency.NEVER}>Never</MenuItem>
                                <MenuItem value={UpdateFrequency.DAILY}>Daily</MenuItem>
                                <MenuItem value={UpdateFrequency.WEEKLY}>Weekly</MenuItem>
                                <MenuItem value={UpdateFrequency.MONTHLY}>Monthly</MenuItem>
                            </TextField>
                            <Button
                                variant="contained"
                                onClick={handleAddUrl}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
                                sx={{
                                    bgcolor: '#00F3FF',
                                    color: '#000000',
                                    '&:hover': {
                                        bgcolor: '#00D4E0'
                                    }
                                }}
                            >
                                Add URL
                            </Button>
                        </div>
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={3}>
                        <div className="scrollable-form-container">
                            <Typography variant="h6" gutterBottom>
                                Upload File
                            </Typography>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                                multiple
                            />
                            <Box 
                                sx={{ 
                                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                                    borderRadius: 2,
                                    p: 3,
                                    textAlign: 'center',
                                    mb: 3,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: '#00F3FF',
                                        bgcolor: 'rgba(0, 243, 255, 0.05)'
                                    }
                                }}
                                onClick={triggerFileInput}
                            >
                                {selectedFiles.length > 0 ? (
                                    <>
                                        <FileIcon sx={{ fontSize: 40, color: '#00F3FF', mb: 1 }} />
                                        <Typography variant="body1" gutterBottom>
                                            {selectedFiles.length === 1 
                                                ? selectedFiles[0].name 
                                                : `${selectedFiles.length} files selected`}
                                        </Typography>
                                        {selectedFiles.length === 1 ? (
                                            <Typography variant="body2" color="textSecondary">
                                                {(selectedFiles[0].size / 1024).toFixed(2)} KB
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                {selectedFiles.map(f => f.name).join(', ')}
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <UploadIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.5)', mb: 1 }} />
                                        <Typography variant="body1" gutterBottom>
                                            Click to select files
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            Supports PDF, DOCX, TXT, and more. Select multiple files by holding Ctrl/Cmd.
                                        </Typography>
                                    </>
                                )}
                            </Box>
                            
                            <TextField
                                fullWidth
                                label="Description (Optional)"
                                margin="normal"
                                value={fileDescription}
                                onChange={(e) => setFileDescription(e.target.value)}
                                InputLabelProps={{
                                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                                }}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        color: '#FFFFFF',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.2)'
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(0, 243, 255, 0.5)'
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#00F3FF'
                                        }
                                    }
                                }}
                            />
                            
                            <Button
                                variant="contained"
                                onClick={handleUploadFile}
                                disabled={loading || selectedFiles.length === 0}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                                sx={{
                                    bgcolor: '#00F3FF',
                                    color: '#000000',
                                    '&:hover': {
                                        bgcolor: '#00D4E0'
                                    }
                                }}
                            >
                                Upload {selectedFiles.length > 1 ? `${selectedFiles.length} Files` : 'File'}
                            </Button>
                        </div>
                    </TabPanel>
                </Box>
            </Paper>
            
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1A1A1A',
                        color: '#FFFFFF',
                        borderRadius: '8px'
                    }
                }}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this knowledge item?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteItem}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{
                            bgcolor: '#f44336',
                            '&:hover': {
                                bgcolor: '#d32f2f'
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default KnowledgeItemManager;    