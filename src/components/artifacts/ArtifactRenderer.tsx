import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Artifact } from '../../services/artifactManager.service';
import { Code, Play, Copy, Download, Maximize2, Minimize2, RefreshCw, FileText, Layout, Image, History, Settings, Edit3, Save, X, ChevronRight, ChevronDown, Eye, EyeOff, FileCode, Type, Palette, Box, Layers, Menu, Clock, MessageSquare, Info, Search, Undo2, Redo2, ZoomIn, ZoomOut, Share2, ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SearchResultsCard from '../SearchResultsCard';
import '../messageFormatter.css';
import { CodeBlock } from '../CodeBlock';
import { MermaidBlock } from '../rich/MermaidBlock';
import { VegaLiteBlock } from '../rich/VegaLiteBlock';

const WorkflowCanvas = lazy(() => import('../WorkflowCanvas').then(m => ({ default: m.WorkflowCanvas })));

interface ArtifactRendererProps {
  artifact: Artifact;
  onExecute?: (artifact: Artifact) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
  onExecute,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<'outline' | 'versions' | 'properties' | 'comments'>('outline');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(artifact.content);
  const [showPreview, setShowPreview] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [versions, setVersions] = useState<Array<{id: string; timestamp: string; content: string; description: string}>>([{id: '1', timestamp: new Date().toISOString(), content: artifact.content, description: 'Initial version'}]);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [selectedText, setSelectedText] = useState('');


const KARIOS_DESIGN_SYSTEM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=EB+Garamond:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
:root{--ha-parchment:#faf8f5;--ha-ink:#1a1814;--ha-muted:#6b6560;--ha-border:#d9d5cd;--ha-accent:#b87a3d;--ha-surface:#f2efe9}
.ha-artifact{background:var(--ha-parchment);color:var(--ha-ink);font-family:'DM Sans',system-ui,sans-serif;max-width:860px;margin:0 auto;border:1px solid var(--ha-border);border-radius:4px;overflow:hidden}
.ha-topbar{display:flex;align-items:center;gap:8px;padding:10px 20px;border-bottom:1px solid var(--ha-border);background:var(--ha-surface)}
.ha-dot{width:8px;height:8px;border-radius:50%;background:var(--ha-accent);flex-shrink:0}
.ha-topbar-title{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ha-muted)}
.ha-canvas{padding:48px 52px 52px}
.ha-eyebrow{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--ha-accent);margin-bottom:12px}
.ha-h1{font-family:'Playfair Display',Georgia,serif;font-size:clamp(28px,4vw,40px);font-weight:700;line-height:1.15;color:var(--ha-ink);margin:0 0 24px}
.ha-h1 em{font-style:italic;color:var(--ha-accent)}
.ha-accent{color:var(--ha-accent)}
.ha-body{font-family:'EB Garamond',Georgia,serif;font-size:18px;font-weight:400;line-height:1.7;color:var(--ha-ink);margin-bottom:36px}
.ha-rule{border:none;border-top:1px solid var(--ha-border);margin:36px 0}
.ha-meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--ha-border)}
.ha-meta-grid-row2{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
.ha-meta-grid>div,.ha-meta-grid-row2>div{padding:16px 20px;border-right:1px solid var(--ha-border)}
.ha-meta-grid>div:last-child,.ha-meta-grid-row2>div:last-child{border-right:none}
.ha-meta-label{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ha-muted);margin-bottom:4px}
.ha-meta-value{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:400;color:var(--ha-ink)}
`;

const injectKariosDesignSystem = (html: string): string => {
  const styleBlock = `<link rel="preconnect" href="https://fonts.googleapis.com"><style>${KARIOS_DESIGN_SYSTEM_CSS}</style>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleBlock}</head>`);
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/(<head[^>]*>)/i, `$1${styleBlock}`);
  }
  return `${styleBlock}${html}`;
};

  const buildReactHtml = (code: string) => {
    const cleaned = String(code || '')
      .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, '')
      .replace(/^\s*export\s+default\s+/m, 'const __DefaultExport = ');

    const boot = `${cleaned}\nconst __Root = (typeof __DefaultExport !== 'undefined' ? __DefaultExport : (typeof App !== 'undefined' ? App : null));\nconst __mount = () => {\n  const el = document.getElementById('root');\n  if (!el || !__Root) return;\n  try {\n    if (ReactDOM && typeof ReactDOM.createRoot === 'function') {\n      ReactDOM.createRoot(el).render(React.createElement(__Root));\n    } else if (ReactDOM && typeof ReactDOM.render === 'function') {\n      ReactDOM.render(React.createElement(__Root), el);\n    }\n  } catch (e) {\n    const pre = document.createElement('pre');\n    pre.style.whiteSpace = 'pre-wrap';\n    pre.textContent = String(e && e.message ? e.message : e);\n    el.innerHTML = '';\n    el.appendChild(pre);\n  }\n};\n__mount();`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>html,body{height:100%;margin:0}#root{height:100%}${KARIOS_DESIGN_SYSTEM_CSS}</style>
</head><body>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.25.6/babel.min.js"></script>
<script type="text/babel">${boot}</script>
</body></html>`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.metadata.title || 'artifact'}.${getFileExtension(artifact.type)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecute = async () => {
    if (!artifact.metadata.executable) return;
    
    setIsExecuting(true);
    try {
      if (onExecute) {
        await onExecute(artifact);
      }
      
      const mimeType = artifact.metadata?.mimeType;
      if (artifact.type === 'code' && artifact.metadata.language === 'javascript') {
        executeJavaScript(artifact.content);
      } else if (artifact.type === 'html' || mimeType === 'text/html') {
        renderInIframe(artifact.content);
      } else if (artifact.type === 'react' || mimeType === 'application/vnd.ant.react') {
        renderInIframe(buildReactHtml(artifact.content));
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeJavaScript = (code: string) => {
    try {
      const result = new Function(code)();
      setExecutionResult({ result });
    } catch (error: any) {
      setExecutionResult({ error: error.message });
    }
  };

  const renderInIframe = (content: string) => {
    if (!iframeRef.current) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    
    doc.open();
    doc.write(injectKariosDesignSystem(content));
    doc.close();
  };

  const getFileExtension = (type: string): string => {
    const extensions: Record<string, string> = {
      'code': artifact.metadata.language || 'txt',
      'react': 'jsx',
      'html': 'html',
      'markdown': 'md',
      'svg': 'svg',
      'workflow': 'json',
      'web_automation': 'txt',
      'diagram': 'mmd'
    };
    return extensions[type] || 'txt';
  };

  const getHeaderIcon = () => {
    const mimeType = artifact.metadata?.mimeType;
    if (mimeType === 'application/vnd.ant.code') return <Code className="w-5 h-5 text-[#00F3FF]" />;
    if (mimeType === 'text/markdown') return <FileText className="w-5 h-5 text-[#00F3FF]" />;
    if (mimeType === 'text/html') return <Layout className="w-5 h-5 text-[#00F3FF]" />;
    if (mimeType === 'image/svg+xml') return <Image className="w-5 h-5 text-[#00F3FF]" />;
    if (mimeType === 'application/vnd.ant.mermaid') return <Image className="w-5 h-5 text-[#00F3FF]" />;
    if (mimeType === 'application/vnd.ant.react') return <Code className="w-5 h-5 text-[#00F3FF]" />;

    switch (artifact.type) {
      case 'code':
      case 'react':
        return <Code className="w-5 h-5 text-[#00F3FF]" />;
      case 'html':
        return <Layout className="w-5 h-5 text-[#00F3FF]" />;
      case 'diagram':
      case 'svg':
        return <Image className="w-5 h-5 text-[#00F3FF]" />;
      case 'markdown':
      default:
        return <FileText className="w-5 h-5 text-[#00F3FF]" />;
    }
  };

  const unescapeHtml = (text: string): string => {
    const htmlEntities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#47;': '/',
      '&nbsp;': ' ',
    };
    return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F|#47|nbsp);/g, (match) => htmlEntities[match] || match);
  };

  const normalizeMarkdownForCanvas = (content: string) => {
    if (typeof content !== 'string') return '';

    let normalized = unescapeHtml(content);
    const isSearchResult = normalized.startsWith('[SEARCH_RESULTS]');

    if (isSearchResult) {
      normalized = normalized.replace('[SEARCH_RESULTS] ', '');
      normalized = normalized
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/?p>/g, '\n\n')
        .replace(/<\/?[^>]+(>|$)/g, '');
    }

    normalized = normalized.replace(/<thought>([\s\S]*?)<\/thought>/g, '\n> **Thinking Process:**\n> $1\n');
    normalized = normalized.replace(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*{0,3}\s*)?(?:\d+\.\s*)?(?:#+\s*)?(?:Sources|References)\b[^\n]*\n([\s\S]*?)(?=\n{2,}|$)/gi, '');
    normalized = normalized.replace(/^\s*[-*]?\s*\[source\s*\d+\]\s*$/gim, '');
    normalized = normalized.replace(/^\s*[-*]\s*\[source\s*\d+\]\s*$/gim, '');
    normalized = normalized.replace(/^\s*[-*]\s*[-*]\s*\[?\d+\]?\s*$/gim, '');
    normalized = normalized.replace(/^\s*[-*]\s*[-*]\s*\[source\s*\d+\]\s*$/gim, '');
    normalized = normalized.replace(/\[(\d+)\]/g, '');

    { 
      const rewritten: string[] = [];
      let inCodeBlock = false;
      for (const line of normalized.split(/\r?\n/)) {
        const trimmed = String(line || '').trim();
        if (trimmed.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          rewritten.push(line);
          continue;
        }
        if (!inCodeBlock) {
          const numberedTableWithTitle = String(line || '').match(/^(\s*)(?:[-*]\s+)?(\d+)\.\s+([^|]+?)\s+\|(.+)$/);
          if (numberedTableWithTitle && ((numberedTableWithTitle[4].match(/\|/g) || []).length >= 3)) {
            const tablePart = numberedTableWithTitle[4].trim().replace(/^\|+/, '').replace(/\|+$/, '');
            rewritten.push(`${numberedTableWithTitle[1]}${numberedTableWithTitle[2]}. ${numberedTableWithTitle[3].trim()}`);
            rewritten.push(`${numberedTableWithTitle[1]}| ${tablePart} |`);
            continue;
          }
          const numberedTableDirect = String(line || '').match(/^(\s*)(?:[-*]\s+)?\d+\.\s+\|(.+)$/);
          if (numberedTableDirect) {
            const tablePart = numberedTableDirect[2].trim().replace(/^\|+/, '').replace(/\|+$/, '');
            rewritten.push(`${numberedTableDirect[1]}| ${tablePart} |`);
            continue;
          }
          const plainMatch = String(line || '').match(/^(\s*)[-*]\s+(\d+)\.\s+(.*)$/);
          if (plainMatch) {
            rewritten.push(`${plainMatch[1]}${plainMatch[2]}. ${plainMatch[3]}`);
            continue;
          }
          const boldMatch = String(line || '').match(/^(\s*)[-*]\s+\*\*(\d+)\.\s*(.*?)\*\*(.*)$/);
          if (boldMatch) {
            rewritten.push(`${boldMatch[1]}${boldMatch[2]}. **${boldMatch[3]}**${boldMatch[4] || ''}`);
            continue;
          }
          const underscoreMatch = String(line || '').match(/^(\s*)[-*]\s+__(\d+)\.\s*(.*?)__(.*)$/);
          if (underscoreMatch) {
            rewritten.push(`${underscoreMatch[1]}${underscoreMatch[2]}. __${underscoreMatch[3]}__${underscoreMatch[4] || ''}`);
            continue;
          }
        }
        rewritten.push(line);
      }
      normalized = rewritten.join('\n');
    }

    const lines = normalized.split(/\r?\n/);
    const expanded: string[] = [];
    for (const line of lines) {
      const raw = String(line || '');
      const s = raw.trim();
      if (/^[-*]?\s*\[source\s*\d+\]\s*$/i.test(s)) continue;
      if (/^[-*]\s*[-*]\s*\[?\d+\]?\s*$/.test(s)) continue;
      if (/^\[\d+\]\s*$/.test(s)) continue;

      const dividerOnly = /^\s*\|[-:|\s]+\|\s*$/;
      if (dividerOnly.test(raw)) {
        expanded.push(raw);
        continue;
      }
      const pipeCount = (raw.match(/\|/g) || []).length;
      if (pipeCount >= 6 && (raw.includes(' | ') || /[^|]\|[^|]/.test(raw)) && !s.includes('\n')) {
        const cells = raw
          .split('|')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);
        const candidates = [4, 5, 6, 3, 2];
        const colCount = candidates.find((c) => cells.length > c && (cells.length - c) % c === 0);
        if (colCount) {
          const rowCount = (cells.length - colCount) / colCount;
          if (colCount === 2 && rowCount < 3) {
            expanded.push(raw);
            continue;
          }
          const header = cells.slice(0, colCount);
          expanded.push(`| ${header.join(' | ')} |`);
          expanded.push(`| ${header.map(() => '---').join(' | ')} |`);
          for (let i = colCount; i < cells.length; i += colCount) {
            const row = cells.slice(i, i + colCount);
            expanded.push(`| ${row.join(' | ')} |`);
          }
          expanded.push('');
          continue;
        }
      }

      const m = raw.match(/^(\s*)[-*]\s+\|(.*)$/);
      if (m) {
        expanded.push(`${m[1]}|${m[2]}`);
        continue;
      }
      expanded.push(raw);
    }
    return expanded.join('\n');
  };

  const markdownComponents: any = {
    h1: ({ children }: any) => <h1 className="message-heading-1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="message-heading-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="message-heading-3">{children}</h3>,
    h4: ({ children }: any) => <h4 className="message-heading-3">{children}</h4>,
    h5: ({ children }: any) => <h5 className="message-heading-3">{children}</h5>,
    h6: ({ children }: any) => <h6 className="message-heading-3">{children}</h6>,
    ul: ({ children }: any) => <ul className="message-list">{children}</ul>,
    ol: ({ children }: any) => <ol className="message-ordered-list">{children}</ol>,
    li: ({ children }: any) => <li className="message-list-item">{children}</li>,
    table: ({ children }: any) => (
      <div className="message-table-wrapper">
        <table className="message-table">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="message-table-header">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="message-table-body">{children}</tbody>,
    tr: ({ children }: any) => <tr className="message-table-row">{children}</tr>,
    td: ({ children }: any) => <td className="message-table-cell">{children}</td>,
    th: ({ children }: any) => <th className="message-table-header-cell">{children}</th>,
    p: ({ children }: any) => <p className="message-paragraph">{children}</p>,
    a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">{children}</a>,
    em: ({ children }: any) => <em className="message-emphasis">{children}</em>,
    strong: ({ children }: any) => <strong className="message-strong">{children}</strong>,
    hr: () => <hr className="message-hr" />,
    blockquote: ({ children }: any) => <blockquote className="message-blockquote">{children}</blockquote>,
    pre: ({ children }: any) => <>{children}</>,
    code: ({ children, className, inline }: any) => {
      const match = /language-([\w-]+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');
      const normalizedLang = String(language || '').toLowerCase();
      if (inline || !className) {
        return <code className="message-inline-code">{children}</code>;
      }
      if (normalizedLang === 'mermaid') {
        return <MermaidBlock code={codeString} />;
      }
      if (normalizedLang === 'vega-lite' || normalizedLang === 'vegalite') {
        return <VegaLiteBlock code={codeString} />;
      }
      return <CodeBlock code={codeString} language={language} />;
    },
  };

  const renderMarkdownContent = (content: string) => (
    <div className="h-full overflow-auto" style={{ background: '#0B0C0E' }}>
      <div className="mx-auto px-6 py-8 text-white" style={{ maxWidth: '760px', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', width: `${100 / (zoomLevel / 100)}%` }}>
        {(() => {
          const normalized = normalizeMarkdownForCanvas(content);
          const sourceMatches = normalized.match(/(?:Sources|References)(?:\s*\([^\n\)]*\))?\s*:\n([\s\S]*?)(?:\n{2,}|$)/i);
          const urlLines = sourceMatches
            ? sourceMatches[1]
                .split('\n')
                .map((l) => String(l || '').trim())
                .filter((l) => l.startsWith('-'))
            : [];
          const sources = urlLines
            .map((line) => {
              const mdMatch = line.match(/^-\s*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
              const urlMatch = line.match(/https?:\/\/[^\s\)\]]+/);
              const url = (mdMatch?.[2] || urlMatch?.[0] || '').trim();
              const titleFromMd = (mdMatch?.[1] || '').trim();
              if (!url) return null;
              let domain = '';
              let title = '';
              try {
                const urlObj = new URL(url);
                domain = urlObj.hostname.replace('www.', '');
                const pathParts = urlObj.pathname.split('/').filter(Boolean);
                title = titleFromMd || pathParts[pathParts.length - 1]?.replace(/-/g, ' ').replace(/\.\w+$/, '') || domain;
                title = title.charAt(0).toUpperCase() + title.slice(1);
              } catch {
                domain = url.substring(0, 30);
                title = titleFromMd || domain;
              }
              return { title, url, domain };
            })
            .filter(Boolean) as { title: string; url: string; domain: string }[];

          const body = sources.length > 0
            ? normalized.replace(/(?:^|\n)\s*(?:Sources|References)(?:\s*\([^\n\)]*\))?\s*:\n([\s\S]*?)(?:\n{2,}|$)/i, '')
            : normalized;

          return (
            <>
              {sources.length > 0 && (
                <div className="mb-6 rounded-xl overflow-hidden border border-[#00F3FF]/20">
                  <SearchResultsCard
                    query={artifact.metadata.title || 'Sources'}
                    sources={sources}
                    resultsCount={sources.length}
                  />
                </div>
              )}
              <div className="artifact-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {body}
                </ReactMarkdown>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  const renderWebAutomation = () => {
    try {
      const parsed = JSON.parse(artifact.content);
      return (
        <div className="h-full overflow-auto p-6 bg-gray-900 text-white">
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(parsed, null, 2)}</pre>
        </div>
      );
    } catch (e) {
      return renderMarkdownContent(artifact.content);
    }
  };

  const renderSVG = () => (
    <div className="h-full overflow-auto bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }} dangerouslySetInnerHTML={{ __html: artifact.content }} />
    </div>
  );

  const renderContent = () => {
    const mimeType = artifact.metadata?.mimeType;
    if (mimeType) {
      switch (mimeType) {
        case 'application/vnd.ant.code':
          return renderCode();
        case 'text/markdown':
          return renderMarkdown();
        case 'text/html':
          return renderHTML();
        case 'image/svg+xml':
          return renderSVG();
        case 'application/vnd.ant.mermaid':
          return renderDiagram();
        case 'application/vnd.ant.react':
          return renderReact();
      }
    }
    switch (artifact.type) {
      case 'code':
        return renderCode();
      case 'html':
        return renderHTML();
      case 'react':
        return renderReact();
      case 'workflow':
        return renderWorkflow();
      case 'multi_agent_workflow':
        return renderMultiAgentWorkflow();
      case 'web_automation':
        return renderWebAutomation();
      case 'diagram':
        return renderDiagram();
      case 'svg':
        return renderSVG();
      case 'markdown':
        return renderMarkdown();
      default:
        return <div className="p-4 text-white">Unsupported artifact type</div>;
    }
  };

  const renderCode = () => (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      <div className="flex-1 overflow-auto relative" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', height: `${100 / (zoomLevel / 100)}%`, width: `${100 / (zoomLevel / 100)}%` }}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#00F3FF]/5 via-transparent to-[#00F3FF]/5 pointer-events-none"></div>
        <SyntaxHighlighter
          language={artifact.metadata.language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '2rem',
            background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            borderRadius: '0',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}
          showLineNumbers
          wrapLines
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1.5em',
            color: '#666',
            userSelect: 'none',
            textAlign: 'right'
          }}
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
      {executionResult && (
        <div className="border-t border-[#00F3FF]/20 p-5 bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <div className="text-sm font-semibold text-[#00F3FF]">Execution Result</div>
          </div>
          <pre className="text-white text-sm overflow-auto bg-black/30 p-4 rounded-lg border border-gray-800/50">
            {JSON.stringify(executionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const renderHTML = () => (
    <div className="h-full bg-white relative">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-white text-xs font-medium border border-white/10">
          Live Preview
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="HTML Preview"
        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', height: `${100 / (zoomLevel / 100)}%`, width: `${100 / (zoomLevel / 100)}%` }}
      />
    </div>
  );

  const renderReact = () => (
    <div className="h-full flex flex-col">
      <div className="h-1/2 bg-white relative border-b-2 border-[#00F3FF]/30">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm text-white text-xs font-medium border border-white/10">
            Live Preview
          </div>
        </div>
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin"
          title="React Preview"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left', height: `${100 / (zoomLevel / 100)}%`, width: `${100 / (zoomLevel / 100)}%` }}
        />
      </div>
      <div className="flex-1 overflow-auto bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F]">
        <SyntaxHighlighter
          language="jsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.9rem',
            lineHeight: '1.6'
          }}
          showLineNumbers
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  const renderWorkflow = () => {
    try {
      const workflowData = JSON.parse(artifact.content);
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Loading workflow...</div>}>
          <WorkflowCanvas
            phases={workflowData.phases || workflowData.steps || []}
            isCanvasMode={false}
          />
        </Suspense>
      );
    } catch (error) {
      return (
        <div className="p-4 text-red-400">
          Failed to parse workflow data
        </div>
      );
    }
  };

  const renderMultiAgentWorkflow = () => {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Loading workflow...</div>}>
        <div className="h-full overflow-auto p-4">
          <div className="text-white text-sm artifact-markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {normalizeMarkdownForCanvas(artifact.content)}
            </ReactMarkdown>
          </div>
        </div>
      </Suspense>
    );
  };

  const renderDiagram = () => (
    <div className="h-full overflow-auto bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] flex items-center justify-center p-8">
      <div className="w-full" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}>
        <MermaidBlock code={artifact.content} />
      </div>
    </div>
  );

  const renderMarkdown = () => renderMarkdownContent(artifact.content);

  useEffect(() => {
    const mimeType = artifact.metadata?.mimeType;
    if ((artifact.type === 'html' || mimeType === 'text/html') && artifact.metadata.executable) {
      renderInIframe(artifact.content);
    }
    if ((artifact.type === 'react' || mimeType === 'application/vnd.ant.react') && artifact.metadata.executable) {
      renderInIframe(buildReactHtml(artifact.content));
    }
  }, [artifact]);

  useEffect(() => {
    const words = artifact.content.split(/\s+/).filter(w => w.length > 0).length;
    const lines = artifact.content.split('\n').length;
    setWordCount(words);
    setLineCount(lines);
  }, [artifact.content]);

  const handleSaveEdit = () => {
    const newVersion = {
      id: String(versions.length + 1),
      timestamp: new Date().toISOString(),
      content: editedContent,
      description: `Edit ${versions.length + 1}`
    };
    setVersions([...versions, newVersion]);
    setIsEditing(false);
  };

  const handleRestoreVersion = (versionContent: string) => {
    setEditedContent(versionContent);
    handleSaveEdit();
  };

  const getContextTools = () => {
    const mimeType = artifact.metadata?.mimeType;
    const type = artifact.type;
    
    if (type === 'code' || mimeType === 'application/vnd.ant.code') {
      return [
        { icon: Play, label: 'Run', action: handleExecute, show: artifact.metadata.executable },
        { icon: Edit3, label: 'Edit', action: () => setIsEditing(!isEditing), show: true },
        { icon: Copy, label: 'Copy', action: handleCopy, show: true },
        { icon: Download, label: 'Export', action: handleDownload, show: true },
      ];
    }
    
    if (type === 'markdown' || mimeType === 'text/markdown') {
      return [
        { icon: Eye, label: showPreview ? 'Edit' : 'Preview', action: () => setShowPreview(!showPreview), show: true },
        { icon: Edit3, label: 'Edit', action: () => setIsEditing(!isEditing), show: true },
        { icon: Copy, label: 'Copy', action: handleCopy, show: true },
        { icon: Download, label: 'Export', action: handleDownload, show: true },
      ];
    }
    
    return [
      { icon: Edit3, label: 'Edit', action: () => setIsEditing(!isEditing), show: true },
      { icon: Copy, label: 'Copy', action: handleCopy, show: true },
      { icon: Download, label: 'Export', action: handleDownload, show: true },
    ];
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A] border-l border-gray-800/50 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50 bg-gradient-to-r from-[#0A0A0A]/95 to-[#1A1A1A]/95 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#00F3FF]/20 to-[#00F3FF]/5 border border-[#00F3FF]/30 shadow-lg shadow-[#00F3FF]/20">
            {getHeaderIcon()}
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-tight flex items-center gap-2">
              {artifact.metadata.title}
              <span className="px-2 py-0.5 rounded-md bg-[#00F3FF]/10 text-[#00F3FF] text-xs font-medium border border-[#00F3FF]/20">
                {artifact.type}
              </span>
            </div>
            <div className="text-gray-400 text-xs mt-1 flex items-center gap-3">
              <span>{artifact.metadata.description}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>{wordCount} words</span>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>{lineCount} lines</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/70 text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-700/50"></div>

          {getContextTools().filter(tool => tool.show).map((tool, idx) => (
            <button
              key={idx}
              onClick={tool.action}
              disabled={isExecuting && tool.label === 'Run'}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-[#00F3FF]/20 text-gray-300 hover:text-[#00F3FF] transition-all duration-200 border border-gray-700/50 hover:border-[#00F3FF]/30 disabled:opacity-50"
              title={tool.label}
            >
              {isExecuting && tool.label === 'Run' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <tool.icon className="w-4 h-4" />
              )}
            </button>
          ))}

          <div className="h-6 w-px bg-gray-700/50"></div>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/70 text-gray-300 hover:text-white transition-all duration-200 border border-gray-700/50"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 border border-red-500/20 hover:border-red-500/30"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>

        {sidebarOpen && (
          <div className="w-80 border-l border-gray-800/50 bg-[#0A0A0A]/95 backdrop-blur-xl flex flex-col">
            <div className="flex border-b border-gray-800/50">
              {(['outline', 'versions', 'properties', 'comments'] as const).map((panel) => (
                <button
                  key={panel}
                  onClick={() => setActiveSidebarPanel(panel)}
                  className={`flex-1 px-4 py-3 text-xs font-medium transition-all duration-200 border-b-2 ${
                    activeSidebarPanel === panel
                      ? 'border-[#00F3FF] text-[#00F3FF] bg-[#00F3FF]/5'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
                  }`}
                >
                  {panel.charAt(0).toUpperCase() + panel.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-4">
              {activeSidebarPanel === 'outline' && (
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Document Outline</div>
                  <div className="text-gray-500 text-sm">No outline available</div>
                </div>
              )}

              {activeSidebarPanel === 'versions' && (
                <div className="space-y-3">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Version History</div>
                  {versions.map((version, idx) => (
                    <div key={version.id} className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:border-[#00F3FF]/30 transition-all duration-200 group cursor-pointer"
                         onClick={() => handleRestoreVersion(version.content)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">Version {version.id}</span>
                        <span className="text-[#00F3FF] text-xs opacity-0 group-hover:opacity-100 transition-opacity">Restore</span>
                      </div>
                      <div className="text-gray-400 text-xs">{new Date(version.timestamp).toLocaleString()}</div>
                      <div className="text-gray-500 text-xs mt-1">{version.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeSidebarPanel === 'properties' && (
                <div className="space-y-4">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Properties</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Type</div>
                      <div className="text-white text-sm">{artifact.type}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Language</div>
                      <div className="text-white text-sm">{artifact.metadata.language || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Created</div>
                      <div className="text-white text-sm">{new Date().toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Modified</div>
                      <div className="text-white text-sm">{new Date().toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Size</div>
                      <div className="text-white text-sm">{(artifact.content.length / 1024).toFixed(2)} KB</div>
                    </div>
                  </div>
                </div>
              )}

              {activeSidebarPanel === 'comments' && (
                <div className="space-y-2">
                  <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Comments</div>
                  <div className="text-gray-500 text-sm">No comments yet</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-2 border-t border-gray-800/50 bg-[#0A0A0A]/95 backdrop-blur-xl">
        <div className="flex items-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Saved</span>
          </div>
          <span>{wordCount} words</span>
          <span>{lineCount} lines</span>
          <span>Ln 1, Col 1</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            className="p-1 rounded hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-gray-400 min-w-[3rem] text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
            className="p-1 rounded hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="absolute top-20 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-green-500/30 border border-green-400/30 animate-in slide-in-from-right-5 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            Copied to clipboard!
          </div>
        </div>
      )}
    </div>
  );
};
