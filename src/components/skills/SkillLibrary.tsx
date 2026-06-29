import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography, Checkbox, FormControlLabel, Tabs, Tab, Chip, Switch, IconButton, Tooltip, CircularProgress } from '@mui/material';
import toast from 'react-hot-toast';
import { skillService } from '../../services/api/skill.service';
import { Skill, SkillCreate, SkillUpdate } from '../../types/skill';
import { agentSkillsService, AgentSkill, SkillInstallRequest } from '../../services/agentSkillsService';
import { RefreshCw, Power, PowerOff, Plus, Trash2, Plug, Eye, EyeOff } from 'lucide-react';

type EditorMode = 'create' | 'edit';
type SkillTab = 'library' | 'installed';

interface UnifiedSkill {
    id: string;
    name: string;
    description: string;
    category?: string;
    tags?: string[];
    enabled?: boolean;
    is_public?: boolean;
    definition?: Record<string, any>;
    content?: string;
    source: 'library' | 'installed';
    originalData: Skill | AgentSkill;
}

export default function SkillLibrary() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [installedSkills, setInstalledSkills] = useState<AgentSkill[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<SkillTab>('library');
    const [showInternal, setShowInternal] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [installDialogOpen, setInstallDialogOpen] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [mode, setMode] = useState<EditorMode>('create');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tagsRaw, setTagsRaw] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [definitionRaw, setDefinitionRaw] = useState('{}');
    const [categoryInput, setCategoryInput] = useState('general');
    const [contentInput, setContentInput] = useState('');

    const selectedSkill = useMemo(() => {
        if (!selectedId) return null;
        return skills.find(s => String(s.id) === String(selectedId)) || null;
    }, [skills, selectedId]);

    const reloadLibrarySkills = async () => {
        try {
            const res = await skillService.listSkills(true);
            const data = (res as any)?.data;
            setSkills(Array.isArray(data) ? data : []);
        } catch (e) {
            setSkills([]);
        }
    };

    const reloadInstalledSkills = async () => {
        try {
            const data = await agentSkillsService.getSkills(showInternal);
            setInstalledSkills(Array.isArray(data) ? data : []);
        } catch (e) {
            setInstalledSkills([]);
        }
    };

    const reload = async () => {
        setLoading(true);
        try {
            await Promise.all([reloadLibrarySkills(), reloadInstalledSkills()]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            const result = await agentSkillsService.syncSkills();
            toast.success(`Synced: ${result.discovered} discovered, ${result.installed} installed, ${result.updated} updated`);
            await reload();
        } catch (error) {
            toast.error('Failed to sync skills');
        } finally {
            setSyncing(false);
        }
    };

    const handleToggleSkill = async (skillId: number, currentEnabled: boolean) => {
        try {
            await agentSkillsService.toggleSkill(skillId, !currentEnabled);
            toast.success(`Skill ${!currentEnabled ? 'enabled' : 'disabled'}`);
            await reloadInstalledSkills();
        } catch (error) {
            toast.error('Failed to toggle skill');
        }
    };

    const handleRemoveInstalledSkill = async (skillId: number) => {
        if (!confirm('Are you sure you want to remove this skill?')) return;
        try {
            await agentSkillsService.removeSkill(skillId);
            toast.success('Skill removed');
            if (selectedId === `installed-${skillId}`) {
                setSelectedId(null);
            }
            await reloadInstalledSkills();
        } catch (error) {
            toast.error('Failed to remove skill');
        }
    };

    const handleInstallSkill = async (skillData: SkillInstallRequest) => {
        try {
            await agentSkillsService.installSkill(skillData);
            toast.success('Skill installed');
            setInstallDialogOpen(false);
            await reloadInstalledSkills();
        } catch (error) {
            toast.error('Failed to install skill');
        }
    };

    useEffect(() => {
        reload();
    }, []);

    useEffect(() => {
        reloadInstalledSkills();
    }, [showInternal]);

    useEffect(() => {
        if (!selectedSkill) return;
        setName(selectedSkill.name || '');
        setDescription(String(selectedSkill.description || ''));
        setTagsRaw(Array.isArray(selectedSkill.tags) ? selectedSkill.tags.join(', ') : '');
        setIsPublic(Boolean(selectedSkill.is_public));
        try {
            setDefinitionRaw(JSON.stringify(selectedSkill.definition || {}, null, 2));
        } catch {
            setDefinitionRaw('{}');
        }
    }, [selectedSkill]);

    const openCreate = () => {
        setMode('create');
        setSelectedId(null);
        setName('');
        setDescription('');
        setTagsRaw('');
        setIsPublic(false);
        setDefinitionRaw('{}');
        setDialogOpen(true);
    };

    const openEdit = () => {
        if (!selectedSkill) return;
        setMode('edit');
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
    };

    const parseTags = () => {
        const raw = String(tagsRaw || '');
        const parts = raw.split(',').map(x => x.trim()).filter(Boolean);
        const out: string[] = [];
        for (const p of parts) {
            if (!out.includes(p)) out.push(p);
        }
        return out;
    };

    const parseDefinition = () => {
        const raw = String(definitionRaw || '').trim();
        if (!raw) return {};
        return JSON.parse(raw);
    };

    const save = async () => {
        const n = String(name || '').trim();
        if (!n) {
            toast.error('Name is required');
            return;
        }

        let definition: Record<string, any> = {};
        try {
            definition = parseDefinition();
        } catch {
            toast.error('Definition must be valid JSON');
            return;
        }

        const tags = parseTags();

        try {
            if (mode === 'create') {
                const payload: SkillCreate = {
                    name: n,
                    description: description || undefined,
                    tags,
                    is_public: isPublic,
                    definition,
                };
                await skillService.createSkill(payload);
                toast.success('Skill created');
            } else {
                if (!selectedSkill) return;
                const payload: SkillUpdate = {
                    name: n,
                    description: description || undefined,
                    tags,
                    is_public: isPublic,
                    definition,
                };
                await skillService.updateSkill(selectedSkill.id, payload);
                toast.success('Skill updated');
            }
            closeDialog();
            await reload();
        } catch (e) {
            toast.error('Failed to save skill');
        }
    };

    const remove = async () => {
        if (!selectedSkill) return;
        try {
            await skillService.deleteSkill(selectedSkill.id);
            toast.success('Skill deleted');
            setSelectedId(null);
            await reload();
        } catch {
            toast.error('Failed to delete skill');
        }
    };

    const categoryColors: Record<string, string> = {
        general: 'rgba(107, 114, 128, 0.3)',
        performance: 'rgba(59, 130, 246, 0.3)',
        security: 'rgba(239, 68, 68, 0.3)',
        ui: 'rgba(168, 85, 247, 0.3)',
        api: 'rgba(34, 197, 94, 0.3)',
        testing: 'rgba(234, 179, 8, 0.3)',
        role: 'rgba(0, 243, 255, 0.3)',
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, width: '100%', maxWidth: '1400px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ color: 'white', mb: 0.5 }}>Skill Library</Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>Create reusable prompt/tool/policy bundles and apply them to agents or workflow nodes.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Tooltip title={showInternal ? 'Hide internal skills' : 'Show internal skills'}>
                        <IconButton onClick={() => setShowInternal(!showInternal)} sx={{ color: showInternal ? '#00F3FF' : '#888' }}>
                            {showInternal ? <Eye size={18} /> : <EyeOff size={18} />}
                        </IconButton>
                    </Tooltip>
                    <Button 
                        variant="outlined" 
                        onClick={handleSync} 
                        disabled={syncing}
                        startIcon={syncing ? <CircularProgress size={16} /> : <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />}
                        sx={{ borderColor: 'rgba(59,130,246,0.5)', color: '#3B82F6' }}
                    >
                        Sync Skills
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={() => setInstallDialogOpen(true)} 
                        startIcon={<Plug size={16} />}
                        sx={{ bgcolor: '#22C55E', color: '#000', '&:hover': { bgcolor: '#16A34A' } }}
                    >
                        Install Skill
                    </Button>
                    <Button variant="contained" onClick={openCreate} sx={{ bgcolor: '#00F3FF', color: '#000', '&:hover': { bgcolor: '#00D1DD' } }}>New Skill</Button>
                    <Button variant="outlined" onClick={reload} disabled={loading} sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Refresh</Button>
                </Box>
            </Box>

            <Tabs 
                value={activeTab} 
                onChange={(_, v) => { setActiveTab(v); setSelectedId(null); }}
                sx={{ mb: 2, '& .MuiTab-root': { color: '#888' }, '& .Mui-selected': { color: '#00F3FF' }, '& .MuiTabs-indicator': { bgcolor: '#00F3FF' } }}
            >
                <Tab value="library" label={`Library Skills (${skills.length})`} />
                <Tab value="installed" label={`Installed Skills (${installedSkills.length})`} />
            </Tabs>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px 1fr' }, gap: 2 }}>
                <Paper sx={{ bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '16px', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: 'white' }}>
                            {activeTab === 'library' ? 'Library Skills' : 'Installed Skills'}
                        </Typography>
                        {activeTab === 'library' && selectedSkill && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Button size="small" onClick={openEdit} sx={{ color: '#00F3FF', fontSize: 12 }}>Edit</Button>
                                <Button size="small" onClick={remove} sx={{ color: '#ef4444', fontSize: 12 }}>Delete</Button>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '65vh', overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '8px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                        {activeTab === 'library' && skills.map((s) => (
                            <Box
                                key={s.id}
                                onClick={() => setSelectedId(String(s.id))}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    border: String(selectedId) === String(s.id) ? '1px solid rgba(0,243,255,0.7)' : '1px solid rgba(255,255,255,0.08)',
                                    bgcolor: String(selectedId) === String(s.id) ? 'rgba(0,243,255,0.06)' : 'rgba(0,0,0,0.25)',
                                }}
                            >
                                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{s.name}</Typography>
                                {s.description && (
                                    <Typography sx={{ color: '#A0A7B5', fontSize: 12, mt: 0.5, lineHeight: 1.4 }}>{s.description}</Typography>
                                )}
                            </Box>
                        ))}
                        {activeTab === 'installed' && installedSkills.map((s) => (
                            <Box
                                key={`installed-${s.id}`}
                                onClick={() => setSelectedId(`installed-${s.id}`)}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    cursor: 'pointer',
                                    border: selectedId === `installed-${s.id}` ? '1px solid rgba(0,243,255,0.7)' : '1px solid rgba(255,255,255,0.08)',
                                    bgcolor: selectedId === `installed-${s.id}` ? 'rgba(0,243,255,0.06)' : 'rgba(0,0,0,0.25)',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{s.name}</Typography>
                                            <Chip 
                                                label={s.category || 'general'} 
                                                size="small" 
                                                sx={{ 
                                                    height: 20, 
                                                    fontSize: 10, 
                                                    bgcolor: categoryColors[s.category || 'general'] || categoryColors.general,
                                                    color: '#fff'
                                                }} 
                                            />
                                            {s.enabled && <Chip label="Active" size="small" sx={{ height: 18, fontSize: 9, bgcolor: 'rgba(34, 197, 94, 0.3)', color: '#22C55E' }} />}
                                        </Box>
                                        {s.description && (
                                            <Typography sx={{ color: '#A0A7B5', fontSize: 12, lineHeight: 1.4 }}>{s.description}</Typography>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                        <Tooltip title={s.enabled ? 'Disable' : 'Enable'}>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => { e.stopPropagation(); handleToggleSkill(s.id, s.enabled); }}
                                                sx={{ color: s.enabled ? '#22C55E' : '#888' }}
                                            >
                                                {s.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Remove">
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveInstalledSkill(s.id); }}
                                                sx={{ color: '#ef4444' }}
                                            >
                                                <Trash2 size={16} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                        {activeTab === 'library' && !loading && skills.length === 0 && (
                            <Typography sx={{ color: '#888', fontSize: 13 }}>No skills yet. Create one.</Typography>
                        )}
                        {activeTab === 'installed' && !loading && installedSkills.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography sx={{ color: '#888', fontSize: 13, mb: 2 }}>No installed skills yet.</Typography>
                                <Button variant="contained" onClick={handleSync} startIcon={<RefreshCw size={16} />} sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}>
                                    Sync from File System
                                </Button>
                            </Box>
                        )}
                        {loading && (
                            <Typography sx={{ color: '#888', fontSize: 13 }}>Loading...</Typography>
                        )}
                    </Box>
                </Paper>

                <Paper sx={{ bgcolor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '16px', p: 2, maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>Details</Typography>
                    <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '8px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                    {activeTab === 'library' && !selectedSkill && (
                        <Typography sx={{ color: '#888', fontSize: 13 }}>Select a skill to view its details.</Typography>
                    )}
                    {activeTab === 'installed' && !selectedId?.startsWith('installed-') && (
                        <Typography sx={{ color: '#888', fontSize: 13 }}>Select an installed skill to view its details.</Typography>
                    )}
                    {activeTab === 'installed' && selectedId?.startsWith('installed-') && (() => {
                        const installedId = parseInt(selectedId.replace('installed-', ''));
                        const installedSkill = installedSkills.find(s => s.id === installedId);
                        if (!installedSkill) return <Typography sx={{ color: '#888', fontSize: 13 }}>Skill not found.</Typography>;
                        return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box>
                                    <Typography sx={{ color: '#888', fontSize: 12 }}>Name</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{installedSkill.name}</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#888', fontSize: 12 }}>Description</Typography>
                                    <Typography sx={{ color: '#fff', fontSize: 14 }}>{installedSkill.description || 'No description'}</Typography>
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#888', fontSize: 12 }}>Category</Typography>
                                    <Chip label={installedSkill.category || 'general'} size="small" sx={{ bgcolor: categoryColors[installedSkill.category || 'general'], color: '#fff' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ color: '#888', fontSize: 12 }}>Status</Typography>
                                    <Typography sx={{ color: installedSkill.enabled ? '#22C55E' : '#888', fontWeight: 600 }}>
                                        {installedSkill.enabled ? 'Enabled' : 'Disabled'}
                                    </Typography>
                                </Box>
                                {installedSkill.content && (
                                    <Box>
                                        <Typography sx={{ color: '#888', fontSize: 12, mb: 0.5 }}>Content</Typography>
                                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1.5, p: 1.5, maxHeight: 300, overflow: 'auto' }}>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 11, color: '#A0A7B5' }}>{installedSkill.content}</pre>
                                        </Box>
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button 
                                        variant="contained" 
                                        onClick={() => handleToggleSkill(installedSkill.id, installedSkill.enabled)}
                                        startIcon={installedSkill.enabled ? <PowerOff size={16} /> : <Power size={16} />}
                                        sx={{ bgcolor: installedSkill.enabled ? '#888' : '#22C55E', '&:hover': { bgcolor: installedSkill.enabled ? '#666' : '#16A34A' } }}
                                    >
                                        {installedSkill.enabled ? 'Disable' : 'Enable'}
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => handleRemoveInstalledSkill(installedSkill.id)}
                                        startIcon={<Trash2 size={16} />}
                                        sx={{ borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}
                                    >
                                        Remove
                                    </Button>
                                </Box>
                            </Box>
                        );
                    })()}
                    {activeTab === 'library' && selectedSkill && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <TextField
                                label="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '14px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                }}
                            />
                            <TextField
                                label="Description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '14px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                }}
                            />
                            <TextField
                                label="Tags (comma separated)"
                                value={tagsRaw}
                                onChange={(e) => setTagsRaw(e.target.value)}
                                fullWidth
                                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff', borderRadius: '14px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                }}
                            />
                            <FormControlLabel
                                control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} sx={{ color: '#00F3FF' }} />}
                                label={<Typography sx={{ color: '#A0A7B5' }}>Public</Typography>}
                            />
                            <TextField
                                label="Definition (JSON)"
                                value={definitionRaw}
                                onChange={(e) => setDefinitionRaw(e.target.value)}
                                fullWidth
                                multiline
                                minRows={14}
                                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { color: '#fff', fontFamily: 'monospace', fontSize: 12, borderRadius: '14px' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <Button variant="contained" onClick={() => { setMode('edit'); setDialogOpen(true); }} sx={{ bgcolor: '#00F3FF', color: '#000', '&:hover': { bgcolor: '#00D1DD' } }}>Edit</Button>
                                <Button variant="outlined" onClick={remove} sx={{ borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}>Delete</Button>
                            </Box>
                        </Box>
                    )}
                    </Box>
                </Paper>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiBackdrop-root': {
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.72)'
                    }
                }}
                PaperProps={{
                    sx: {
                        position: 'relative',
                        backgroundColor: 'rgba(17, 24, 39, 0.98)',
                        backdropFilter: 'blur(24px)',
                        color: '#FFFFFF',
                        borderRadius: '24px',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 243, 255, 0.15)',
                        border: '1px solid rgba(0, 243, 255, 0.2)',
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        color: '#FFFFFF',
                        fontWeight: 600,
                        borderBottom: '1px solid rgba(0, 243, 255, 0.15)',
                        background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)',
                        backdropFilter: 'blur(16px)',
                        borderRadius: '24px 24px 0 0',
                        py: 2.5
                    }}
                >
                    {mode === 'create' ? 'Create Skill' : 'Edit Skill'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3, pb: 2, maxHeight: '60vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '10px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#FFFFFF',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(26, 35, 50, 0.8)',
                                transition: 'all 0.3s ease',
                                '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' }
                            }
                        }}
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#FFFFFF',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(26, 35, 50, 0.8)',
                                transition: 'all 0.3s ease',
                                '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' }
                            }
                        }}
                    />
                    <TextField
                        label="Tags (comma separated)"
                        value={tagsRaw}
                        onChange={(e) => setTagsRaw(e.target.value)}
                        fullWidth
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#FFFFFF',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(26, 35, 50, 0.8)',
                                transition: 'all 0.3s ease',
                                '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' }
                            }
                        }}
                    />
                    <FormControlLabel
                        control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }} />}
                        label={<Typography sx={{ color: '#A0A7B5' }}>Public</Typography>}
                    />
                    <TextField
                        label="Definition (JSON)"
                        value={definitionRaw}
                        onChange={(e) => setDefinitionRaw(e.target.value)}
                        fullWidth
                        multiline
                        minRows={10}
                        maxRows={16}
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: '#FFFFFF',
                                fontFamily: 'monospace',
                                fontSize: 13,
                                lineHeight: 1.6,
                                borderRadius: '16px',
                                backgroundColor: 'rgba(26, 35, 50, 0.8)',
                                transition: 'all 0.3s ease',
                                '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' },
                                '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.5) 0%, rgba(10, 10, 10, 0.8) 100%)', backdropFilter: 'blur(16px)', gap: 1.5 }}>
                    <Button onClick={closeDialog} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', borderRadius: '14px', px: 3, py: 1, transition: 'all 0.3s ease', '&:hover': { borderColor: 'rgba(0, 243, 255, 0.5)', backgroundColor: 'rgba(0, 243, 255, 0.05)', transform: 'translateY(-2px)' } }}>Cancel</Button>
                    <Button onClick={save} variant="contained" sx={{ bgcolor: '#00F3FF', color: '#000', borderRadius: '14px', px: 3, py: 1, fontWeight: 600, boxShadow: '0 0 20px rgba(0, 243, 255, 0.4)', transition: 'all 0.3s ease', '&:hover': { bgcolor: '#00D1DD', boxShadow: '0 0 30px rgba(0, 243, 255, 0.6)', transform: 'translateY(-2px)' } }}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={installDialogOpen}
                onClose={() => setInstallDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        backgroundColor: 'rgba(17, 24, 39, 0.98)',
                        backdropFilter: 'blur(24px)',
                        color: '#FFFFFF',
                        borderRadius: '24px',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 243, 255, 0.15)',
                        border: '1px solid rgba(0, 243, 255, 0.2)',
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)', backdropFilter: 'blur(16px)', borderRadius: '24px 24px 0 0', py: 2.5 }}>
                    Install New Skill
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3, pb: 2, maxHeight: '60vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '10px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }}
                    />
                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }}
                    />
                    <TextField
                        label="Category"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        fullWidth
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }}
                    />
                    <TextField
                        label="Skill Content / Prompt"
                        value={contentInput}
                        onChange={(e) => setContentInput(e.target.value)}
                        fullWidth
                        multiline
                        minRows={8}
                        maxRows={12}
                        placeholder="Enter the skill prompt, policy, or tool configuration..."
                        InputLabelProps={{ sx: { color: '#A0A7B5' } }}
                        sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.5) 0%, rgba(10, 10, 10, 0.8) 100%)', backdropFilter: 'blur(16px)', gap: 1.5 }}>
                    <Button onClick={() => setInstallDialogOpen(false)} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', borderRadius: '14px', px: 3, py: 1, transition: 'all 0.3s ease', '&:hover': { borderColor: 'rgba(0, 243, 255, 0.5)', backgroundColor: 'rgba(0, 243, 255, 0.05)', transform: 'translateY(-2px)' } }}>Cancel</Button>
                    <Button 
                        onClick={() => {
                            if (!name.trim()) { toast.error('Name is required'); return; }
                            if (!contentInput.trim()) { toast.error('Content is required'); return; }
                            handleInstallSkill({
                                name: name.trim(),
                                description: description.trim(),
                                category: categoryInput.trim() || 'general',
                                content: contentInput.trim(),
                                metadata: {}
                            });
                            setName('');
                            setDescription('');
                            setCategoryInput('general');
                            setContentInput('');
                        }} 
                        variant="contained" 
                        sx={{ bgcolor: '#22C55E', color: '#000', borderRadius: '14px', px: 3, py: 1, fontWeight: 600, boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)', transition: 'all 0.3s ease', '&:hover': { bgcolor: '#16A34A', boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)', transform: 'translateY(-2px)' } }}
                    >
                        Install Skill
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
