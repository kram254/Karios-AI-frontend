import React, { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidConfigured = false;

type MermaidBlockProps = {
  code: string;
};

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const id = useMemo(() => `mmd-${Math.random().toString(16).slice(2)}`, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!mermaidConfigured) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          themeVariables: {
            primaryColor: '#0F1015',
            primaryTextColor: '#E2E8F0',
            primaryBorderColor: 'rgba(255,255,255,0.10)',
            lineColor: 'rgba(0,243,255,0.55)',
            secondaryColor: '#0B0B10',
            tertiaryColor: '#11111A'
          }
        });
        mermaidConfigured = true;
      }
    } catch {
      mermaidConfigured = true;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setError(null);
      if (!containerRef.current) return;
      const input = String(code || '').trim();
      if (!input) return;
      try {
        const { svg } = await mermaid.render(id, input);
        if (cancelled) return;
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ? String(e.message) : 'Failed to render diagram');
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  return (
    <div className="message-visual-wrapper">
      <div className="message-visual-body">
        {error ? (
          <pre className="message-visual-error">{error}</pre>
        ) : (
          <div ref={containerRef} className="message-mermaid" />
        )}
      </div>
    </div>
  );
};

export default MermaidBlock;
