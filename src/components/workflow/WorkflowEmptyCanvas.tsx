import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Workflow, Database, Globe, Cpu } from 'lucide-react';

interface WorkflowEmptyCanvasProps {
  onSelectTemplate: (templateName: string) => void;
  onAskAI: () => void;
}

const TEMPLATES = [
  { name: 'Research workflow', icon: Globe, description: 'Multi-step research and synthesis' },
  { name: 'Data pipeline', icon: Database, description: 'Fetch, transform, validate, analyze' },
  { name: 'Web scraper', icon: Workflow, description: 'Extract and process web data' },
  { name: 'Custom', icon: Cpu, description: 'Start from a blank canvas' },
];

export const WorkflowEmptyCanvas: React.FC<WorkflowEmptyCanvasProps> = ({
  onSelectTemplate,
  onAskAI,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          maxWidth: 540,
          width: '90%',
          pointerEvents: 'auto',
        }}
      >
        {/* Icon + heading */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: 'backOut' }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'rgba(0, 243, 255, 0.12)',
              border: '1px solid rgba(0, 243, 255, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 32px rgba(0, 243, 255, 0.10)',
            }}
          >
            <Workflow size={30} color="#00F3FF" strokeWidth={1.6} />
          </motion.div>

          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
              }}
            >
              Start your workflow
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}
            >
              Pick a template to get started, or let AI build it for you.
            </p>
          </div>
        </div>

        {/* Template chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            width: '100%',
          }}
        >
          {TEMPLATES.map((tpl, i) => {
            const Icon = tpl.icon;
            return (
              <motion.button
                key={tpl.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.32 }}
                onClick={() => onSelectTemplate(tpl.name)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.18s, background 0.18s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 243, 255, 0.35)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 243, 255, 0.07)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(0, 243, 255, 0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                  }}
                >
                  <Icon size={16} color="#00F3FF" strokeWidth={1.8} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#FFFFFF',
                      lineHeight: 1.3,
                    }}
                  >
                    {tpl.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.40)',
                      marginTop: 2,
                      lineHeight: 1.4,
                    }}
                  >
                    {tpl.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'rgba(255,255,255,0.18)',
            fontSize: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
        </div>

        {/* Ask AI CTA */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.32 }}
          onClick={onAskAI}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            padding: '13px 28px',
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%)',
            border: '1px solid rgba(0, 243, 255, 0.35)',
            borderRadius: 12,
            cursor: 'pointer',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 0 24px rgba(0, 243, 255, 0.08)',
            transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.borderColor = 'rgba(0, 243, 255, 0.6)';
            btn.style.boxShadow = '0 0 32px rgba(0, 243, 255, 0.18)';
            btn.style.background = 'linear-gradient(135deg, rgba(0, 243, 255, 0.24) 0%, rgba(139, 92, 246, 0.24) 100%)';
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.borderColor = 'rgba(0, 243, 255, 0.35)';
            btn.style.boxShadow = '0 0 24px rgba(0, 243, 255, 0.08)';
            btn.style.background = 'linear-gradient(135deg, rgba(0, 243, 255, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%)';
          }}
        >
          <Sparkles size={17} color="#00F3FF" strokeWidth={2} />
          Ask AI to build this workflow
        </motion.button>
      </motion.div>
    </div>
  );
};

export default WorkflowEmptyCanvas;
