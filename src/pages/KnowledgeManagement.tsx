import React, { useState, useEffect } from 'react';
import { CategoryManagement } from '../components/knowledge/CategoryManagement';
import KnowledgeItemManager from '../components/knowledge/KnowledgeItemManager';
import { categoryService } from '../services/api/category.service';
import { Category } from '../types/knowledge';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import './KnowledgeManagement.css';
import {
  Folder as FolderIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} className="km-tab-panel">
    {value === index && children}
  </div>
);

export const KnowledgeManagement: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resumeStep, setResumeStep] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    let step: number | null = null;
    try {
      const raw = sessionStorage.getItem('agent_creation_wizard_resume_from_knowledge_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
        const fresh = !savedAt || (Date.now() - savedAt) < (1000 * 60 * 60 * 24);
        if (fresh) {
          const candidate = typeof parsed?.step === 'number' ? parsed.step : Number(parsed?.step);
          step = Number.isFinite(candidate) && candidate > 0 ? Math.min(Math.max(1, Math.round(candidate)), 6) : 4;
        }
      }
    } catch {}

    if (step === null) {
      const state: any = (location as any)?.state || {};
      if (state?.fromAgentWizard) {
        const candidate = typeof state?.step === 'number' ? state.step : Number(state?.step);
        step = Number.isFinite(candidate) && candidate > 0 ? Math.min(Math.max(1, Math.round(candidate)), 6) : 4;
        try {
          sessionStorage.setItem(
            'agent_creation_wizard_resume_from_knowledge_v1',
            JSON.stringify({ step, savedAt: Date.now(), source: 'knowledge_management' })
          );
        } catch {}
      }
    }

    setResumeStep(step);
  }, [location]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    setLoadError(null);
    try {
      const response = await categoryService.getCategories();
      const categoriesData = response.data || [];
      setCategories(categoriesData);

      if (categoriesData.length > 0 && !selectedCategory) {
        setSelectedCategory(categoriesData[0]);
      }
    } catch (err) {
      setError('Failed to load categories. Please try again.');
      setLoadError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToAgentWizard = () => {
    const step = resumeStep && Number.isFinite(resumeStep) ? resumeStep : 4;
    try {
      sessionStorage.setItem(
        'agent_creation_wizard_resume_from_knowledge_v1',
        JSON.stringify({ step, savedAt: Date.now(), source: 'knowledge_management' })
      );
    } catch {}
    navigate('/builder');
  };

  const handleTabChange = (tab: number) => {
    setSelectedTab(tab);
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    if (category) {
      setSelectedTab(1);
    }
  };

  const handleCategoryCreated = async () => {
    const response = await categoryService.getCategories();
    const freshCategories = response.data || [];
    setCategories(freshCategories);

    if (freshCategories.length > 0) {
      setSelectedCategory(freshCategories[freshCategories.length - 1]);
      setSelectedTab(1);
    }
  };

  const handleKnowledgeAdded = async () => {
    await fetchCategories();

    if (selectedCategory) {
      try {
        const updatedCategory = await categoryService.getCategoryById(selectedCategory.id);
        setSelectedCategory(updatedCategory.data);

        setCategories(prevCategories => {
          return prevCategories.map(cat =>
            cat.id === updatedCategory.data.id ? updatedCategory.data : cat
          );
        });
      } catch (err) {
      }
    }
  };

  const handleKnowledgeDeleted = async () => {
    await fetchCategories();

    if (selectedCategory) {
      try {
        const updatedCategory = await categoryService.getCategoryById(selectedCategory.id);
        setSelectedCategory(updatedCategory.data);

        setCategories(prevCategories => {
          return prevCategories.map(cat =>
            cat.id === updatedCategory.data.id ? updatedCategory.data : cat
          );
        });
      } catch (err) {
      }
    }
  };

  return (
    <div className="km-page">
      <div className="km-page-header">
        <div className="km-page-title-section">
          <div className="km-page-title-row">
            <h1 className="km-page-title">Knowledge Management</h1>
            {resumeStep !== null && (
              <button className="km-return-wizard-btn" onClick={handleReturnToAgentWizard}>
                <ArrowBackIcon fontSize="small" />
                Return to Agent Wizard
              </button>
            )}
          </div>
          <div className="km-breadcrumbs">
            <button
              className="km-breadcrumb-item"
              onClick={() => setSelectedTab(0)}
            >
              <HomeIcon fontSize="small" />
              Categories
            </button>
            {selectedCategory && selectedTab === 1 && (
              <>
                <span className="km-breadcrumb-separator">/</span>
                <span className="km-breadcrumb-current">
                  <FolderIcon fontSize="small" />
                  {selectedCategory.name}
                </span>
              </>
            )}
          </div>
          <p className="km-page-subtitle">
            Manage your knowledge base categories and content for AI agents
          </p>
        </div>
      </div>

      {error && (
        <div className="km-page-alert km-alert-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {loadError && (
        <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{loadError}</span>
          <button type="button" onClick={fetchCategories} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}
      <div className="km-page-content">
        <div className="km-tabs-container">
          <button
            className={`km-tab ${selectedTab === 0 ? 'active' : ''}`}
            onClick={() => handleTabChange(0)}
          >
            <FolderIcon fontSize="small" />
            Categories
            {categories.length > 0 && (
              <span className="km-tab-badge">{categories.length}</span>
            )}
          </button>
          <button
            className={`km-tab ${selectedTab === 1 ? 'active' : ''} ${!selectedCategory ? 'disabled' : ''}`}
            onClick={() => selectedCategory && handleTabChange(1)}
            disabled={!selectedCategory}
          >
            <DescriptionIcon fontSize="small" />
            Knowledge Items
            {selectedCategory && (
              <span className="km-tab-badge">
                {selectedCategory.knowledge_items?.length || 0}
              </span>
            )}
          </button>
        </div>

        <div className="km-tab-content">
          <TabPanel value={selectedTab} index={0}>
            <CategoryManagement
              onCategorySelect={handleCategorySelect}
              onCategoryCreated={handleCategoryCreated}
            />
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            {selectedCategory ? (
              <div className="km-items-container">
                <button
                  className="km-back-btn"
                  onClick={() => setSelectedTab(0)}
                >
                  <ArrowBackIcon fontSize="small" />
                  Back to Categories
                </button>
                <div className="km-selected-category-banner">
                  <div className="km-banner-icon">
                    <FolderIcon />
                  </div>
                  <div className="km-banner-info">
                    <h3 className="km-banner-title">{selectedCategory.name}</h3>
                    <p className="km-banner-description">
                      {selectedCategory.description || 'No description'}
                    </p>
                  </div>
                </div>
                <KnowledgeItemManager
                  categoryId={String(selectedCategory.id)}
                  onKnowledgeAdded={handleKnowledgeAdded}
                  onKnowledgeDeleted={handleKnowledgeDeleted}
                />
              </div>
            ) : (
              <div className="km-no-selection">
                <FolderIcon className="km-no-selection-icon" />
                <h3>No Category Selected</h3>
                <p>Please select a category first to manage knowledge items</p>
                <button
                  className="km-select-category-btn"
                  onClick={() => setSelectedTab(0)}
                >
                  Select a Category
                </button>
              </div>
            )}
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeManagement;
