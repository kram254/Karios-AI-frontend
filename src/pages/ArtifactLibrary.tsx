import React, { useState, useEffect, useCallback } from 'react';
import { Image, FileText, BarChart2, Table2, Layout, Film, Music, Map, AppWindow, Search, RefreshCw, ExternalLink, Filter } from 'lucide-react';

interface ArtifactItem {
  id: number;
  uuid: string;
  shortId: string;
  chatId: string | null;
  artifactType: string;
  title: string | null;
  mimeType: string;
  hasContent: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  webpage: <Layout className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
  table: <Table2 className="w-5 h-5" />,
  chart: <BarChart2 className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  video: <Film className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  slides: <Layout className="w-5 h-5" />,
  map: <Map className="w-5 h-5" />,
  app: <AppWindow className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  webpage: '#6366f1',
  document: '#10b981',
  table: '#f59e0b',
  chart: '#3b82f6',
  image: '#ec4899',
  video: '#8b5cf6',
  audio: '#14b8a6',
  slides: '#f97316',
  map: '#06b6d4',
  app: '#ef4444',
};

const ALL_TYPES = ['webpage', 'document', 'table', 'chart', 'image', 'video', 'audio', 'slides', 'map', 'app'];

const ArtifactLibrary: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/artifacts?limit=200');
      if (res.ok) {
        const data = await res.json();
        setArtifacts(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load artifacts:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadArtifacts(); }, [loadArtifacts]);

  const filtered = artifacts.filter((a) => {
    if (selectedType && a.artifactType !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (a.title || '').toLowerCase().includes(q) || a.artifactType.includes(q) || a.shortId.includes(q);
    }
    return true;
  });

  const typeCounts = artifacts.reduce<Record<string, number>>((acc, a) => {
    acc[a.artifactType] = (acc[a.artifactType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: '#080810', color: '#e0e0e0', padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Artifact Library</h1>
            <p style={{ fontSize: '14px', color: '#888', margin: '4px 0 0' }}>{artifacts.length} artifacts across all threads</p>
          </div>
          <button onClick={loadArtifacts} style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '8px 16px', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: '#12121f', border: '1px solid #2a2a3e', borderRadius: '8px', padding: '10px 12px 10px 36px', color: '#e0e0e0', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedType(null)}
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: !selectedType ? '#6366f1' : '#333', background: !selectedType ? 'rgba(99,102,241,0.15)' : '#12121f', color: !selectedType ? '#a5b4fc' : '#888' }}
            >All</button>
            {ALL_TYPES.filter(t => typeCounts[t]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(selectedType === t ? null : t)}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid', borderColor: selectedType === t ? TYPE_COLORS[t] : '#333', background: selectedType === t ? `${TYPE_COLORS[t]}22` : '#12121f', color: selectedType === t ? TYPE_COLORS[t] : '#888', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {t} <span style={{ opacity: 0.6 }}>({typeCounts[t]})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Loading artifacts...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            {artifacts.length === 0 ? 'No artifacts generated yet. Ask Karios to create a webpage, chart, or table.' : 'No artifacts match your filter.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((a) => (
              <div
                key={a.uuid}
                onClick={() => setPreviewId(previewId === a.shortId ? null : a.shortId)}
                style={{ background: '#12121f', border: `1px solid ${previewId === a.shortId ? TYPE_COLORS[a.artifactType] || '#6366f1' : '#222'}`, borderRadius: '12px', padding: '18px', cursor: 'pointer', transition: 'border-color 0.2s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ color: TYPE_COLORS[a.artifactType] || '#6366f1' }}>{TYPE_ICONS[a.artifactType] || <FileText className="w-5 h-5" />}</div>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: TYPE_COLORS[a.artifactType] || '#6366f1' }}>{a.artifactType}</span>
                  </div>
                  <a href={`/api/v1/artifacts/${a.shortId}/content`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: '#666' }}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e0e0e0', margin: '0 0 6px', lineHeight: 1.3 }}>{a.title || 'Untitled'}</h3>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(a.createdAt).toLocaleDateString()} · {a.shortId}
                </div>
              </div>
            ))}
          </div>
        )}

        {previewId && (
          <div style={{ position: 'fixed', top: 0, right: 0, width: 'min(55%, 100vw)', maxWidth: '100vw', height: '100vh', background: '#0d0d1a', borderLeft: '1px solid #333', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#e0e0e0' }}>{artifacts.find(a => a.shortId === previewId)?.title || 'Preview'}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href={`/api/v1/artifacts/${previewId}/content`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#6366f1' }}>Open in new tab</a>
                <button onClick={() => setPreviewId(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            </div>
            <iframe
              src={`/api/v1/artifacts/${previewId}/content`}
              sandbox="allow-scripts allow-same-origin"
              style={{ flex: 1, border: 'none', background: '#fff' }}
              title="Artifact Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtifactLibrary;
