import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    TextField,
    InputAdornment,
    CircularProgress,
    Chip,
    Collapse
} from '@mui/material';
import {
    Search as SearchIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Description as DocumentIcon,
    Link as LinkIcon,
    TextSnippet as TextIcon
} from '@mui/icons-material';
import { KnowledgeItem, ContentType } from '../../types/knowledge';

interface KnowledgeSelectorProps {
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
}

export const KnowledgeSelector: React.FC<KnowledgeSelectorProps> = ({
    selectedIds,
    onSelectionChange
}) => {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

    const getContentTypeIcon = (type: ContentType) => {
        switch (type) {
            case ContentType.FILE:
                return <DocumentIcon />;
            case ContentType.URL:
                return <LinkIcon />;
            case ContentType.TEXT:
                return <TextIcon />;
        }
    };

    const getContentTypeColor = (type: ContentType) => {
        switch (type) {
            case ContentType.FILE:
                return '#4CAF50';
            case ContentType.URL:
                return '#2196F3';
            case ContentType.TEXT:
                return '#FF9800';
        }
    };

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => 
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleToggleItem = (itemId: number) => {
        onSelectionChange(
            selectedIds.includes(itemId)
                ? selectedIds.filter(id => id !== itemId)
                : [...selectedIds, itemId]
        );
    };

    const filteredItems = items.filter(item =>
        item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Paper 
            sx={{ 
                bgcolor: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid rgba(0, 243, 255, 0.2)',
                p: 3
            }}
        >
            <Typography variant="h6" gutterBottom>
                Knowledge Base Selection
            </Typography>

            <TextField
                fullWidth
                placeholder="Search knowledge items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                        </InputAdornment>
                    )
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

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress sx={{ color: '#00F3FF' }} />
                </Box>
            ) : (
                <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
                    {filteredItems.map(item => (
                        <ListItem
                            key={item.id}
                            component="div"
                            onClick={() => handleToggleItem(item.id)}
                            sx={{
                                borderRadius: 1,
                                mb: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 243, 255, 0.1)'
                                }
                            }}
                        >
                            <ListItemIcon>
                                <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    sx={{
                                        color: 'rgba(0, 243, 255, 0.5)',
                                        '&.Mui-checked': {
                                            color: '#00F3FF'
                                        }
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.metadata?.title || 'Untitled'}
                                secondary={
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            size="small"
                                            icon={getContentTypeIcon(item.content_type)}
                                            label={item.content_type}
                                            sx={{
                                                bgcolor: `${getContentTypeColor(item.content_type)}20`,
                                                color: getContentTypeColor(item.content_type),
                                                '& .MuiChip-icon': {
                                                    color: getContentTypeColor(item.content_type)
                                                }
                                            }}
                                        />
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                display: 'inline',
                                                ml: 1
                                            }}
                                        >
                                            Updated: {new Date(item.updated_at).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {!loading && filteredItems.length === 0 && (
                <Box 
                    sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        color: 'text.secondary'
                    }}
                >
                    <Typography>
                        No knowledge items found
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};
