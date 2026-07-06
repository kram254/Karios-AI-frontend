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

const PREINSTALLED_CATALOG = [
    { slug: 'pdf', name: 'PDF Toolkit', icon: '📕', category: 'Documents & Office', description: 'Read, extract text & tables, merge, split, rotate, watermark, fill forms, and OCR scanned PDFs.', defaultEnabled: true, needsCredentials: false },
    { slug: 'docx', name: 'Word Documents', icon: '📘', category: 'Documents & Office', description: 'Create and edit Word docs with formatting, tracked changes, and comments.', defaultEnabled: true, needsCredentials: false },
    { slug: 'xlsx', name: 'Spreadsheets', icon: '📊', category: 'Documents & Office', description: 'Build and edit Excel workbooks: formulas, pivot tables, charts, and data transforms.', defaultEnabled: true, needsCredentials: false },
    { slug: 'pptx', name: 'Presentations', icon: '📑', category: 'Documents & Office', description: 'Generate and edit slide decks, layouts, and templates from scratch.', defaultEnabled: true, needsCredentials: false },
    { slug: 'doc-converter', name: 'Document Converter', icon: '🔄', category: 'Documents & Office', description: 'Convert between Markdown, HTML, DOCX, PDF, and EPUB (Pandoc-based).', defaultEnabled: true, needsCredentials: false },
    { slug: 'data-cleaner', name: 'CSV / Data Cleaner', icon: '🧹', category: 'Data & Analysis', description: 'Clean, dedupe, normalize, type-infer, and reshape messy CSV / Excel data.', defaultEnabled: true, needsCredentials: false },
    { slug: 'data-viz', name: 'Chart & Data Visualizer', icon: '📈', category: 'Data & Analysis', description: 'Turn datasets into bar, line, pie, and heatmap charts as PNG/SVG.', defaultEnabled: true, needsCredentials: false },
    { slug: 'sql-assistant', name: 'SQL Assistant', icon: '🗄️', category: 'Data & Analysis', description: 'Write, explain, and optimize SQL queries; design and review schemas.', defaultEnabled: false, needsCredentials: false },
    { slug: 'doc-extractor', name: 'Document Data Extractor', icon: '🧾', category: 'Data & Analysis', description: 'Pull structured fields from invoices, receipts, forms, and statements into JSON.', defaultEnabled: false, needsCredentials: false },
    { slug: 'web-research', name: 'Deep Web Research', icon: '🔎', category: 'Research & Web', description: 'Multi-source research with synthesized, cited answers across the open web.', defaultEnabled: true, needsCredentials: true },
    { slug: 'web-scraper', name: 'Web Scraper', icon: '🕸️', category: 'Research & Web', description: 'Reliable scraping and clean content extraction from any URL.', defaultEnabled: false, needsCredentials: true },
    { slug: 'video-summarizer', name: 'Video / YouTube Summarizer', icon: '🎬', category: 'Research & Web', description: 'Fetch a transcript and produce a summary, chapters, and key takeaways.', defaultEnabled: true, needsCredentials: false },
    { slug: 'readability', name: 'Article to Clean Markdown', icon: '📰', category: 'Research & Web', description: 'Strip a web article down to clean, readable Markdown — no ads or nav.', defaultEnabled: true, needsCredentials: false },
    { slug: 'email-composer', name: 'Email Composer', icon: '✉️', category: 'Communication & Productivity', description: 'Draft professional emails with tone control, replies, and follow-ups.', defaultEnabled: true, needsCredentials: false },
    { slug: 'meeting-notes', name: 'Meeting Notes to Actions', icon: '📝', category: 'Communication & Productivity', description: 'Turn transcripts and notes into decisions, action items, and owners.', defaultEnabled: true, needsCredentials: false },
    { slug: 'summarizer', name: 'Smart Summarizer', icon: '🧠', category: 'Communication & Productivity', description: 'Condense long text, threads, or docs into a TL;DR, bullets, or a brief.', defaultEnabled: true, needsCredentials: false },
    { slug: 'scheduler', name: 'Calendar & Scheduling', icon: '📅', category: 'Communication & Productivity', description: 'Parse availability, propose meeting times, and draft calendar invites (ICS).', defaultEnabled: false, needsCredentials: false },
    { slug: 'internal-comms', name: 'Internal Comms', icon: '📣', category: 'Communication & Productivity', description: 'Status reports, newsletters, announcements, and FAQs in your house voice.', defaultEnabled: true, needsCredentials: false },
    { slug: 'proofreader', name: 'Proofreader & Style Editor', icon: '✅', category: 'Writing & Content', description: 'Grammar, spelling, clarity, and tone edits — with explanations.', defaultEnabled: true, needsCredentials: false },
    { slug: 'seo-optimizer', name: 'SEO Content Optimizer', icon: '🔍', category: 'Writing & Content', description: 'On-page SEO audit, keyword & meta suggestions, and content scoring.', defaultEnabled: false, needsCredentials: false },
    { slug: 'translator', name: 'Translator', icon: '🌐', category: 'Writing & Content', description: 'Translate across languages with tone and glossary control.', defaultEnabled: true, needsCredentials: false },
    { slug: 'resume-tailor', name: 'Resume & Cover Letter Tailor', icon: '📄', category: 'Writing & Content', description: 'Tailor a resume or cover letter to a specific job description.', defaultEnabled: true, needsCredentials: false },
    { slug: 'image-editor', name: 'Image Editor', icon: '🖼️', category: 'Design & Media', description: 'Background removal, resize, crop, format convert, watermark, and compress.', defaultEnabled: true, needsCredentials: false },
    { slug: 'canvas-design', name: 'Social Graphics / Canvas', icon: '🎨', category: 'Design & Media', description: 'Create social posts, posters, and visual assets as PNG / PDF.', defaultEnabled: false, needsCredentials: false },
    { slug: 'gif-creator', name: 'GIF Creator', icon: '🎞️', category: 'Design & Media', description: 'Build animated GIFs optimized for chat and social platforms.', defaultEnabled: false, needsCredentials: false },
    { slug: 'advanced-image-techniques', name: 'Advanced Image Techniques', icon: '🪄', category: 'Design & Media', description: 'Professional Gemini image patterns: style transfer, product placement, background replacement, batch variations.', defaultEnabled: true, needsCredentials: false },
    { slug: 'hyperframes', name: 'HyperFrames Video', icon: '🎞️', category: 'Motion & Video', description: 'Author HTML video compositions and render them to MP4 — summaries, social hooks, animated data viz, title cards.', defaultEnabled: true, needsCredentials: false },
    { slug: 'video-prompting', name: 'Cinematic Video Prompting', icon: '🎥', category: 'Motion & Video', description: 'Cinematic techniques and professional patterns for Veo 3.1 video generation — camera moves, composition, lighting.', defaultEnabled: true, needsCredentials: false },
    { slug: 'gsap', name: 'GSAP Animation', icon: '💫', category: 'Motion & Video', description: 'GSAP animation patterns for HyperFrames compositions: animated text, transitions, easing, and timeline-driven motion.', defaultEnabled: false, needsCredentials: false },
    { slug: 'website-to-hyperframes', name: 'Website to Video', icon: '🖥️', category: 'Motion & Video', description: 'Convert a webpage, blog post, or article into a HyperFrames video composition.', defaultEnabled: false, needsCredentials: false },
    { slug: 'remotion-to-hyperframes', name: 'Remotion to HyperFrames', icon: '⚛️', category: 'Motion & Video', description: 'Migrate a Remotion composition (React) to HyperFrames (HTML).', defaultEnabled: false, needsCredentials: false },
    { slug: 'video-continuation-patterns', name: 'Video Continuation', icon: '⏭️', category: 'Motion & Video', description: 'Extend and continue AI-generated videos via native extension or frame extraction; chain clips into sequences.', defaultEnabled: false, needsCredentials: false },
    { slug: 'hyperframes-registry', name: 'HyperFrames Registry', icon: '🗃️', category: 'Motion & Video', description: 'Browse the HyperFrames composition registry for reusable templates: intros, lower-thirds, end cards, social hooks.', defaultEnabled: false, needsCredentials: false },
    { slug: 'hyperframes-cli', name: 'HyperFrames CLI', icon: '⌨️', category: 'Motion & Video', description: 'Reference for the HyperFrames CLI (init, preview, render) and its flags — output format, fps, duration, headless.', defaultEnabled: false, needsCredentials: false },
    { slug: 'code-reviewer', name: 'Code Reviewer & Simplifier', icon: '🧑‍💻', category: 'Developer & Automation', description: 'Review, refactor, and simplify code without changing behavior.', defaultEnabled: false, needsCredentials: false },
    { slug: 'git-helper', name: 'Git & PR Helper', icon: '🌿', category: 'Developer & Automation', description: 'Branching, commits, worktrees, and clean PR descriptions & workflows.', defaultEnabled: false, needsCredentials: false },
    { slug: 'webapp-testing', name: 'Web App Tester', icon: '🧪', category: 'Developer & Automation', description: 'Automated browser tests of a local or remote app via Playwright.', defaultEnabled: false, needsCredentials: false },
    { slug: 'github-push', name: 'GitHub Push', icon: '⬆️', category: 'Developer & Automation', description: 'Clone private repos and push commits directly over authenticated HTTPS using a stored PAT.', defaultEnabled: false, needsCredentials: true },
    { slug: 'planner', name: 'Task & Project Planner', icon: '🗂️', category: 'Meta & Personal', description: 'Persistent multi-step planning with files that survive context resets.', defaultEnabled: true, needsCredentials: false },
    { slug: 'skill-creator', name: 'Skill Creator', icon: '✨', category: 'Meta & Personal', description: 'Interactively scaffolds a new, valid SKILL.md skill from a description or docs URL.', defaultEnabled: true, needsCredentials: false },
    { slug: 'context-builder', name: 'Context Builder', icon: '🧩', category: 'Meta & Personal', description: 'Reads connected integrations (Slack, Notion, Linear, Calendar, GitHub) and builds structured memories about your projects, teammates, and org.', defaultEnabled: true, needsCredentials: false },
    { slug: 'connection-setup-wizard', name: 'Connection Setup Wizard', icon: '🔌', category: 'Meta & Personal', description: 'Interactive wizard to configure data-warehouse & integration connections (Databricks, Snowflake, BigQuery, Postgres) with test & save.', defaultEnabled: true, needsCredentials: false },
];

