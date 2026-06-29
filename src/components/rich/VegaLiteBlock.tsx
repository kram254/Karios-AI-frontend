import React, { useMemo } from 'react';
import { VegaLite } from 'react-vega';

type VegaLiteBlockProps = {
  code: string;
};

export const VegaLiteBlock: React.FC<VegaLiteBlockProps> = ({ code }) => {
  const parsed = useMemo(() => {
    try {
      const raw = String(code || '').trim();
      if (!raw) {
        return { spec: null as any, error: 'Invalid vega-lite spec' };
      }
      const spec = JSON.parse(raw);
      if (!spec || typeof spec !== 'object') {
        return { spec: null as any, error: 'Invalid vega-lite spec' };
      }
      if (!spec.config) {
        spec.config = {};
      }
      if (!spec.config.background) {
        spec.config.background = 'transparent';
      }
      if (!spec.config.axis) {
        spec.config.axis = {
          labelColor: '#E2E8F0',
          titleColor: '#E2E8F0',
          gridColor: 'rgba(255,255,255,0.10)',
          domainColor: 'rgba(255,255,255,0.12)',
          tickColor: 'rgba(255,255,255,0.12)'
        };
      }
      if (!spec.config.legend) {
        spec.config.legend = {
          labelColor: '#E2E8F0',
          titleColor: '#E2E8F0'
        };
      }
      return { spec, error: null as string | null };
    } catch (e: any) {
      return { spec: null as any, error: e?.message ? String(e.message) : 'Invalid vega-lite spec' };
    }
  }, [code]);

  return (
    <div className="message-visual-wrapper">
      <div className="message-visual-body">
        {parsed.error || !parsed.spec ? (
          <pre className="message-visual-error">{parsed.error || 'Invalid vega-lite spec'}</pre>
        ) : (
          <VegaLite spec={parsed.spec as any} actions={false} />
        )}
      </div>
    </div>
  );
};

export default VegaLiteBlock;
