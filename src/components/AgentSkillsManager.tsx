import React, { useState, useEffect } from 'react';
import { agentSkillsService, AgentSkill, SkillInstallRequest } from '../services/agentSkillsService';
import { Plus, Trash2, Power, PowerOff, RefreshCw, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const AgentSkillsManager: React.FC = () => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInternal, setShowInternal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const data = await agentSkillsService.getSkills(showInternal);
      setSkills(data);
    } catch (error) {
      toast.error('Failed to load skills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [showInternal]);

  const handleToggle = async (skillId: number, currentEnabled: boolean) => {
    try {
      await agentSkillsService.toggleSkill(skillId, !currentEnabled);
      await loadSkills();
    } catch (error) {
      toast.error('Failed to toggle skill.');
    }
  };

  const handleRemove = async (skillId: number) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) return;
    
    try {
      await agentSkillsService.removeSkill(skillId);
      await loadSkills();
      if (selectedSkill?.id === skillId) {
        setSelectedSkill(null);
      }
    } catch (error) {
      toast.error('Failed to remove skill.');
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await agentSkillsService.syncSkills();
      toast.success(`Synced: ${result.discovered} discovered, ${result.installed} installed, ${result.updated} updated`);
      await loadSkills();
    } catch (error) {
      toast.error('Failed to sync skills.');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = async (skillId: number) => {
    try {
      const skill = await agentSkillsService.getSkill(skillId);
      setSelectedSkill(skill);
    } catch (error) {
      toast.error('Failed to load skill details.');
    }
  };

  const categoryColors: Record<string, string> = {
    general: 'bg-gray-100 text-gray-800',
    performance: 'bg-blue-100 text-blue-800',
    security: 'bg-red-100 text-red-800',
    ui: 'bg-purple-100 text-purple-800',
    api: 'bg-green-100 text-green-800',
    testing: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Skills Manager</h1>
          <p className="text-gray-600 mt-2">Manage and configure agent capabilities</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowInternal(!showInternal)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            {showInternal ? <EyeOff size={18} /> : <Eye size={18} />}
            {showInternal ? 'Hide Internal' : 'Show Internal'}
          </button>
          
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            Sync Skills
          </button>
          
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Plus size={18} />
            Install Skill
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading skills...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`border rounded-lg p-4 transition cursor-pointer ${
                    selectedSkill?.id === skill.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleViewDetails(skill.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{skill.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[skill.category] || categoryColors.general}`}>
                          {skill.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{skill.description}</p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(skill.id, skill.enabled);
                        }}
                        className={`p-2 rounded transition ${
                          skill.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={skill.enabled ? 'Disable' : 'Enable'}
                      >
                        {skill.enabled ? <Power size={18} /> : <PowerOff size={18} />}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(skill.id);
                        }}
                        className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {skills.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No skills installed yet</p>
                  <button
                    onClick={() => setShowInstallModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Install Your First Skill
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedSkill ? (
              <div className="border border-gray-200 rounded-lg p-4 sticky top-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Skill Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{selectedSkill.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-600 text-sm">{selectedSkill.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900">{selectedSkill.category}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <p className={`font-medium ${selectedSkill.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {selectedSkill.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  
                  {selectedSkill.content && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Content</label>
                      <div className="mt-2 bg-gray-50 rounded p-3 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap">{selectedSkill.content}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500 sticky top-6">
                Select a skill to view details
              </div>
            )}
          </div>
        </div>
      )}

      {showInstallModal && (
        <InstallSkillModal
          onClose={() => setShowInstallModal(false)}
          onInstalled={() => {
            setShowInstallModal(false);
            loadSkills();
          }}
        />
      )}
    </div>
  );
};

const InstallSkillModal: React.FC<{ onClose: () => void; onInstalled: () => void }> = ({ onClose, onInstalled }) => {
  const [formData, setFormData] = useState<SkillInstallRequest>({
    name: '',
    description: '',
    category: 'general',
    content: '',
    metadata: {},
  });
  const [installing, setInstalling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setInstalling(true);
      await agentSkillsService.installSkill(formData);
      onInstalled();
    } catch (error) {
      console.error('Failed to install skill:', error);
      toast.error('Failed to install skill.');
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Install New Skill</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="ui">UI/UX</option>
              <option value="api">API</option>
              <option value="testing">Testing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={12}
              placeholder="Enter skill instructions in Markdown format..."
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={installing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {installing ? 'Installing...' : 'Install Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
