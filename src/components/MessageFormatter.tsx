import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Modal } from '@mui/material';
import MessageContextIndicator from './context/MessageContextIndicator';
import ContextViewer from './context/ContextViewer';
import { chatService } from '../services/api/chat.service';
import SearchResultsCard from './SearchResultsCard';
import { CodeBlock } from './CodeBlock';
import { MermaidBlock } from './rich/MermaidBlock';
import { VegaLiteBlock } from './rich/VegaLiteBlock';
import './messageFormatter.css';

const ARTIFACT_TOKEN_RE = /\[\[(ARTIFACT|IMAGE|TABLE|CHART|DOCUMENT|VIDEO|AUDIO)_([a-f0-9]{8})\]\]/g;

const ArtifactEmbed: React.FC<{ tokenType: string; shortId: string }> = ({ tokenType, shortId }) => {
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState(false);
  const contentUrl = `/api/v1/artifacts/${shortId}/content`;
  const metaUrl = `/api/v1/artifacts/${shortId}`;

  useEffect(() => {
    fetch(metaUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setMeta)
      .catch(() => setError(true));
  }, [metaUrl]);

  if (error) {
    return <div style={{ padding: '12px', background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', color: '#888', fontSize: '13px' }}>Artifact not found</div>;
  }

  if (tokenType === 'IMAGE') {
    return (
      <div style={{ margin: '16px 0' }}>
        {meta?.title && <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>{meta.title}</div>}
        <img src={contentUrl} alt={meta?.title || 'Generated image'} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #333' }} />
      </div>
    );
  }

  if (tokenType === 'VIDEO') {
    return (
      <div style={{ margin: '16px 0' }}>
        {meta?.title && <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>{meta.title}</div>}
        <video controls src={contentUrl} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #333' }} />
      </div>
    );
  }

  if (tokenType === 'AUDIO') {
    return (
      <div style={{ margin: '16px 0' }}>
        {meta?.title && <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>{meta.title}</div>}
        <audio controls src={contentUrl} style={{ width: '100%' }} />
      </div>
    );
  }

  if (tokenType === 'CHART') {
    return <ChartArtifactEmbed shortId={shortId} title={meta?.title} />;
  }

  if (tokenType === 'TABLE') {
    return <TableArtifactEmbed shortId={shortId} title={meta?.title} />;
  }

  if (tokenType === 'DOCUMENT') {
    return <DocumentArtifactEmbed shortId={shortId} title={meta?.title} />;
  }

  return (
    <div style={{ margin: '16px 0', border: '1px solid #333', borderRadius: '10px', overflow: 'hidden', background: '#0d0d1a' }}>
      {meta?.title && (
        <div style={{ padding: '10px 14px', background: '#141428', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e0e0e0' }}>{meta.title}</span>
          <a href={contentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#6366f1' }}>Open</a>
        </div>
      )}
      <iframe
        src={contentUrl}
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', height: '480px', border: 'none', background: '#fff' }}
        title={meta?.title || 'Artifact'}
      />
    </div>
  );
};

const ChartArtifactEmbed: React.FC<{ shortId: string; title?: string }> = ({ shortId, title }) => {
  const [spec, setSpec] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/v1/artifacts/${shortId}/content`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(setSpec)
      .catch(() => setSpec(null));
  }, [shortId]);
  if (!spec) return null;
  return (
    <div style={{ margin: '16px 0' }}>
      {title && <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>{title}</div>}
      <VegaLiteBlock code={spec} />
    </div>
  );
};

const TableArtifactEmbed: React.FC<{ shortId: string; title?: string }> = ({ shortId, title }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/v1/artifacts/${shortId}/content`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setData)
      .catch(() => setData(null));
  }, [shortId]);
  if (!data) return null;
  const cols: any[] = data.columns || [];
  const rows: any[] = data.rows || [];
  return (
    <div style={{ margin: '16px 0' }}>
      {(title || data.title) && <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>{title || data.title}</div>}
      <div className="message-table-wrapper">
        <table className="message-table">
          <thead className="message-table-header">
            <tr className="message-table-row">{cols.map((c: any, i: number) => <th key={i} className="message-table-header-cell">{c.name || c}</th>)}</tr>
          </thead>
          <tbody className="message-table-body">
            {rows.map((row: any, ri: number) => (
              <tr key={ri} className="message-table-row">
                {cols.map((c: any, ci: number) => <td key={ci} className="message-table-cell">{String(row[c.name || c] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DocumentArtifactEmbed: React.FC<{ shortId: string; title?: string }> = ({ shortId, title }) => {
  const [md, setMd] = useState<string | null>(null);
  useEffect(() => {
    fetch(`/api/v1/artifacts/${shortId}/content`)
      .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .then(setMd)
      .catch(() => setMd(null));
  }, [shortId]);
  if (!md) return null;
  return (
    <div style={{ margin: '16px 0', padding: '16px', background: '#141428', border: '1px solid #333', borderRadius: '10px' }}>
      {title && <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0e0', marginBottom: '10px' }}>{title}</div>}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
};

type ContentSegment = { type: 'text'; text: string } | { type: 'token'; tokenType: string; shortId: string };

function splitByArtifactTokens(text: string): ContentSegment[] {
  if (!text) return [{ type: 'text', text: '' }];
  const re = new RegExp(ARTIFACT_TOKEN_RE.source, 'g');
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index).trim();
      if (chunk) segments.push({ type: 'text', text: chunk });
    }
    segments.push({ type: 'token', tokenType: match[1], shortId: match[2] });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex).trim();
    if (tail) segments.push({ type: 'text', text: tail });
  }
  if (segments.length === 0) segments.push({ type: 'text', text });
  return segments;
}

interface MessageFormatterProps {
  content: string;
  role: string;
  messageId?: string;
  chatId?: string;
  contextQuality?: number;
  contextState?: string;
}

/**
 * Component to format message content with proper styling
 * Uses React Markdown to render markdown as properly formatted HTML
 */
export const MessageFormatter: React.FC<MessageFormatterProps> = ({
  content,
  role,
  messageId,
  chatId,
  contextQuality,
  contextState
}) => {
  const [contextOpen, setContextOpen] = useState(false);
  const [contextData, setContextData] = useState<any>(null);

  const normalizeInlinePipeTables = (text: string) => {
    if (typeof text !== 'string' || !text) return '';
    const lines = text.split(/\r?\n/);
    const out: string[] = [];
    for (const line of lines) {
      const raw = String(line || '');
      const trimmed = raw.trim();

      const dividerOnly = /^\s*\|[-:|\s]+\|\s*$/;
      if (dividerOnly.test(raw)) {
        out.push(raw);
        continue;
      }

      const pipeCount = (raw.match(/\|/g) || []).length;
      if (pipeCount >= 6 && (raw.includes(' | ') || /[^|]\|[^|]/.test(raw)) && !trimmed.includes('\n')) {
        const cells = raw
          .split('|')
          .map((p) => p.trim())
          .filter((p) => p.length > 0);

        const candidates = [4, 5, 6, 3, 2];
        const colCount = candidates.find((c) => cells.length > c && (cells.length - c) % c === 0);
        if (colCount) {
          const rowCount = (cells.length - colCount) / colCount;
          if (colCount === 2 && rowCount < 3) {
            out.push(raw);
            continue;
          }
          const header = cells.slice(0, colCount);
          const rows: string[][] = [];
          for (let i = colCount; i < cells.length; i += colCount) {
            rows.push(cells.slice(i, i + colCount));
          }
          out.push(`| ${header.join(' | ')} |`);
          out.push(`| ${header.map(() => '---').join(' | ')} |`);
          for (const r of rows) {
            out.push(`| ${r.join(' | ')} |`);
          }
          out.push('');
          continue;
        }
      }
      out.push(raw);
    }
    return out.join('\n');
  };

  const normalizeNumberedBulletsToOrdered = (text: string) => {
    if (typeof text !== 'string' || !text) return '';
    const lines = text.split(/\r?\n/);
    const out: string[] = [];
    let inCodeBlock = false;
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        out.push(line);
        continue;
      }
      if (inCodeBlock) {
        out.push(line);
        continue;
      }
      const numberedTableWithTitle = String(line || '').match(/^(\s*)(?:[-*]\s+)?(\d+)\.\s+([^|]+?)\s+\|(.+)$/);
      if (numberedTableWithTitle && ((numberedTableWithTitle[4].match(/\|/g) || []).length >= 3)) {
        const tablePart = numberedTableWithTitle[4].trim().replace(/^\|+/, '').replace(/\|+$/, '');
        out.push(`${numberedTableWithTitle[1]}${numberedTableWithTitle[2]}. ${numberedTableWithTitle[3].trim()}`);
        out.push(`${numberedTableWithTitle[1]}| ${tablePart} |`);
        continue;
      }
      const numberedTableDirect = String(line || '').match(/^(\s*)(?:[-*]\s+)?\d+\.\s+\|(.+)$/);
      if (numberedTableDirect) {
        const tablePart = numberedTableDirect[2].trim().replace(/^\|+/, '').replace(/\|+$/, '');
        out.push(`${numberedTableDirect[1]}| ${tablePart} |`);
        continue;
      }
      const plainMatch = String(line || '').match(/^[-*]\s+(\d+)\.\s+(.*)$/);
      if (plainMatch) {
        out.push(`${plainMatch[1]}. ${plainMatch[2]}`);
        continue;
      }
      const boldMatch = String(line || '').match(/^[-*]\s+\*\*(\d+)\.\s*(.*?)\*\*(.*)$/);
      if (boldMatch) {
        out.push(`${boldMatch[1]}. **${boldMatch[2]}**${boldMatch[3] || ''}`);
        continue;
      }
      const underscoreMatch = String(line || '').match(/^[-*]\s+__(\d+)\.\s*(.*?)__(.*)$/);
      if (underscoreMatch) {
        out.push(`${underscoreMatch[1]}. __${underscoreMatch[2]}__${underscoreMatch[3] || ''}`);
        continue;
      }
      out.push(line);
    }
    return out.join('\n');
  };

  // Extract sources from content for SearchResultsCard
  const extractedSources = useMemo(() => {
    if (role !== 'assistant') return [];

    const sourceMatches = content.match(/(?:Sources|References)(?:\s*\([^\n\)]*\))?\s*:\n([\s\S]*?)(?:\n{2,}|$)/i);
    if (!sourceMatches) return [];

    const urlLines = sourceMatches[1]
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('-'));

    return urlLines
      .map((line: string) => {
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
        // Generate title from URL path
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
  }, [content, role]);

  // Extract search query from content
  const searchQuery = useMemo(() => {
    if (role !== 'assistant' || extractedSources.length === 0) return '';
    // Try to extract the topic from the first line or heading
    const firstLine = content.split('\n')[0];
    const topicMatch = firstLine.match(/(?:about|from|regarding|for)\s+(?:the\s+)?(.+?)(?:\.|,|:|\n|$)/i);
    if (topicMatch) return topicMatch[1].trim();
    // Fallback: extract key topics from content
    const topicWords = content.match(/\*\*([^*]+)\*\*/g)?.slice(0, 3).map(s => s.replace(/\*\*/g, '')).join(', ');
    return topicWords || 'Search results';
  }, [content, role, extractedSources]);

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

  const processedContent = useMemo(() => {
    if (!content) return '';

    let fixed = content;

    fixed = unescapeHtml(fixed);

    if (role !== 'assistant') {
      return fixed;
    }

    const isSearchResult = fixed.startsWith('[SEARCH_RESULTS]');

    if (isSearchResult) {
      fixed = fixed.replace('[SEARCH_RESULTS] ', '');
      fixed = fixed
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        .replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/?p>/g, '\n\n')
        .replace(/<\/?[^>]+(>|$)/g, '');
    }

    fixed = fixed.replace(/<thought>([\s\S]*?)<\/thought>/g, '\n> **Thinking Process:**\n> $1\n');

    fixed = fixed.replace(/(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*{0,3}\s*)?(?:\d+\.\s*)?(?:#+\s*)?(?:Sources|References)\b[^\n]*\n([\s\S]*?)(?=\n{2,}|$)/gi, '');

    fixed = fixed.replace(/^\s*[-*]?\s*\[source\s*\d+\]\s*$/gim, '');
    fixed = fixed.replace(/^\s*[-*]\s*\[source\s*\d+\]\s*$/gim, '');
    fixed = fixed.replace(/^\s*[-*]\s*[-*]\s*\[?\d+\]?\s*$/gim, '');
    fixed = fixed.replace(/^\s*[-*]\s*[-*]\s*\[source\s*\d+\]\s*$/gim, '');

    fixed = fixed.replace(/\[(\d+)\]/g, '');

    fixed = normalizeNumberedBulletsToOrdered(fixed);

    return normalizeInlinePipeTables(fixed);
  }, [content, role]);

  if (!content) {
    return null;
  }

  const handleContextView = async () => {
    if (!messageId || !chatId) return;

    try {
      const response = await chatService.getMessageContext(chatId, messageId);
      setContextData(response.data);
      setContextOpen(true);
    } catch (err) {
      console.error('Error fetching message context:', err);
    }
  };

  const handleCloseContext = () => {
    setContextOpen(false);
  };

  const isAutomationPlan = content.startsWith('[AUTOMATION_PLAN]');

  if (isAutomationPlan) {
    try {
      const planData = JSON.parse(content.replace('[AUTOMATION_PLAN]\n', ''));
      return (
        <>
          <div className="automation-plan-container">
            <div className="plan-header">
              <div className="plan-title">🤖 Web Automation Plan</div>
              <div className="plan-description">{planData.task_description}</div>
            </div>

            {planData.steps && planData.steps.length > 0 && (
              <div className="plan-steps">
                <div className="steps-title">Execution Steps:</div>
                {planData.steps.map((step: any, index: number) => (
                  <div key={step.id || index} className="plan-step">
                    <div className="step-number">{step.id || index + 1}</div>
                    <div className="step-content">
                      <div className="step-description">{step.description}</div>
                      <div className="step-action">Action: {step.action}</div>
                      {step.details && (
                        <div className="step-details">
                          {Object.entries(step.details).map(([key, value]) => (
                            <span key={key} className="step-detail">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`step-status ${step.status}`}>{step.status}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="plan-actions">
              <button
                className="automation-launch-btn"
                onClick={() => {
                  const sid = (planData && typeof planData.session_id === 'string' && planData.session_id) ? planData.session_id : undefined;
                  const url = (planData && typeof planData.url === 'string' && planData.url) ? planData.url : undefined;
                  window.dispatchEvent(new CustomEvent('automation:show', { detail: { force: true } }));
                  window.dispatchEvent(new CustomEvent('automation:start', { detail: { force: true, sessionId: sid, url } }));
                }}
              >
                🚀 Launch Web Automation Window
              </button>
            </div>
          </div>

          <style>{`
            .automation-plan-container {
              background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
              border-radius: 12px;
              padding: 20px;
              margin: 10px 0;
              border: 1px solid #3b82f6;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
            }
            
            .plan-header {
              margin-bottom: 16px;
            }
            
            .plan-title {
              font-size: 18px;
              font-weight: 600;
              color: white;
              margin-bottom: 8px;
            }
            
            .plan-description {
              color: #e2e8f0;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .plan-steps {
              margin: 16px 0;
            }
            
            .steps-title {
              font-weight: 600;
              color: white;
              margin-bottom: 12px;
              font-size: 16px;
            }
            
            .plan-step {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.08);
              border-radius: 8px;
              border-left: 3px solid #3b82f6;
            }
            
            .step-number {
              background: #3b82f6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              flex-shrink: 0;
            }
            
            .step-content {
              flex: 1;
            }
            
            .step-description {
              color: white;
              font-weight: 500;
              margin-bottom: 4px;
            }
            
            .step-action {
              color: #cbd5e1;
              font-size: 12px;
              margin-bottom: 4px;
            }
            
            .step-details {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }
            
            .step-detail {
              background: rgba(255, 255, 255, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              color: #e2e8f0;
            }
            
            .step-status {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
              text-transform: uppercase;
            }
            
            .step-status.pending {
              background: rgba(251, 191, 36, 0.2);
              color: #fbbf24;
              border: 1px solid #fbbf24;
            }
            
            .step-status.running {
              background: rgba(59, 130, 246, 0.2);
              color: #3b82f6;
              border: 1px solid #3b82f6;
            }
            
            .step-status.completed {
              background: rgba(34, 197, 94, 0.2);
              color: #22c55e;
              border: 1px solid #22c55e;
            }
            
            .plan-actions {
              margin-top: 16px;
              display: flex;
              justify-content: center;
            }
            
            .automation-launch-btn {
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              font-size: 14px;
            }
            
            .automation-launch-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
            }
          `}</style>
        </>
      );
    } catch (error) {
      console.error('Failed to parse automation plan:', error);
    }
  }

  return (
    <>
      {/* Show SearchResultsCard for responses with sources */}
      {role === 'assistant' && extractedSources.length > 0 && (
        <SearchResultsCard
          query={searchQuery}
          sources={extractedSources}
          resultsCount={extractedSources.length}
        />
      )}

      <div className="markdown-content">
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {(() => {
              const segments = splitByArtifactTokens(processedContent);
              return segments.map((seg, idx) => {
                if (seg.type === 'token') {
                  return <ArtifactEmbed key={`art-${idx}`} tokenType={seg.tokenType!} shortId={seg.shortId!} />;
                }
                return (
                  <ReactMarkdown
                    key={`md-${idx}`}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="message-heading-1">{children}</h1>,
                      h2: ({ children }) => <h2 className="message-heading-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="message-heading-3">{children}</h3>,
                      h4: ({ children }) => <h4 className="message-heading-3">{children}</h4>,
                      h5: ({ children }) => <h5 className="message-heading-3">{children}</h5>,
                      h6: ({ children }) => <h6 className="message-heading-3">{children}</h6>,
                      ul: ({ children }) => <ul className="message-list">{children}</ul>,
                      ol: ({ children }) => <ol className="message-ordered-list">{children}</ol>,
                      li: ({ children }) => <li className="message-list-item">{children}</li>,
                      code: ({ children, className, inline, node, ...props }: any) => {
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
                      pre: ({ children }) => <>{children}</>,
                      table: ({ children }) => (
                        <div className="message-table-wrapper">
                          <table className="message-table">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="message-table-header">{children}</thead>,
                      tbody: ({ children }) => <tbody className="message-table-body">{children}</tbody>,
                      tr: ({ children }) => <tr className="message-table-row">{children}</tr>,
                      td: ({ children }) => <td className="message-table-cell">{children}</td>,
                      th: ({ children }) => <th className="message-table-header-cell">{children}</th>,
                      p: ({ children }) => <p className="message-paragraph">{children}</p>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="message-link">{children}</a>,
                      em: ({ children }) => <em className="message-emphasis">{children}</em>,
                      strong: ({ children }) => <strong className="message-strong">{children}</strong>,
                      hr: () => <hr className="message-hr" />,
                      blockquote: ({ children }) => <blockquote className="message-blockquote" style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem', color: '#a5b4fc', fontStyle: 'italic', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px' }}>{children}</blockquote>,
                    }}
                  >
                    {seg.text!}
                  </ReactMarkdown>
                );
              });
            })()}
          </div>
          {role === 'assistant' && contextQuality !== undefined && (
            <MessageContextIndicator
              quality={contextQuality}
              state={contextState}
              onClick={messageId && chatId ? handleContextView : undefined}
            />
          )}
        </Box>
      </div>

      {/* Context Viewer Modal */}
      <Modal
        open={contextOpen}
        onClose={handleCloseContext}
        aria-labelledby="message-context-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          outline: 'none'
        }}>
          {contextData ? (
            <ContextViewer
              quality={contextData.quality}
              layers={contextData.layers}
              onClose={handleCloseContext}
            />
          ) : (
            <Box sx={{ bgcolor: '#1e1e2f', color: '#fff', p: 4, borderRadius: 2 }}>
              Loading context information...
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default MessageFormatter;