const PREINSTALLED_CATEGORIES = [
    'Documents & Office',
    'Data & Analysis',
    'Research & Web',
    'Communication & Productivity',
    'Writing & Content',
    'Design & Media',
    'Motion & Video',
    'Developer & Automation',
    'Meta & Personal',
];

const SKILL_CATS: Record<string, { ic: string; color: string; tint: string }> = {
    'Documents & Office':           { ic: '📄', color: '#00F3FF', tint: 'rgba(0,243,255,0.12)' },
    'Data & Analysis':              { ic: '📊', color: '#8B5CF6', tint: 'rgba(139,92,246,0.14)' },
    'Research & Web':               { ic: '🔎', color: '#FF00B8', tint: 'rgba(255,0,184,0.12)' },
    'Communication & Productivity': { ic: '✉️', color: '#10B981', tint: 'rgba(16,185,129,0.13)' },
    'Writing & Content':            { ic: '✍️', color: '#F59E0B', tint: 'rgba(245,158,11,0.13)' },
    'Design & Media':               { ic: '🎨', color: '#EC4899', tint: 'rgba(236,72,153,0.13)' },
    'Motion & Video':               { ic: '🎬', color: '#F97316', tint: 'rgba(249,115,22,0.13)' },
    'Developer & Automation':       { ic: '⚙️', color: '#3B82F6', tint: 'rgba(59,130,246,0.13)' },
    'Meta & Personal':              { ic: '✨', color: '#14B8A6', tint: 'rgba(20,184,166,0.13)' },
};

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
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [enabledOnly, setEnabledOnly] = useState(false);
    const [sheetSkill, setSheetSkill] = useState<typeof PREINSTALLED_CATALOG[0] | null>(null);

    const selectedSkill = useMemo(() => {
        if (!selectedId) return null;
        return skills.find(s => String(s.id) === String(selectedId)) || null;
    }, [skills, selectedId]);

    const filteredPreinstalled = useMemo(() => {
        if (!activeCategoryFilter) return PREINSTALLED_CATALOG;
        return PREINSTALLED_CATALOG.filter(s => s.category === activeCategoryFilter);
    }, [activeCategoryFilter]);

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

    const handlePreinstalledToggle = async (slug: string, displayName: string, description: string, category: string) => {
        const existing = installedSkills.find(s => s.name === slug);
        try {
            if (existing) {
                await agentSkillsService.toggleSkill(existing.id, !existing.enabled);
                toast.success(`${displayName} ${!existing.enabled ? 'enabled' : 'disabled'}`);
            } else {
                await agentSkillsService.installSkill({
                    name: slug,
                    description,
                    category: category.split(' & ')[0].toLowerCase().replace(/\s/g, '-'),
                    content: description,
                    metadata: { preinstalled: true, displayName, displayCategory: category },
                });
                toast.success(`${displayName} installed`);
            }
            await reloadInstalledSkills();
        } catch {
            toast.error('Failed to update skill');
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
        'Documents & Office': 'rgba(0, 243, 255, 0.3)',
        'Data & Analysis': 'rgba(139, 92, 246, 0.3)',
        'Research & Web': 'rgba(255, 0, 184, 0.3)',
        'Communication & Productivity': 'rgba(16, 185, 129, 0.3)',
        'Writing & Content': 'rgba(245, 158, 11, 0.3)',
        'Design & Media': 'rgba(236, 72, 153, 0.3)',
        'Motion & Video': 'rgba(249, 115, 22, 0.3)',
        'Developer & Automation': 'rgba(59, 130, 246, 0.3)',
        'Meta & Personal': 'rgba(20, 184, 166, 0.3)',
    };

    const enabledCount = installedSkills.filter(s => s.enabled).length;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', maxWidth: '1400px', mx: 'auto', overflowY: 'auto', height: '100%' }}>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
                <Box>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Skills</Typography>
                    <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', mt: 0.75, maxWidth: 560, lineHeight: 1.5 }}>
                        {PREINSTALLED_CATALOG.length} pre-installed skills give your agents real capabilities. Flip a switch to enable one — or import your own.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={handleSync}
                        disabled={syncing}
                        startIcon={syncing ? <CircularProgress size={14} /> : <RefreshCw size={15} />}
                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', '&:hover': { borderColor: 'rgba(0,243,255,0.3)', color: '#fff' } }}
                    >
                        Sync
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={openCreate}
                        startIcon={<Plus size={15} />}
                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', '&:hover': { borderColor: 'rgba(0,243,255,0.3)', color: '#fff' } }}
                    >
                        New Skill
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setInstallDialogOpen(true)}
                        startIcon={<Plus size={16} />}
                        sx={{ bgcolor: '#00F3FF', color: '#000', fontWeight: 600, boxShadow: '0 0 16px rgba(0,243,255,0.35)', '&:hover': { bgcolor: '#00D1DD', boxShadow: '0 0 28px rgba(0,243,255,0.45)' } }}
                    >
                        Import Skill
                    </Button>
                </Box>
            </Box>

            <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.06)', mb: 2.5 }} />

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                {[
                    { n: PREINSTALLED_CATALOG.length, l: 'Skills' },
                    { n: enabledCount, l: 'Enabled', accent: true },
                    { n: PREINSTALLED_CATEGORIES.length, l: 'Categories' },
                    { n: skills.length, l: 'Library' },
                ].map(stat => (
                    <Box key={stat.l} sx={{ bgcolor: '#0F1012', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', p: '12px 16px', minWidth: 110 }}>
                        <Typography sx={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: stat.accent ? '#00F3FF' : '#fff' }}>{stat.n}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.07em', mt: 0.25 }}>{stat.l}</Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
                <Box sx={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.38)', pointerEvents: 'none', display: 'flex', zIndex: 1 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    </Box>
                    <Box
                        component="input"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        placeholder="Search skills — try 'pdf', 'email', 'translate'…"
                        sx={{
                            width: '100%', bgcolor: '#0F1012', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px', color: '#fff', fontSize: 13.5, pl: '38px', pr: 1.75, py: 1.25,
                            outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s',
                            '&::placeholder': { color: 'rgba(255,255,255,0.38)' },
                            '&:focus': { borderColor: 'rgba(0,243,255,0.5)', boxShadow: 'inset 0 0 0 1px rgba(0,243,255,0.3)' },
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                    <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>Enabled only</Typography>
                    <Box
                        component="button"
                        onClick={() => setEnabledOnly(!enabledOnly)}
                        sx={{
                            width: 40, height: 22, borderRadius: 999, border: 'none', flexShrink: 0, cursor: 'pointer',
                            bgcolor: enabledOnly ? '#00F3FF' : 'rgba(255,255,255,0.12)',
                            boxShadow: enabledOnly ? '0 0 16px rgba(0,243,255,0.35)' : 'none',
                            position: 'relative', transition: 'all 0.2s', p: 0,
                        }}
                    >
                        <Box sx={{
                            position: 'absolute', top: 3, left: enabledOnly ? 21 : 3,
                            width: 16, height: 16, borderRadius: '50%',
                            bgcolor: enabledOnly ? '#001317' : '#fff',
                            transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }} />
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.875, flexWrap: 'wrap', mb: 3.25 }}>
                <Box
                    component="button"
                    onClick={() => setActiveCategoryFilter(null)}
                    sx={{
                        fontSize: 12, px: 1.625, py: 0.875, borderRadius: 999, border: '1px solid',
                        borderColor: !activeCategoryFilter ? 'rgba(0,243,255,0.45)' : 'rgba(255,255,255,0.08)',
                        color: !activeCategoryFilter ? '#00F3FF' : 'rgba(255,255,255,0.65)',
                        bgcolor: !activeCategoryFilter ? 'rgba(0,243,255,0.1)' : '#0F1012',
                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: 'inherit',
                        '&:hover': { borderColor: 'rgba(0,243,255,0.25)', color: '#fff' },
                    }}
                >
                    All
                </Box>
                {PREINSTALLED_CATEGORIES.map(cat => {
                    const meta = SKILL_CATS[cat];
                    const count = PREINSTALLED_CATALOG.filter(s => s.category === cat).length;
                    const isActive = activeCategoryFilter === cat;
                    return (
                        <Box
                            key={cat}
                            component="button"
                            onClick={() => setActiveCategoryFilter(isActive ? null : cat)}
                            sx={{
                                fontSize: 12, px: 1.625, py: 0.875, borderRadius: 999, border: '1px solid',
                                borderColor: isActive ? 'rgba(0,243,255,0.45)' : 'rgba(255,255,255,0.08)',
                                color: isActive ? '#00F3FF' : 'rgba(255,255,255,0.65)',
                                bgcolor: isActive ? 'rgba(0,243,255,0.1)' : '#0F1012',
                                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s', fontFamily: 'inherit',
                                '&:hover': { borderColor: 'rgba(0,243,255,0.25)', color: '#fff' },
                            }}
                        >
                            {meta?.ic} {cat} <Box component="span" sx={{ opacity: 0.6 }}>{count}</Box>
                        </Box>
                    );
                })}
            </Box>

            {PREINSTALLED_CATEGORIES
                .filter(cat => !activeCategoryFilter || cat === activeCategoryFilter)
                .map(cat => {
                    const meta = SKILL_CATS[cat];
                    const catSkills = PREINSTALLED_CATALOG.filter(s => s.category === cat).filter(s => {
                        if (enabledOnly) {
                            const inst = installedSkills.find(i => i.name === s.slug);
                            if (!inst?.enabled) return false;
                        }
                        if (searchQuery) {
                            const q = searchQuery.toLowerCase();
                            return (s.name + s.slug + s.description + s.category).toLowerCase().includes(q);
                        }
                        return true;
                    });
                    if (catSkills.length === 0) return null;
                    const activeCount = catSkills.filter(s => installedSkills.find(i => i.name === s.slug)?.enabled).length;
                    return (
                        <Box key={cat} sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.375, mb: 1.75 }}>
                                <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, bgcolor: meta?.tint }}>
                                    {meta?.ic}
                                </Box>
                                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>{cat}</Typography>
                                <Box sx={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', bgcolor: 'rgba(255,255,255,0.06)', px: 1, py: 0.25, borderRadius: 999, fontVariantNumeric: 'tabular-nums' }}>
                                    {activeCount}/{catSkills.length} on
                                </Box>
                                <Box sx={{ flex: 1, height: 1, bgcolor: 'rgba(255,255,255,0.06)' }} />
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 1.75 }}>
                                {catSkills.map(skill => {
                                    const installed = installedSkills.find(i => i.name === skill.slug);
                                    const isOn = installed?.enabled ?? false;
                                    const srcStyle = skill.source === 'official'
                                        ? { bg: 'rgba(0,243,255,0.1)', color: '#00F3FF', border: 'rgba(0,243,255,0.22)' }
                                        : skill.source === 'community'
                                            ? { bg: 'rgba(139,92,246,0.12)', color: '#b79bff', border: 'rgba(139,92,246,0.25)' }
                                            : { bg: 'rgba(255,0,184,0.1)', color: '#ff7ad6', border: 'rgba(255,0,184,0.25)' };
                                    const srcLabel = skill.source === 'official' ? 'Official' : skill.source === 'community' ? 'Community' : 'Karios';
                                    return (
                                        <Box
                                            key={skill.slug}
                                            sx={{
                                                bgcolor: '#0F1012',
                                                border: '1px solid',
                                                borderColor: isOn ? 'rgba(0,243,255,0.35)' : 'rgba(255,255,255,0.07)',
                                                borderRadius: '16px',
                                                p: 2,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 1.5,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.2s',
                                                '&:hover': { borderColor: 'rgba(0,243,255,0.25)', transform: 'translateY(-2px)', boxShadow: '0 0 28px rgba(0,243,255,0.1)' },
                                                ...(isOn && { boxShadow: 'inset 0 0 0 1px rgba(0,243,255,0.16)' }),
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                                <Box sx={{
                                                    width: 40, height: 40, borderRadius: '11px', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: 19,
                                                    flexShrink: 0, bgcolor: meta?.tint,
                                                    border: '1px solid', borderColor: (meta?.color || '#fff') + '33',
                                                }}>
                                                    {skill.icon}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography
                                                        onClick={() => setSheetSkill(skill)}
                                                        sx={{ fontSize: 14.5, fontWeight: 600, color: '#fff', lineHeight: 1.2, cursor: 'pointer', '&:hover': { color: '#00F3FF' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    >
                                                        {skill.name}
                                                    </Typography>
                                                    <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.38)', mt: 0.375 }}>{skill.slug}</Typography>
                                                </Box>
                                                <Box
                                                    component="button"
                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); handlePreinstalledToggle(skill.slug, skill.name, skill.description, skill.category); }}
                                                    sx={{
                                                        width: 40, height: 22, borderRadius: 999, border: 'none', flexShrink: 0, cursor: 'pointer',
                                                        bgcolor: isOn ? '#00F3FF' : 'rgba(255,255,255,0.12)',
                                                        boxShadow: isOn ? '0 0 16px rgba(0,243,255,0.35)' : 'none',
                                                        position: 'relative', transition: 'all 0.2s', p: 0,
                                                    }}
                                                >
                                                    <Box sx={{
                                                        position: 'absolute', top: 3, left: isOn ? 21 : 3,
                                                        width: 16, height: 16, borderRadius: '50%',
                                                        bgcolor: isOn ? '#001317' : '#fff',
                                                        transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                    }} />
                                                </Box>
                                            </Box>
                                            <Typography sx={{ fontSize: 12.7, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
                                                {skill.description}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
                                                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid', borderColor: (meta?.color || '#fff') + '40', color: meta?.color, bgcolor: meta?.tint, lineHeight: 1.3 }}>
                                                    {meta?.ic} {cat.split(' ')[0]}
                                                </Box>
                                                <Box component="span" sx={{ display: 'inline-flex', fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid', borderColor: srcStyle.border, color: srcStyle.color, bgcolor: srcStyle.bg, lineHeight: 1.3 }}>
                                                    {srcLabel}
                                                </Box>
                                                {isOn && (
                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)', color: '#10B981', bgcolor: 'rgba(16,185,129,0.1)', lineHeight: 1.3 }}>
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> Active
                                                    </Box>
                                                )}
                                                {skill.needsCredentials && (
                                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)', lineHeight: 1.3, ml: 'auto' }}>
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/></svg> Needs key
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    );
                })}

            {PREINSTALLED_CATEGORIES
                .filter(cat => !activeCategoryFilter || cat === activeCategoryFilter)
                .every(cat => {
                    return PREINSTALLED_CATALOG.filter(s => s.category === cat).filter(s => {
                        if (enabledOnly) { const inst = installedSkills.find(i => i.name === s.slug); return !!(inst?.enabled); }
                        if (searchQuery) { const q = searchQuery.toLowerCase(); return (s.name + s.slug + s.description + s.category).toLowerCase().includes(q); }
                        return true;
                    }).length === 0;
                }) && (
                    <Box sx={{ textAlign: 'center', py: 7.5, color: 'rgba(255,255,255,0.38)' }}>
                        <Typography sx={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', mb: 0.75 }}>No skills match your filters</Typography>
                        <Typography sx={{ fontSize: 13 }}>Try clearing search or switching category.</Typography>
                    </Box>
                )}

            {sheetSkill && (() => {
                const s = sheetSkill;
                const meta = SKILL_CATS[s.category];
                const installed = installedSkills.find(i => i.name === s.slug);
                const isOn = installed?.enabled ?? false;
                const srcLabel = s.source === 'official' ? 'Official' : s.source === 'community' ? 'Community' : 'Karios';
                return (
                    <>
                        <Box onClick={() => setSheetSkill(null)} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 400 }} />
                        <Box sx={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 480, maxWidth: '92vw', bgcolor: '#0d1015', borderLeft: '1px solid rgba(0,243,255,0.18)', boxShadow: '-8px 0 48px rgba(0,0,0,0.7)', zIndex: 410, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 1.625 }}>
                                <Box sx={{ width: 46, height: 46, borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, bgcolor: meta?.tint, border: '1px solid', borderColor: (meta?.color || '#fff') + '33' }}>
                                    {s.icon}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{s.name}</Typography>
                                    <Typography sx={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.38)', mt: 0.375 }}>{s.slug} · v1.0</Typography>
                                </Box>
                                <IconButton onClick={() => setSheetSkill(null)} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff' } }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </IconButton>
                            </Box>
                            <Box sx={{ p: '20px 22px', overflowY: 'auto', flex: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0,243,255,0.3)', borderRadius: '8px' } }}>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid', borderColor: (meta?.color || '#fff') + '40', color: meta?.color, bgcolor: meta?.tint }}>
                                        {meta?.ic} {s.category}
                                    </Box>
                                    <Box component="span" sx={{ display: 'inline-flex', fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid rgba(0,243,255,0.22)', color: '#00F3FF', bgcolor: 'rgba(0,243,255,0.1)' }}>
                                        {srcLabel}
                                    </Box>
                                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid rgba(16,185,129,0.22)', color: '#10B981', bgcolor: 'rgba(16,185,129,0.1)' }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> Validated
                                    </Box>
                                    {s.needsCredentials && (
                                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 10.5, fontWeight: 500, px: 1.125, py: 0.375, borderRadius: 999, border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"/></svg> Needs key
                                        </Box>
                                    )}
                                </Box>
                                <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', mb: 1 }}>What it does</Typography>
                                <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, mb: 2.5 }}>{s.description}</Typography>
                                <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', mb: 1 }}>SKILL.md</Typography>
                                <Box sx={{ bgcolor: '#08090c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', p: 1.75, fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', whiteSpace: 'pre-wrap', overflowX: 'auto', mb: 2.5 }}>
                                    <Box component="span" sx={{ color: '#00F3FF' }}>---{'\n'}name: </Box>
                                    <Box component="span" sx={{ color: '#ff7ad6' }}>{s.slug}</Box>
                                    {'\n'}
                                    <Box component="span" sx={{ color: '#00F3FF' }}>description:</Box>{' '}{s.description}{'\n'}
                                    <Box component="span" sx={{ color: '#00F3FF' }}>license:</Box>{' '}<Box component="span" sx={{ color: '#ff7ad6' }}>{s.source === 'official' ? 'Proprietary' : 'Apache-2.0'}</Box>{'\n'}
                                    <Box component="span" sx={{ color: '#00F3FF' }}>metadata:{'\n'}  author:</Box>{' '}<Box component="span" sx={{ color: '#ff7ad6' }}>{s.source === 'karios' ? 'karios-ai' : s.source}</Box>{'\n'}
                                    <Box component="span" sx={{ color: '#00F3FF' }}>  version:</Box>{' '}<Box component="span" sx={{ color: '#ff7ad6' }}>"1.0"</Box>{'\n'}
                                    <Box component="span" sx={{ color: '#00F3FF' }}>---</Box>
                                </Box>
                                <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.38)', mb: 1 }}>Progressive disclosure</Typography>
                                <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
                                    Only the <Box component="span" sx={{ color: 'rgba(255,255,255,0.65)' }}>name + description</Box> (~100 tokens) stay in context. The full body loads when a task matches; bundled scripts load on demand.
                                </Typography>
                            </Box>
                            <Box sx={{ p: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 1.25, alignItems: 'center' }}>
                                <Box
                                    component="button"
                                    onClick={() => handlePreinstalledToggle(s.slug, s.name, s.description, s.category)}
                                    sx={{
                                        width: 40, height: 22, borderRadius: 999, border: 'none', flexShrink: 0, cursor: 'pointer',
                                        bgcolor: isOn ? '#00F3FF' : 'rgba(255,255,255,0.12)',
                                        boxShadow: isOn ? '0 0 16px rgba(0,243,255,0.35)' : 'none',
                                        position: 'relative', transition: 'all 0.2s', p: 0,
                                    }}
                                >
                                    <Box sx={{ position: 'absolute', top: 3, left: isOn ? 21 : 3, width: 16, height: 16, borderRadius: '50%', bgcolor: isOn ? '#001317' : '#fff', transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                                </Box>
                                <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{isOn ? 'Enabled' : 'Disabled'}</Typography>
                                <Box sx={{ flex: 1 }} />
                                {installed && (
                                    <Button
                                        size="small"
                                        onClick={() => { handleRemoveInstalledSkill(installed.id); setSheetSkill(null); }}
                                        startIcon={<Trash2 size={14} />}
                                        sx={{ bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </>
                );
            })()}

            <Dialog
                open={dialogOpen}
                onClose={closeDialog}
                maxWidth="md"
                fullWidth
                sx={{ '& .MuiBackdrop-root': { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 0, 0, 0.72)' } }}
                PaperProps={{ sx: { position: 'relative', backgroundColor: 'rgba(17, 24, 39, 0.98)', backdropFilter: 'blur(24px)', color: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 243, 255, 0.15)', border: '1px solid rgba(0, 243, 255, 0.2)', maxHeight: '90vh', overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)', backdropFilter: 'blur(16px)', borderRadius: '24px 24px 0 0', py: 2.5 }}>
                    {mode === 'create' ? 'Create Skill' : 'Edit Skill'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3, pb: 2, maxHeight: '60vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '10px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                    <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} maxRows={4} InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <TextField label="Tags (comma separated)" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} fullWidth InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <FormControlLabel control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} sx={{ color: '#AAAAAA', '&.Mui-checked': { color: '#00F3FF' } }} />} label={<Typography sx={{ color: '#A0A7B5' }}>Public</Typography>} />
                    <TextField label="Definition (JSON)" value={definitionRaw} onChange={(e) => setDefinitionRaw(e.target.value)} fullWidth multiline minRows={10} maxRows={16} InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
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
                PaperProps={{ sx: { backgroundColor: 'rgba(17, 24, 39, 0.98)', backdropFilter: 'blur(24px)', color: '#FFFFFF', borderRadius: '24px', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(0, 243, 255, 0.15)', border: '1px solid rgba(0, 243, 255, 0.2)', maxHeight: '90vh', overflow: 'hidden' } }}
            >
                <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)', backdropFilter: 'blur(16px)', borderRadius: '24px 24px 0 0', py: 2.5 }}>
                    Install New Skill
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3, pb: 2, maxHeight: '60vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 243, 255, 0.3)', borderRadius: '10px', '&:hover': { background: 'rgba(0, 243, 255, 0.5)' } } }}>
                    <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} maxRows={4} InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <TextField label="Category" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} fullWidth InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                    <TextField label="Skill Content / Prompt" value={contentInput} onChange={(e) => setContentInput(e.target.value)} fullWidth multiline minRows={8} maxRows={12} placeholder="Enter the skill prompt, policy, or tool configuration..." InputLabelProps={{ sx: { color: '#A0A7B5' } }} sx={{ '& .MuiOutlinedInput-root': { color: '#FFFFFF', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, borderRadius: '16px', backgroundColor: 'rgba(26, 35, 50, 0.8)', transition: 'all 0.3s ease', '& fieldset': { borderColor: 'rgba(0, 243, 255, 0.2)' }, '&:hover fieldset': { borderColor: 'rgba(0, 243, 255, 0.4)' }, '&.Mui-focused fieldset': { borderColor: '#00F3FF', boxShadow: '0 0 10px rgba(0, 243, 255, 0.3)' } } }} />
                </DialogContent>
                <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 243, 255, 0.15)', background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.5) 0%, rgba(10, 10, 10, 0.8) 100%)', backdropFilter: 'blur(16px)', gap: 1.5 }}>
                    <Button onClick={() => setInstallDialogOpen(false)} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF', borderRadius: '14px', px: 3, py: 1, transition: 'all 0.3s ease', '&:hover': { borderColor: 'rgba(0, 243, 255, 0.5)', backgroundColor: 'rgba(0, 243, 255, 0.05)', transform: 'translateY(-2px)' } }}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (!name.trim()) { toast.error('Name is required'); return; }
                            if (!contentInput.trim()) { toast.error('Content is required'); return; }
                            handleInstallSkill({ name: name.trim(), description: description.trim(), category: categoryInput.trim() || 'general', content: contentInput.trim(), metadata: {} });
                            setName(''); setDescription(''); setCategoryInput('general'); setContentInput('');
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
