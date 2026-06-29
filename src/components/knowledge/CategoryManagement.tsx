import React, { useState, useEffect } from 'react';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Description as DescriptionIcon,
    Close as CloseIcon,
    Check as CheckIcon,
    Warning as WarningIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { categoryService } from '../../services/api/category.service';
import { Category } from '../../types/knowledge';
import './CategoryManagement.css';

interface CategoryManagementProps {
    onCategorySelect?: (category: Category | null) => void;
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
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getCategories();

            if (response.data && response.data.length > 0) {
                const categoriesWithItems = await Promise.all(response.data.map(async (category) => {
                    try {
                        const detailedResponse = await categoryService.getCategoryById(category.id);

                        if (!detailedResponse.data.knowledge_items || detailedResponse.data.knowledge_items.length === 0) {
                            const itemsResponse = await categoryService.getKnowledgeItemsByCategory(category.id);

                            return {
                                ...detailedResponse.data,
                                knowledge_items: itemsResponse.data || [],
                            };
                        }

                        return detailedResponse.data;
                    } catch (err) {
                        return category;
                    }
                }));

                setCategories(categoriesWithItems);
                if (categoriesWithItems.length > 0 && !selectedCategory) {
                    setSelectedCategory(categoriesWithItems[0]);
                }
            } else {
                setCategories([]);
            }
        } catch (err) {
            setError('Failed to load categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setFormData({ name: category.name, description: category.description });
            setEditingCategory(category);
        } else {
            setFormData({ name: '', description: '' });
            setEditingCategory(null);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setError(null);
        setEditingCategory(null);
    };

    const handleOpenDeleteDialog = (category: Category) => {
        setEditingCategory(category);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setIsDeleteDialogOpen(false);
        setEditingCategory(null);
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
            if (editingCategory) {
                await categoryService.updateCategory(editingCategory.id, {
                    name: formData.name.trim(),
                    description: formData.description.trim()
                });
                setSuccess('Category updated successfully!');
            } else {
                await categoryService.createCategory({
                    name: formData.name.trim(),
                    description: formData.description.trim()
                });
                setSuccess('Category created successfully!');
            }

            await fetchCategories();
            setIsDialogOpen(false);
            setEditingCategory(null);
            if (onCategoryCreated) {
                await onCategoryCreated();
            }
        } catch (error) {
            setError('Failed to save category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!editingCategory) return;

        const deletedCategoryId = editingCategory.id;
        setLoading(true);
        setError(null);
        try {
            await categoryService.deleteCategory(deletedCategoryId);
            setSuccess('Category deleted successfully!');
            handleCloseDeleteDialog();

            const response = await categoryService.getCategories();
            const freshCategories = response.data || [];
            setCategories(freshCategories);

            setSelectedCategory(null);
            if (onCategorySelect) {
                onCategorySelect(null);
            }

            if (freshCategories.length > 0) {
                const newCategory = freshCategories[0];
                setTimeout(() => {
                    setSelectedCategory(newCategory);
                    if (onCategorySelect) {
                        onCategorySelect(newCategory);
                    }
                }, 300);
            }
        } catch (error) {
            setError('Failed to delete category. Please try again.');
            handleCloseDeleteDialog();
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="km-container">
            <div className="km-header">
                <h2 className="km-title">
                    <FolderIcon className="km-title-icon" />
                    Knowledge Categories
                </h2>
                <button className="km-add-btn" onClick={() => handleOpenDialog()}>
                    <AddIcon />
                    Add Category
                </button>
            </div>

            {error && (
                <div className="km-alert km-alert-error">
                    <WarningIcon />
                    {error}
                    <button className="km-alert-close" onClick={() => setError(null)}>
                        <CloseIcon fontSize="small" />
                    </button>
                </div>
            )}

            {success && (
                <div className="km-alert km-alert-success">
                    <CheckIcon />
                    {success}
                    <button className="km-alert-close" onClick={() => setSuccess(null)}>
                        <CloseIcon fontSize="small" />
                    </button>
                </div>
            )}

            {categories.length > 0 && (
                <div className="km-search-container">
                    <input
                        type="text"
                        className="km-search-input"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <SearchIcon className="km-search-icon" />
                </div>
            )}

            {loading && categories.length === 0 ? (
                <div className="km-loading">
                    <div className="km-loading-spinner"></div>
                    <span className="km-loading-text">Loading categories...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="km-empty-state">
                    <div className="km-empty-icon">
                        <FolderIcon />
                    </div>
                    <h3 className="km-empty-title">No Categories Yet</h3>
                    <p className="km-empty-text">
                        Create your first category to organize your knowledge base and power your AI agents
                    </p>
                    <button className="km-empty-btn" onClick={() => handleOpenDialog()}>
                        <AddIcon />
                        Add First Category
                    </button>
                </div>
            ) : (
                <div className="km-categories-grid">
                    {filteredCategories.map(category => (
                        <div
                            key={category.id}
                            className={`km-category-card ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                            onClick={() => handleSelectCategory(category)}
                        >
                            <div className="km-card-header">
                                <div className="km-card-icon">
                                    <FolderIcon />
                                </div>
                                <div className="km-card-actions">
                                    <button
                                        className="km-action-btn edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDialog(category);
                                        }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </button>
                                    <button
                                        className="km-action-btn delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenDeleteDialog(category);
                                        }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </button>
                                </div>
                                {selectedCategory?.id === category.id && (
                                    <div className="km-card-check">
                                        <CheckIcon fontSize="small" />
                                    </div>
                                )}
                            </div>

                            <h3 className="km-card-title">{category.name}</h3>
                            <p className="km-card-description">
                                {category.description || 'No description provided'}
                            </p>

                            <div className="km-card-footer">
                                <div className="km-item-count">
                                    <DescriptionIcon fontSize="small" />
                                    {category.knowledge_items?.length || 0} Items
                                </div>
                                <span className="km-date">
                                    {new Date(category.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isDialogOpen && (
                <div className="km-dialog-overlay" onClick={handleCloseDialog}>
                    <div className="km-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="km-dialog-header">
                            <h3 className="km-dialog-title">
                                {editingCategory ? 'Edit Category' : 'Create New Category'}
                            </h3>
                            <button className="km-dialog-close" onClick={handleCloseDialog}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="km-dialog-content">
                            {error && (
                                <div className="km-alert km-alert-error">
                                    <WarningIcon />
                                    {error}
                                </div>
                            )}
                            <div className="km-form-group">
                                <label className="km-form-label">Category Name *</label>
                                <input
                                    type="text"
                                    className="km-form-input"
                                    placeholder="Enter category name..."
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="km-form-group">
                                <label className="km-form-label">Description</label>
                                <textarea
                                    className="km-form-textarea"
                                    placeholder="Enter category description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="km-dialog-footer">
                            <button className="km-btn km-btn-cancel" onClick={handleCloseDialog}>
                                Cancel
                            </button>
                            <button
                                className="km-btn km-btn-primary"
                                onClick={handleCreateCategory}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteDialogOpen && (
                <div className="km-dialog-overlay" onClick={handleCloseDeleteDialog}>
                    <div className="km-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="km-dialog-header">
                            <h3 className="km-dialog-title">Delete Category</h3>
                            <button className="km-dialog-close" onClick={handleCloseDeleteDialog}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="km-dialog-content">
                            <p style={{ color: '#FFFFFF', margin: 0 }}>
                                Are you sure you want to delete <strong>{editingCategory?.name}</strong>?
                            </p>
                            <div className="km-delete-warning">
                                <WarningIcon className="km-delete-warning-icon" />
                                <p className="km-delete-warning-text">
                                    This will permanently delete all knowledge items in this category. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="km-dialog-footer">
                            <button className="km-btn km-btn-cancel" onClick={handleCloseDeleteDialog}>
                                Cancel
                            </button>
                            <button
                                className="km-btn km-btn-danger"
                                onClick={handleDeleteCategory}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Category'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
