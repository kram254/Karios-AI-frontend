import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import { CategoryManagement } from '../components/knowledge/CategoryManagement';
import KnowledgeItemManager from '../components/knowledge/KnowledgeItemManager';
import { categoryService } from '../services/api/category.service';
import { Category } from '../types/knowledge';
import { useAuth } from '../context/AuthContext';

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

export const KnowledgeManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategories();
      const categoriesData = response.data || [];
      setCategories(categoriesData);
      
      // Select the first category if available and we don't have one selected
      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setSelectedTab(1); // Switch to knowledge items tab
  };

  const handleCategoryCreated = async () => {
    await fetchCategories();
    // Wait for categories to be fetched, then select the last one (newly created)
    setTimeout(() => {
      if (categories.length > 0) {
        setSelectedCategory(categories[categories.length - 1]);
        setSelectedTab(1); // Switch to knowledge items tab
      }
    }, 500);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Knowledge Management
        </Typography>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="#" onClick={() => setSelectedTab(0)}>
            Categories
          </Link>
          {selectedCategory && (
            <Typography color="text.primary">{selectedCategory.name}</Typography>
          )}
        </Breadcrumbs>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your knowledge base categories and content for AI agents
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: '#1A1A1A',
          color: '#FFFFFF',
          border: '1px solid rgba(0, 243, 255, 0.2)',
          mb: 4
        }}
      >
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          aria-label="knowledge-management-tabs"
          sx={{
            borderBottom: '1px solid rgba(0, 243, 255, 0.2)',
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F3FF',
            },
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-selected': {
                color: '#00F3FF',
              },
            },
          }}
        >
          <Tab label="Categories" />
          <Tab 
            label="Knowledge Items" 
            disabled={!selectedCategory}
          />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          <TabPanel value={selectedTab} index={0}>
            <CategoryManagement 
              onCategorySelect={handleCategorySelect}
              onCategoryCreated={handleCategoryCreated}
            />
          </TabPanel>
          
          <TabPanel value={selectedTab} index={1}>
            {selectedCategory ? (
              <KnowledgeItemManager 
                categoryId={String(selectedCategory.id)} 
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Please select a category first
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default KnowledgeManagement;
