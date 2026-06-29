import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, RotateCcw, Loader2, AlertTriangle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#8b5cf6',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#6d28d9',
    lineColor: '#94a3b8',
    secondaryColor: '#1e1b4b',
    tertiaryColor: '#0f172a',
    background: '#0f0f1e',
    mainBkg: '#1e1b4b',
    nodeBorder: '#6d28d9',
    clusterBkg: '#1e1b4b',
    titleColor: '#e2e8f0',
    edgeLabelBackground: '#1e1b4b',
  },
  flowchart: { curve: 'basis', padding: 15 },
  sequence: { actorMargin: 50 },
});

interface GraphicData {
  type: 'chart' | 'diagram' | 'ai_image' | 'image';
  engine?: string;
  chart_type?: string;
  diagram_type?: string;
  config?: any;
  code?: string;
  url?: string;
  base64?: string;
  quickchart_url?: string;
  caption?: string;
  metadata?: {
    engine?: string;
    generation_time?: number;
    prompt_used?: string;
  };
}

interface GraphicsRendererProps {
  graphic: GraphicData;
  onRegenerate?: () => void;
}

let mermaidIdCounter = 0;

export function GraphicsRenderer({ graphic, onRegenerate }: GraphicsRendererProps) {
  if (graphic.type === 'chart') {
    return <ChartRenderer graphic={graphic} onRegenerate={onRegenerate} />;
  }
  if (graphic.type === 'diagram') {
    return <DiagramRenderer graphic={graphic} onRegenerate={onRegenerate} />;
  }
  if (graphic.type === 'ai_image' || graphic.type === 'image') {
    return <ImageRenderer graphic={graphic} onRegenerate={onRegenerate} />;
  }
  return null;
}

function ChartRenderer({ graphic, onRegenerate }: GraphicsRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [quickchartFallbackFailed, setQuickchartFallbackFailed] = useState(false);

  const normalizedChartConfig = React.useMemo(() => {
    const rawConfig = graphic.config;
    if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
      return null;
    }

    const rawData = (rawConfig as any).data;
    if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
      return null;
    }

    const labels = Array.isArray((rawData as any).labels) ? (rawData as any).labels : [];
    const datasets = Array.isArray((rawData as any).datasets) ? (rawData as any).datasets : [];
    if (!labels.length || !datasets.length) {
      return null;
    }

    const normalizedLabels = labels
      .map((label: any) => String(label ?? '').trim())
      .filter((label: string) => label.length > 0);
    if (!normalizedLabels.length) {
      return null;
    }

    const normalizeValue = (value: any) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const match = value.match(/-?\d[\d,]*\.?\d*/);
        if (!match) return null;
        const parsed = Number(match[0].replace(/,/g, ''));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    let hasAnyNumeric = false;

    const normalizedDatasets = datasets
      .filter((dataset: any) => dataset && typeof dataset === 'object' && !Array.isArray(dataset))
      .map((dataset: any) => {
        const rawValues = Array.isArray(dataset.data) ? dataset.data : [];
        const values = normalizedLabels.map((_: string, index: number) => {
          const value = normalizeValue(rawValues[index]);
          if (value !== null) {
            hasAnyNumeric = true;
          }
          return value ?? 0;
        });
        return {
          ...dataset,
          data: values,
        };
      })
      .filter((dataset: any) => Array.isArray(dataset.data) && dataset.data.length > 0);

    if (!normalizedDatasets.length || !hasAnyNumeric) {
      return null;
    }

    return {
      type: (rawConfig as any).type || graphic.chart_type || 'bar',
      data: {
        ...rawData,
        labels: normalizedLabels,
        datasets: normalizedDatasets,
      },
      options: {
        ...(rawConfig as any).options,
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    };
  }, [graphic.config, graphic.chart_type]);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setQuickchartFallbackFailed(false);

    if (!canvasRef.current || !normalizedChartConfig) {
      if (graphic.quickchart_url) {
        setLoaded(true);
        setError(false);
      } else if (!graphic.quickchart_url) {
        setError(true);
      }
      return;
    }

    let destroyed = false;

    const loadChart = async () => {
      try {
        const ChartJS = (await import('chart.js/auto')).default;
        if (destroyed || !canvasRef.current) return;

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new ChartJS(canvasRef.current, normalizedChartConfig as any);
        setLoaded(true);
        setError(false);
      } catch (e) {
        console.error('Chart.js render error:', e);
        setError(true);
      }
    };

    loadChart();

    return () => {
      destroyed = true;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [normalizedChartConfig, graphic.quickchart_url]);

  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else if (graphic.quickchart_url) {
      window.open(graphic.quickchart_url, '_blank');
    }
  }, [graphic.quickchart_url]);

  if (error && graphic.quickchart_url && !quickchartFallbackFailed) {
    return (
      <div style={{ position: 'relative' }}>
        <img
          src={graphic.quickchart_url}
          alt={graphic.caption || 'Chart'}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
          onError={() => {
            setQuickchartFallbackFailed(true);
            setError(true);
          }}
        />
        <GraphicActions onDownload={handleDownload} onRegenerate={onRegenerate} caption={graphic.caption} metadata={graphic.metadata} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} color="#f87171" />
        <span style={{ color: '#f87171', fontSize: 12 }}>Failed to render chart</span>
        {onRegenerate && (
          <button onClick={onRegenerate} style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '6px', padding: '4px 10px', color: '#c4b5fd', fontSize: 11, cursor: 'pointer' }}>
            <RotateCcw size={12} style={{ marginRight: 4 }} /> Retry
          </button>
        )}
      </div>
    );
  }

  if (graphic.quickchart_url && !normalizedChartConfig && !quickchartFallbackFailed) {
    return (
      <div style={{ position: 'relative' }}>
        <img
          src={graphic.quickchart_url}
          alt={graphic.caption || 'Chart'}
          style={{ width: '100%', height: 'auto', borderRadius: '8px', display: 'block' }}
          onError={() => {
            setQuickchartFallbackFailed(true);
            setError(true);
          }}
        />
        <GraphicActions onDownload={handleDownload} onRegenerate={onRegenerate} caption={graphic.caption} metadata={graphic.metadata} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {!loaded && <LoadingOverlay text="Rendering chart..." />}
      <div style={{ background: 'rgba(15, 15, 30, 0.95)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(139,92,246,0.15)', minHeight: '320px' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '320px' }} />
      </div>
      <GraphicActions onDownload={handleDownload} onRegenerate={onRegenerate} caption={graphic.caption} metadata={graphic.metadata} />
    </div>
  );
}

