import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Grid,
    Chip,
    Tooltip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon
} from '@mui/icons-material';
import { categoryService } from '../../services/api/category.service';
import { Category } from '../../types/knowledge';
import './CategoryManagement.css';

interface CategoryManagementProps {
    onCategorySelect?: (category: Category) => void;
    onCategoryCreated?: () => Promise<void>;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
    onCategorySelect,
    onCategoryCreated
}) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getCategories();
            setCategories(response.data);
            if (response.data.length > 0 && !selectedCategory) {
                setSelectedCategory(response.data[0]);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            setError('Failed to load categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setFormData({ name: category.name, description: category.description });
            setSelectedCategory(category);
        } else {
            setFormData({ name: '', description: '' });
            setSelectedCategory(null);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setError(null);
    };

    const handleOpenDeleteDialog = (category: Category) => {
        setSelectedCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
    };

    const handleSelectCategory = (category: Category) => {
        setSelectedCategory(category);
        if (onCategorySelect) {
            onCategorySelect(category);
        }
    };

    const handleCreateCategory = async () => {
        if (!formData.name.trim()) {
            setError('Category name is required');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (selectedCategory) {
                // Update existing category
                await categoryService.updateCategory(selectedCategory.id, {
                    name: formData.name.trim(),
                    description: formData.description.trim()
                });
            } else {
                // Create new category
                await categoryService.createCategory({
                    name: formData.name.trim(),
                    description: formData.description.trim()
                });
            }
            
            // Refresh categories list
            await fetchCategories();
            setIsDialogOpen(false);
            if (onCategoryCreated) {
                await onCategoryCreated();
            }
        } catch (error) {
            console.error('Failed to save category:', error);
            setError('Failed to save category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!selectedCategory) return;

        setLoading(true);
        setError(null);
        try {
            await categoryService.deleteCategory(selectedCategory.id);
            setSuccess('Category deleted successfully!');
            handleCloseDeleteDialog();
            
            // Update the categories list
            const updatedCategories = categories.filter(c => c.id !== selectedCategory.id);
            setCategories(updatedCategories);
            if (updatedCategories.length > 0) {
                setSelectedCategory(updatedCategories[0]);
                if (onCategorySelect) {
                    onCategorySelect(updatedCategories[0]);
                }
            } else {
                setSelectedCategory(null);
            }
        } catch (error) {
            console.error('Failed to delete category:', error);
            setError('Failed to delete category. Please try again.');
            handleCloseDeleteDialog();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Knowledge Categories
                </Typography>
                <Button 
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ 
                        bgcolor: '#00F3FF',
                        color: '#000000',
                        '&:hover': {
                            bgcolor: '#00D6E0',
                        }
                    }}
                >
                    Add Category
                </Button>
            </Box>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert 
                    severity="success" 
                    sx={{ mb: 2 }}
                    onClose={() => setSuccess(null)}
                >
                    {success}
                </Alert>
            )}

            {loading && categories.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress sx={{ color: '#00F3FF' }} />
                </Box>
            ) : categories.length === 0 ? (
                <Box sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    border: '1px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <FolderIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                    <Typography variant="h6">No Categories</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create your first category to organize your knowledge base
                    </Typography>
                    <Button 
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        sx={{ 
                            borderColor: '#00F3FF',
                            color: '#00F3FF',
                            '&:hover': {
                                borderColor: '#00D6E0',
                                bgcolor: 'rgba(0, 243, 255, 0.1)',
                            }
                        }}
                    >
                        Add First Category
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {categories.map(category => (
                        <Grid item xs={12} sm={6} md={4} key={category.id}>
                            <Paper 
                                sx={{ 
                                    p: 2, 
                                    position: 'relative',
                                    bgcolor: '#1A1A1A',
                                    color: '#FFFFFF',
                                    border: selectedCategory?.id === category.id 
                                        ? '1px solid #00F3FF' 
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: '#00F3FF',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                                    }
                                }}
                                onClick={() => handleSelectCategory(category)}
                            >
                                <Box sx={{ 
                                    position: 'absolute', 
                                    top: 12, 
                                    right: 12,
                                    display: 'flex',
                                    gap: 1
                                }}>
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(category);
                                        }}
                                        sx={{ 
                                            color: '#00F3FF',
                                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                                            '&:hover': {
                                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                                            }
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton 
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDeleteDialog(category);
                                        }}
                                        sx={{ 
                                            color: '#f44336',
                                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                                            '&:hover': {
                                                bgcolor: 'rgba(0, 0, 0, 0.3)',
                                            }
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, mt: 1 }}>
                                    <FolderIcon sx={{ color: '#00F3FF', mr: 1, fontSize: 32 }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ 
                                            mb: 0.5, 
                                            pr: 6, 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 1,
                                            WebkitBoxOrient: 'vertical'
                                        }}>
                                            {category.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ 
                                            mb: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            height: '40px'
                                        }}>
                                            {category.description || 'No description'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                    pt: 1.5,
                                    mt: 1.5
                                }}>
                                    <Chip 
                                        label={`${category.item_count || 0} Items`} 
                                        size="small"
                                        sx={{ 
                                            bgcolor: 'rgba(0, 243, 255, 0.1)',
                                            color: '#00F3FF',
                                            borderRadius: '4px'
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        Created {new Date(category.created_at).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create/Edit Dialog */}
            <Dialog 
                open={isDialogOpen} 
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: { bgcolor: '#1A1A1A', color: '#FFFFFF' }
                }}
            >
                <DialogTitle>
                    {selectedCategory ? 'Edit Category' : 'Create New Category'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        name="name"
                        label="Category Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        InputLabelProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                        InputProps={{
                            sx: { 
                                color: '#FFFFFF',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00F3FF'
                                }
                            }
                        }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="description"
                        name="description"
                        label="Description"
                        type="text"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        InputLabelProps={{
                            sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
                        InputProps={{
                            sx: { 
                                color: '#FFFFFF',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.23)'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.5)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00F3FF'
                                }
                            }
                        }}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={handleCloseDialog}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreateCategory}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{ 
                            bgcolor: '#00F3FF',
                            color: '#000000',
                            '&:hover': {
                                bgcolor: '#00D6E0',
                            },
                            '&.Mui-disabled': {
                                bgcolor: 'rgba(0, 243, 255, 0.3)'
                            }
                        }}
                    >
                        {selectedCategory ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={isDeleteDialogOpen} 
                onClose={handleCloseDeleteDialog}
                PaperProps={{
                    sx: { bgcolor: '#1A1A1A', color: '#FFFFFF' }
                }}
            >
                <DialogTitle>
                    Delete Category
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        Are you sure you want to delete the category <strong>{selectedCategory?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        This will also delete all knowledge items in this category. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={handleCloseDeleteDialog}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteCategory}
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{ 
                            bgcolor: '#f44336',
                            color: '#FFFFFF',
                            '&:hover': {
                                bgcolor: '#e53935',
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
