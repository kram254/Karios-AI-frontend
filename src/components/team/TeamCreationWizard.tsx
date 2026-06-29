import React, { useState, useEffect } from 'react';
import { X, Users, Sparkles, ChevronRight, ChevronLeft, Crown, Code2, Megaphone, Search, Plus, Trash2, DollarSign } from 'lucide-react';
import { agentTeamService, type TeamTemplate } from '../../services/agentTeamService';

interface TeamCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (teamId: number) => void;
}

const ROLE_OPTIONS = [
  { value: 'ceo', label: 'CEO', icon: Crown },
  { value: 'cto', label: 'CTO', icon: Code2 },
  { value: 'cmo', label: 'CMO', icon: Megaphone },
  { value: 'engineer', label: 'Engineer', icon: Code2 },
  { value: 'designer', label: 'Designer', icon: Sparkles },
  { value: 'qa', label: 'QA', icon: Code2 },
  { value: 'researcher', label: 'Researcher', icon: Search },
  { value: 'pm', label: 'PM', icon: Users },
  { value: 'general', label: 'General', icon: Users },
];

interface MemberDraft {
  name: string;
  role: string;
  reportsToIndex: number | null;
}

const TeamCreationWizard: React.FC<TeamCreationWizardProps> = ({ isOpen, onClose, onCreated }) => {
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState<TeamTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [budgetCents, setBudgetCents] = useState(10000);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      agentTeamService.listTemplates().then((data) => {
        console.log('Loaded templates:', data);
        setTemplates(data);
      }).catch((err) => {
        console.error('Failed to load templates:', err);
        setError('Failed to load templates. Please try again.');
      });
      setStep(0);
      setSelectedTemplate(null);
      setTeamName('');
      setTeamDescription('');
      setMembers([]);
      setBudgetCents(10000);
      setError('');
    }
  }, [isOpen]);

  const handleTemplateSelect = (tid: string) => {
    setSelectedTemplate(tid);
    const tmpl = templates.find(t => t.template_id === tid);
    if (tmpl) {
      setTeamName(tmpl.name);
      if (tmpl.monthly_budget_cents) setBudgetCents(tmpl.monthly_budget_cents);
    }
  };

  const addMember = () => {
    setMembers([...members, { name: '', role: 'general', reportsToIndex: null }]);
  };

  const removeMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx: number, field: keyof MemberDraft, value: any) => {
    const updated = [...members];
    (updated[idx] as any)[field] = value;
    setMembers(updated);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      console.log('Creating team with template:', selectedTemplate);
      if (selectedTemplate) {
        const result = await agentTeamService.createFromTemplate(
          selectedTemplate,
          teamName || undefined,
          budgetCents,
        );
        console.log('Create from template result:', result);
        if (result.team_db_id) {
          onCreated(result.team_db_id);
        } else if (result.team?.id) {
          onCreated(result.team.id);
        } else {
          throw new Error('Team created but no ID returned');
        }
      } else {
        const team = await agentTeamService.createTeam({
          name: teamName,
          description: teamDescription || undefined,
          monthly_budget_cents: budgetCents,
        });
        console.log('Created team:', team);
        if (team && team.id) {
          for (const m of members) {
            if (m.name.trim()) {
              await agentTeamService.hireMember(team.id, {
                name: m.name,
                role: m.role,
              });
            }
          }
          await agentTeamService.updateTeam(team.id, { status: 'active' });
          onCreated(team.id);
        } else {
          throw new Error('Team created but no ID returned');
        }
      }
    } catch (e: any) {
      console.error('Create team error:', e);
      setError(e.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  const steps = selectedTemplate
    ? ['Template', 'Customize', 'Review']
    : ['Choose', 'Details', 'Members', 'Budget', 'Review'];

  const canNext = () => {
    if (step === 0) return true;
    if (selectedTemplate) {
      if (step === 1) return teamName.trim().length > 0;
      return true;
    } else {
      if (step === 1) return teamName.trim().length > 0;
      return true;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Users size={16} className="text-cyan-400" />
            </div>
            <span className="text-sm font-medium text-white">Create Agent Team</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 border-b border-[#1A1A1A]">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 ${i <= step ? 'text-cyan-400' : 'text-gray-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${i <= step ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-600'}`}>
                  {i + 1}
                </div>
                <span className="text-xs">{s}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-[#2A2A2A]" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Choose a pre-built template or create a custom team.</p>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.template_id}
                    onClick={() => handleTemplateSelect(tmpl.template_id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${selectedTemplate === tmpl.template_id ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3A3A3A]'}`}
                  >
                    <div className="text-sm font-medium text-white mb-1">{tmpl.name}</div>
                    <div className="text-xs text-gray-500 mb-2 line-clamp-2">{tmpl.description}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {tmpl.roles.map((r, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400 capitalize">{r}</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">{tmpl.member_count} members</div>
                  </button>
                ))}
                <button
                  onClick={() => { setSelectedTemplate(null); setStep(1); }}
                  className={`p-4 rounded-xl border border-dashed text-left transition-all duration-200 ${!selectedTemplate ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-[#2A2A2A] hover:border-[#3A3A3A]'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Plus size={14} className="text-cyan-400" />
                    <span className="text-sm font-medium text-white">Custom Team</span>
                  </div>
                  <div className="text-xs text-gray-500">Build your own team from scratch</div>
                </button>
              </div>
            </div>
          )}

          {((selectedTemplate && step === 1) || (!selectedTemplate && step === 1)) && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Team Name</label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
                  placeholder="e.g., Engineering Team"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none resize-none"
                  rows={3}
                  placeholder="What does this team do?"
                />
              </div>
            </div>
          )}

          {!selectedTemplate && step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Add team members</p>
                <button onClick={addMember} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Plus size={12} /> Add Member
                </button>
              </div>
              <div className="space-y-3">
                {members.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
                    <input
                      value={m.name}
                      onChange={(e) => updateMember(idx, 'name', e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-600 focus:outline-none"
                      placeholder="Agent name"
                    />
                    <select
                      value={m.role}
                      onChange={(e) => updateMember(idx, 'role', e.target.value)}
                      className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <button onClick={() => removeMember(idx)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                    <Users size={24} className="mb-2 opacity-40" />
                    <span className="text-xs">No members added yet</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedTemplate && step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Monthly Budget</label>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-500" />
                  <input
                    type="number"
                    value={budgetCents / 100}
                    onChange={(e) => setBudgetCents(Math.round(parseFloat(e.target.value || '0') * 100))}
                    className="w-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                    min={0}
                    step={1}
                  />
                  <span className="text-xs text-gray-500">USD/month</span>
                </div>
              </div>
            </div>
          )}

          {((selectedTemplate && step === 2) || (!selectedTemplate && step === 4)) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Review your team configuration:</p>
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Name</span>
                  <span className="text-sm text-white">{teamName}</span>
                </div>
                {teamDescription && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Description</span>
                    <span className="text-sm text-gray-300 truncate max-w-[300px]">{teamDescription}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Budget</span>
                  <span className="text-sm text-green-400">${(budgetCents / 100).toFixed(2)}/mo</span>
                </div>
                {selectedTemplate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Template</span>
                    <span className="text-sm text-cyan-400 capitalize">{selectedTemplate.replace('_', ' ')}</span>
                  </div>
                )}
                {!selectedTemplate && members.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-2">Members ({members.length})</span>
                    <div className="space-y-1">
                      {members.filter(m => m.name.trim()).map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="text-white">{m.name}</span>
                          <span className="text-gray-500 capitalize">({m.role})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {error && <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</div>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2A2A2A]">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {((selectedTemplate && step < 2) || (!selectedTemplate && step < 4)) ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating || !teamName.trim()}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Team'}
              <Sparkles size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCreationWizard;