function DiagramRenderer({ graphic, onRegenerate }: GraphicsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!graphic.code || !containerRef.current) return;
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        const id = `mermaid-diagram-${++mermaidIdCounter}-${Date.now()}`;
        const { svg } = await mermaid.render(id, graphic.code!);
        if (!cancelled && containerRef.current) {
          setSvgContent(svg);
          setLoaded(true);
        }
      } catch (e) {
        console.error('Mermaid render error:', e);
        if (!cancelled) setError(true);
      }
    };

    renderDiagram();
    return () => { cancelled = true; };
  }, [graphic.code]);

  const handleDownload = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `diagram-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [svgContent]);

  if (error) {
    return (
      <div style={{ padding: '12px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
          <AlertTriangle size={16} color="#f87171" />
          <span style={{ color: '#f87171', fontSize: 12 }}>Failed to render diagram</span>
          {onRegenerate && (
            <button onClick={onRegenerate} style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '6px', padding: '4px 10px', color: '#c4b5fd', fontSize: 11, cursor: 'pointer' }}>
              <RotateCcw size={12} style={{ marginRight: 4 }} /> Retry
            </button>
          )}
        </div>
        {graphic.code && (
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', fontSize: 10, color: '#94a3b8', overflow: 'auto', maxHeight: '120px', whiteSpace: 'pre-wrap' }}>{graphic.code}</pre>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {!loaded && <LoadingOverlay text="Rendering diagram..." />}
      <div style={{ background: 'rgba(15, 15, 30, 0.95)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(139,92,246,0.15)', overflow: 'auto', maxHeight: '400px' }}>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => setScale(s => Math.max(0.3, s - 0.15))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8' }}>
            <ZoomOut size={12} />
          </button>
          <button onClick={() => setScale(1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8', fontSize: 10 }}>
            {Math.round(scale * 100)}%
          </button>
          <button onClick={() => setScale(s => Math.min(2, s + 0.15))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8' }}>
            <ZoomIn size={12} />
          </button>
        </div>
        <div
          ref={containerRef}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' }}
        />
      </div>
      <GraphicActions onDownload={handleDownload} onRegenerate={onRegenerate} caption={graphic.caption} metadata={graphic.metadata} />
    </div>
  );
}

function ImageRenderer({ graphic, onRegenerate }: GraphicsRendererProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const imageUrl = graphic.url || (graphic.base64 ? `data:image/png;base64,${graphic.base64}` : '');

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `generated-image-${Date.now()}.png`;
    link.href = imageUrl;
    link.target = '_blank';
    link.click();
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} color="#f87171" />
        <span style={{ color: '#f87171', fontSize: 12 }}>No image URL available</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} color="#f87171" />
        <span style={{ color: '#f87171', fontSize: 12 }}>Failed to load image</span>
        {onRegenerate && (
          <button onClick={onRegenerate} style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '6px', padding: '4px 10px', color: '#c4b5fd', fontSize: 11, cursor: 'pointer' }}>
            <RotateCcw size={12} style={{ marginRight: 4 }} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {!loaded && <LoadingOverlay text="Loading image..." />}
      <div style={{ background: 'rgba(15, 15, 30, 0.95)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.15)', cursor: 'pointer', position: 'relative' }} onClick={() => setExpanded(!expanded)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); }}}>
        <img
          src={imageUrl}
          alt={graphic.caption || 'Generated image'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: 'auto',
            display: loaded ? 'block' : 'none',
            maxHeight: expanded ? 'none' : '320px',
            objectFit: 'contain',
            transition: 'max-height 0.3s ease',
          }}
        />
        {loaded && !expanded && (
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Maximize2 size={10} color="#94a3b8" />
            <span style={{ color: '#94a3b8', fontSize: 10 }}>Click to expand</span>
          </div>
        )}
      </div>
      <GraphicActions onDownload={handleDownload} onRegenerate={onRegenerate} caption={graphic.caption} metadata={graphic.metadata} />
    </div>
  );
}

function LoadingOverlay({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      background: 'rgba(15, 15, 30, 0.95)',
      borderRadius: '8px',
      border: '1px solid rgba(139,92,246,0.15)',
      minHeight: '120px',
    }}>
      <Loader2 size={24} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>{text}</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function GraphicActions({ onDownload, onRegenerate, caption, metadata }: { onDownload?: () => void; onRegenerate?: () => void; caption?: string; metadata?: any }) {
  return (
    <div style={{ marginTop: '8px' }}>
      {caption && (
        <p style={{ margin: '0 0 6px 0', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{caption}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {onDownload && (
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 10px', color: '#94a3b8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <Download size={11} /> Download
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 10px', color: '#94a3b8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <RotateCcw size={11} /> Regenerate
          </button>
        )}
        {metadata?.engine && (
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            {metadata.engine}{metadata.generation_time ? ` (${metadata.generation_time}s)` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default GraphicsRenderer;
