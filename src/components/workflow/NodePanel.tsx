import React, { useState, useEffect, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { NodePanelProps } from '../../types/workflow';
import { skillService } from '../../services/api/skill.service';
import type { Skill } from '../../types/skill';

const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
};

type IntegrationActionParam = {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
};

type IntegrationAction = {
  name: string;
  description?: string;
  params?: IntegrationActionParam[];
};

type IntegrationDefinition = {
  name: string;
  description?: string;
  icon?: string;
  requiredCredentials?: string[];
  actions?: IntegrationAction[];
};

type MCPServerDefinition = {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  server_url?: string;
  supported_tools?: string[];
  enabled?: boolean;
  status?: string;
};

type StartSchemaInputField = {
  name: string;
  type: string;
  required: boolean;
  defaultValue: any;
  description: string;
};

type StartSchemaField = StartSchemaInputField & {
  key: string;
};

interface ExtendedNodePanelProps extends NodePanelProps {
  onDelete: () => void;
}

export function NodePanel({ nodeId, data, onUpdate, onClose, onDelete }: ExtendedNodePanelProps) {
  const [config, setConfig] = useState(data.config || {});
  const nodeType = String(data.nodeType || '');
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [integrationCatalog, setIntegrationCatalog] = useState<IntegrationDefinition[]>([]);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServerDefinition[]>([]);
  const [mcpLoading, setMcpLoading] = useState(false);

  const sizeMin = (() => {
    const presets: Record<string, { w: number; h: number }> = {
      start: { w: 120, h: 48 },
      end: { w: 120, h: 48 },
      'webhook-trigger': { w: 140, h: 52 },
      'schedule-trigger': { w: 140, h: 52 },
      agent: { w: 180, h: 58 },
      'mcp-tool': { w: 170, h: 56 },
      transform: { w: 165, h: 54 },
      'if-else': { w: 165, h: 54 },
      condition: { w: 165, h: 54 },
      while: { w: 170, h: 56 },
      loop: { w: 170, h: 56 },
      approval: { w: 165, h: 54 },
      note: { w: 180, h: 64 },
      guardrail: { w: 165, h: 54 },
      guardrails: { w: 165, h: 54 },
      'set-state': { w: 165, h: 54 },
      'file-search': { w: 165, h: 54 },
      integration: { w: 165, h: 54 },
    };
    return presets[nodeType] || { w: 165, h: 54 };
  })();

  useEffect(() => {
    setConfig(data.config || {});
  }, [nodeId, data.config]);

  useEffect(() => {
    if (nodeType !== 'agent') return;
    setSkillsLoading(true);
    skillService.listSkills(true)
      .then((res) => {
        const list = (res as any)?.data;
        if (Array.isArray(list)) {
          setAvailableSkills(list);
        } else {
          setAvailableSkills([]);
        }
      })
      .catch(() => {
        setAvailableSkills([]);
      })
      .finally(() => {
        setSkillsLoading(false);
      });
  }, [nodeType, nodeId]);

  useEffect(() => {
    if (nodeType !== 'integration') return;
    let cancelled = false;
    setIntegrationLoading(true);
    fetch(apiUrl('/api/workflows/integrations/available'), { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray((payload as any)?.integrations) ? (payload as any).integrations : [];
        setIntegrationCatalog(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (cancelled) return;
        setIntegrationCatalog([]);
      })
      .finally(() => {
        if (!cancelled) {
          setIntegrationLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nodeType, nodeId]);

  useEffect(() => {
    if (nodeType !== 'mcp-tool' && nodeType !== 'mcp') return;
    let cancelled = false;
    setMcpLoading(true);
    fetch(apiUrl('/api/tools/mcp/servers'), { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (cancelled) return;
        const list = Array.isArray((payload as any)?.servers) ? (payload as any).servers : [];
        setMcpServers(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (cancelled) return;
        setMcpServers([]);
      })
      .finally(() => {
        if (!cancelled) {
          setMcpLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nodeType, nodeId]);

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  const startSchemaFields = useMemo<StartSchemaField[]>(() => {
    const schemaFields = Array.isArray((config as any)?.inputSchema?.fields)
      ? ((config as any).inputSchema.fields as StartSchemaInputField[])
      : [];
    if (schemaFields.length > 0) {
      return schemaFields.map((field, index) => ({
        key: String(field?.name || `field_${index}`),
        name: String(field?.name || ''),
        type: String(field?.type || 'string'),
        required: Boolean(field?.required),
        defaultValue: field?.defaultValue ?? '',
        description: String(field?.description || ''),
      }));
    }
    const vars = Array.isArray((config as any)?.inputVariables)
      ? ((config as any).inputVariables as any[])
      : [];
    return vars
      .map((name: any, index: number): StartSchemaField | null => {
        const normalized = String(name || '').trim();
        if (!normalized) return null;
        return {
          key: `${normalized}_${index}`,
          name: normalized,
          type: 'string',
          required: false,
          defaultValue: '',
          description: '',
        };
      })
      .filter(Boolean) as StartSchemaField[];
  }, [config]);

  const syncStartSchemaFields = (fields: StartSchemaInputField[]) => {
    const cleaned = fields
      .map((field) => ({
        name: String(field.name || '').trim(),
        type: String(field.type || 'string').trim(),
        required: Boolean(field.required),
        defaultValue: field.defaultValue,
        description: String(field.description || '').trim(),
      }))
      .filter((field) => field.name.length > 0);
    const inputVariables = cleaned.map((field) => field.name);
    handleConfigChange('inputVariables', inputVariables);
    handleConfigChange('inputSchema', { fields: cleaned });
  };

  const selectedIntegration = useMemo(() => {
    return integrationCatalog.find((item) => String(item?.name) === String((config as any)?.integration || '')) || null;
  }, [integrationCatalog, config]);

  const integrationActions = useMemo(() => {
    return Array.isArray(selectedIntegration?.actions) ? selectedIntegration.actions : [];
  }, [selectedIntegration]);

  const selectedIntegrationAction = useMemo(() => {
    const configuredAction = String((config as any)?.action || (config as any)?.integrationAction || '');
    return integrationActions.find((action) => String(action?.name) === configuredAction) || null;
  }, [integrationActions, config]);

  const selectedMcpServer = useMemo(() => {
    const selectedValue = String((config as any)?.mcpServer || '');
    if (!selectedValue) return null;
    return (
      mcpServers.find(
        (server) =>
          String(server?.id || '') === selectedValue ||
          String(server?.name || '') === selectedValue
      ) || null
    );
  }, [config, mcpServers]);

  const mcpConnectorOptions = useMemo(() => {
    const dynamicOptions = mcpServers.map((server) => {
      const value = String(server?.id || server?.name || '');
      const baseLabel = String(server?.display_name || server?.name || value);
      const suffix = server?.enabled === false ? ' (disabled)' : '';
      return {
        value,
        label: `${baseLabel}${suffix}`,
      };
    });

    const fallbackOptions = [
      { value: 'stagehand', label: 'Stagehand' },
      { value: 'playwright_mcp', label: 'Playwright MCP' },
      { value: 'claude_computer_use', label: 'Claude Computer Use' },
      { value: 'gemini_computer_use', label: 'Gemini Computer Use' },
      { value: 'e2b_stagehand', label: 'E2B Stagehand' },
    ];

    const configured = String((config as any)?.mcpServer || '').trim();
    const combined = [...dynamicOptions, ...fallbackOptions];
    if (configured && !combined.some((item) => item.value === configured)) {
      combined.unshift({ value: configured, label: configured });
    }

    const seen = new Set<string>();
    return combined.filter((item) => {
      const key = String(item.value || '').trim();
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [config, mcpServers]);

  const mcpToolOptions = useMemo(() => {
    const rawTools = selectedMcpServer?.supported_tools;
    if (!Array.isArray(rawTools)) return [];
    return rawTools
      .map((tool) => String(tool || '').trim())
      .filter(Boolean);
  }, [selectedMcpServer]);

  const integrationParams = useMemo(() => {
    const directParams = (config as any)?.params;
    if (directParams && typeof directParams === 'object' && !Array.isArray(directParams)) return directParams;
    const legacyParams = (config as any)?.integrationParams;
    if (legacyParams && typeof legacyParams === 'object' && !Array.isArray(legacyParams)) return legacyParams;
    return {};
  }, [config]);

  const setIntegrationParams = (nextParams: Record<string, any>) => {
    handleConfigChange('params', nextParams);
    handleConfigChange('integrationParams', nextParams);
  };

  const updateIntegrationParam = (paramName: string, value: any) => {
    const nextParams = { ...(integrationParams || {}), [paramName]: value };
    setIntegrationParams(nextParams);
  };

  const toJsonText = (value: any) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '';
    }
  };

  const setCredentialValue = (credentialName: string, value: string) => {
    const current = (config as any)?.credentials;
    const credentials = current && typeof current === 'object' ? current : {};
    handleConfigChange('credentials', { ...credentials, [credentialName]: value });
  };

  const parseFieldValue = (rawValue: string, valueType: string) => {
    const type = String(valueType || 'string').toLowerCase();
    if (type === 'number' || type === 'integer') {
      if (rawValue === '') return '';
      const n = Number(rawValue);
      if (!Number.isFinite(n)) return rawValue;
      return type === 'integer' ? Math.trunc(n) : n;
    }
    if (type === 'boolean') {
      if (rawValue === 'true') return true;
      if (rawValue === 'false') return false;
      return rawValue;
    }
    if (type === 'array' || type === 'object' || type === 'json') {
      if (!rawValue.trim()) return '';
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    }
    return rawValue;
  };

  useEffect(() => {
    if (nodeType !== 'integration') return;
    const selectedName = String((config as any)?.integration || '');
    if (!selectedName) return;
    const selected = integrationCatalog.find((item) => String(item?.name) === selectedName);
    if (!selected) return;
    const actions = Array.isArray(selected.actions) ? selected.actions : [];
    if (actions.length === 0) return;
    const configuredAction = String((config as any)?.action || (config as any)?.integrationAction || '');
    const matches = actions.some((action) => String(action?.name) === configuredAction);
    if (matches) return;
    const fallbackAction = String(actions[0]?.name || '');
    if (!fallbackAction) return;
    handleConfigChange('action', fallbackAction);
    handleConfigChange('integrationAction', fallbackAction);
  }, [nodeType, config, integrationCatalog]);

  useEffect(() => {
    return () => {
      setConfig({});
    };
  }, []);

  return (
    <div
      style={{
        width: '360px',
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>{data.label}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Node Size</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Width (px)</div>
              <input
                type="number"
                value={typeof (config as any).nodeWidth === 'number' ? (config as any).nodeWidth : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const n = val === '' ? undefined : Number(val);
                  handleConfigChange('nodeWidth', typeof n === 'number' && isFinite(n) ? Math.max(sizeMin.w, n) : undefined);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="Auto"
                min={sizeMin.w}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>Height (px)</div>
              <input
                type="number"
                value={typeof (config as any).nodeHeight === 'number' ? (config as any).nodeHeight : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const n = val === '' ? undefined : Number(val);
                  handleConfigChange('nodeHeight', typeof n === 'number' && isFinite(n) ? Math.max(sizeMin.h, n) : undefined);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="Auto"
                min={sizeMin.h}
              />
            </div>
          </div>
        </div>
        {nodeType === 'start' && (
          <div>
            {/* START NODE CONFIGURATION GUIDE:
                The START node defines the entry point of your workflow and accepts user input.
                
                HOW TO USE:
                1. Define input variables that users will provide when the workflow runs
                2. Each variable should be on a new line (e.g., "user_query", "website_url", "api_key")
                3. These variables can be referenced in agent nodes using {{variable_name}} syntax
                4. The agent chat interface will prompt users for these values when execution starts
                
                EXAMPLE CONFIGURATION:
                - user_query (for user's question or instruction)
                - target_url (for website to process)
                - options (for additional parameters)
            */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>ℹ️ START NODE GUIDE</div>
              <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: '1.5' }}>
                Define input variables that users will provide when running the workflow.
                Each variable on a new line. Reference them in agents using {'{'}{'{'}<i>variable_name</i>{'}'}{'}'}.
              </div>
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Input Variables (one per line)
            </label>
            <textarea
              value={(config.inputVariables as string[])?.join('\n') || ''}
              onChange={(e) => {
                const vars = e.target.value
                  .split('\n')
                  .map((v) => String(v || '').trim())
                  .filter(Boolean);
                const nextFields = vars.map((name) => {
                  const existing = startSchemaFields.find((f) => String(f.name) === name);
                  if (existing) {
                    return {
                      name,
                      type: existing.type,
                      required: existing.required,
                      defaultValue: existing.defaultValue,
                      description: existing.description,
                    };
                  }
                  return {
                    name,
                    type: 'string',
                    required: false,
                    defaultValue: '',
                    description: '',
                  };
                });
                syncStartSchemaFields(nextFields);
              }}
              style={{
                width: '100%',
                minHeight: '100px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="user_query\ntarget_url\napi_key\noptions"
            />
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 6 }}>
              💡 Tip: Common variables include "user_query", "url", "data", "config"
            </div>
            <div style={{ marginTop: 16, padding: 12, borderRadius: 6, border: '1px solid #334155', backgroundColor: '#111827' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 12 }}>
                  Typed Input Schema
                </label>
                <button
                  onClick={() => {
                    const nextFields = [
                      ...startSchemaFields.map((field) => ({
                        name: field.name,
                        type: field.type,
                        required: field.required,
                        defaultValue: field.defaultValue,
                        description: field.description,
                      })),
                      {
                        name: '',
                        type: 'string',
                        required: false,
                        defaultValue: '',
                        description: '',
                      }
                    ];
                    syncStartSchemaFields(nextFields);
                  }}
                  style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #475569',
                    borderRadius: 4,
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    fontSize: 11,
                  }}
                >
                  Add Field
                </button>
              </div>
              {startSchemaFields.length === 0 && (
                <div style={{ color: '#64748b', fontSize: 11 }}>
                  Add schema fields to validate and coerce run-time inputs.
                </div>
              )}
              {startSchemaFields.map((field, index) => (
                <div key={field.key} style={{ border: '1px solid #334155', borderRadius: 6, padding: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const next = [...startSchemaFields];
                        next[index] = { ...field, name: e.target.value };
                        syncStartSchemaFields(next.map((item) => ({
                          name: item.name,
                          type: item.type,
                          required: item.required,
                          defaultValue: item.defaultValue,
                          description: item.description,
                        })));
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '8px',
                        fontSize: 12,
                      }}
                      placeholder="field_name"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const next = [...startSchemaFields];
                        next[index] = { ...field, type: e.target.value };
                        syncStartSchemaFields(next.map((item) => ({
                          name: item.name,
                          type: item.type,
                          required: item.required,
                          defaultValue: item.defaultValue,
                          description: item.description,
                        })));
                      }}
                      style={{
                        width: 120,
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '8px',
                        fontSize: 12,
                      }}
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="integer">integer</option>
                      <option value="boolean">boolean</option>
                      <option value="array">array</option>
                      <option value="object">object</option>
                      <option value="json">json</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          const next = [...startSchemaFields];
                          next[index] = { ...field, required: e.target.checked };
                          syncStartSchemaFields(next.map((item) => ({
                            name: item.name,
                            type: item.type,
                            required: item.required,
                            defaultValue: item.defaultValue,
                            description: item.description,
                          })));
                        }}
                        style={{ width: 14, height: 14 }}
                      />
                      Required
                    </label>
                    <button
                      onClick={() => {
                        const next = startSchemaFields.filter((_, i) => i !== index);
                        syncStartSchemaFields(next.map((item) => ({
                          name: item.name,
                          type: item.type,
                          required: item.required,
                          defaultValue: item.defaultValue,
                          description: item.description,
                        })));
                      }}
                      style={{
                        marginLeft: 'auto',
                        backgroundColor: 'transparent',
                        border: '1px solid #7f1d1d',
                        borderRadius: 4,
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '3px 8px',
                        fontSize: 11,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  {(field.type === 'array' || field.type === 'object' || field.type === 'json') ? (
                    <textarea
                      value={toJsonText(field.defaultValue)}
                      onChange={(e) => {
                        const next = [...startSchemaFields];
                        next[index] = { ...field, defaultValue: parseFieldValue(e.target.value, field.type) };
                        syncStartSchemaFields(next.map((item) => ({
                          name: item.name,
                          type: item.type,
                          required: item.required,
                          defaultValue: item.defaultValue,
                          description: item.description,
                        })));
                      }}
                      style={{
                        width: '100%',
                        minHeight: 64,
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '8px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        marginBottom: 8,
                      }}
                      placeholder={field.type === 'array' ? '["item"]' : '{"key":"value"}'}
                    />
                  ) : (
                    <input
                      type="text"
                      value={field.defaultValue === undefined || field.defaultValue === null ? '' : String(field.defaultValue)}
                      onChange={(e) => {
                        const next = [...startSchemaFields];
                        next[index] = { ...field, defaultValue: parseFieldValue(e.target.value, field.type) };
                        syncStartSchemaFields(next.map((item) => ({
                          name: item.name,
                          type: item.type,
                          required: item.required,
                          defaultValue: item.defaultValue,
                          description: item.description,
                        })));
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '8px',
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                      placeholder="Default value"
                    />
                  )}
                  <input
                    type="text"
                    value={field.description}
                    onChange={(e) => {
                      const next = [...startSchemaFields];
                      next[index] = { ...field, description: e.target.value };
                      syncStartSchemaFields(next.map((item) => ({
                        name: item.name,
                        type: item.type,
                        required: item.required,
                        defaultValue: item.defaultValue,
                        description: item.description,
                      })));
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: 'white',
                      padding: '8px',
                      fontSize: 12,
                    }}
                    placeholder="Field description"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {nodeType === 'agent' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Prompt</label>
              <textarea
                value={config.prompt || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  resize: 'vertical',
                }}
                placeholder="Enter agent instructions..."
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Skills</label>
              <select
                multiple
                value={Array.isArray((config as any).skillIds)
                  ? ((config as any).skillIds as any[]).map((x: any) => String(x))
                  : (Array.isArray((config as any).skill_ids)
                    ? ((config as any).skill_ids as any[]).map((x: any) => String(x))
                    : [])}
                onChange={(e) => {
                  const ids = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
                  handleConfigChange('skillIds', ids);
                }}
                style={{
                  width: '100%',
                  minHeight: '96px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                disabled={skillsLoading}
              >
                {skillsLoading && (
                  <option value="" disabled>
                    Loading skills...
                  </option>
                )}
                {!skillsLoading && availableSkills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Model</label>
              <select
                value={config.model || 'gpt-4'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <optgroup label="Reasoning Models">
                  <option value="o1">o1 (Advanced Reasoning)</option>
                  <option value="o3-mini">o3-mini (Lightweight Reasoning)</option>
                </optgroup>
                <optgroup label="Agentic Models">
                  <option value="gpt-5">GPT-5 (Most Capable)</option>
                  <option value="gpt-5-mini">GPT-5 Mini (Balanced)</option>
                  <option value="gpt-4o">GPT-4o (Legacy)</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </optgroup>
                <optgroup label="Anthropic">
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </optgroup>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Reasoning Effort</label>
              <select
                value={config.reasoningEffort || 'medium'}
                onChange={(e) => handleConfigChange('reasoningEffort', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="minimum">Minimum (Fastest)</option>
                <option value="low">Low</option>
                <option value="medium">Medium (Recommended)</option>
                <option value="high">High (Complex Tasks)</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Output Format</label>
              <select
                value={config.outputFormat || 'text'}
                onChange={(e) => handleConfigChange('outputFormat', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="widgets">Widgets</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Verbosity</label>
              <select
                value={config.verbosity || 'medium'}
                onChange={(e) => handleConfigChange('verbosity', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="low">Low (Concise)</option>
                <option value="medium">Medium</option>
                <option value="high">High (Detailed)</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.includeChatHistory || false}
                  onChange={(e) => handleConfigChange('includeChatHistory', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Include Chat History
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.writeConversationHistory || false}
                  onChange={(e) => handleConfigChange('writeConversationHistory', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Write Conversation History
              </label>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.showReasoning || false}
                  onChange={(e) => handleConfigChange('showReasoning', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Show Reasoning Summary
              </label>
            </div>
          </>
        )}

        {nodeType === 'transform' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Transform Code (JavaScript)
            </label>
            <textarea
              value={config.code || ''}
              onChange={(e) => handleConfigChange('code', e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="// Transform input data\nreturn input.toUpperCase();"
            />
          </div>
        )}

        {nodeType === 'if-else' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Condition</label>
            <textarea
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="input.value > 100"
            />
          </div>
        )}

        {nodeType === 'while' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Loop Condition</label>
              <textarea
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder="index < array.length"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Iteration Mode</label>
              <select
                value={config.iterationMode || 'sequential'}
                onChange={(e) => handleConfigChange('iterationMode', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="sequential">Sequential (One by One)</option>
                <option value="parallel">Parallel (All at Once)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Max Iterations</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxIterations || 10}
                onChange={(e) => handleConfigChange('maxIterations', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              />
            </div>
          </>
        )}

        {nodeType === 'approval' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Approval Message</label>
              <textarea
                value={config.approvalMessage || ''}
                onChange={(e) => handleConfigChange('approvalMessage', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  resize: 'vertical',
                }}
                placeholder="Please review the results before continuing..."
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.requireMultiLevelApproval || false}
                  onChange={(e) => handleConfigChange('requireMultiLevelApproval', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Require Multi-Level Approval
              </label>
            </div>
            {config.requireMultiLevelApproval && (
              <div>
                <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
                  Approvers (one email per line)
                </label>
                <textarea
                  value={(config.approvers as string[])?.join('\n') || ''}
                  onChange={(e) => handleConfigChange('approvers', e.target.value.split('\n').filter(Boolean))}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                  placeholder="manager@company.com\nfinance@company.com\nlegal@company.com"
                />
              </div>
            )}
          </>
        )}

        {(nodeType === 'mcp-tool' || nodeType === 'mcp') && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Connector</label>
              <select
                value={config.mcpServer || ''}
                onChange={(e) => {
                  const nextServer = e.target.value;
                  handleConfigChange('mcpServer', nextServer);
                  const nextDefinition = mcpServers.find(
                    (server) =>
                      String(server?.id || '') === nextServer ||
                      String(server?.name || '') === nextServer
                  );
                  if (nextDefinition && Array.isArray(nextDefinition.supported_tools) && nextDefinition.supported_tools.length > 0) {
                    const supported = nextDefinition.supported_tools.map((tool) => String(tool || '').trim()).filter(Boolean);
                    const currentTool = String(config.tool || '').trim();
                    if (supported.length > 0 && (!currentTool || !supported.includes(currentTool))) {
                      handleConfigChange('tool', supported[0]);
                    }
                  }
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="">Select connector...</option>
                {mcpConnectorOptions.map((connector) => (
                  <option key={connector.value} value={connector.value}>{connector.label}</option>
                ))}
              </select>
              {mcpLoading && (
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>
                  Loading connectors...
                </div>
              )}
              {selectedMcpServer?.description && (
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 8 }}>
                  {String(selectedMcpServer.description)}
                </div>
              )}
              {selectedMcpServer?.server_url && (
                <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
                  {String(selectedMcpServer.server_url)}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Tool Name</label>
              {mcpToolOptions.length > 0 ? (
                <select
                  value={config.tool || ''}
                  onChange={(e) => handleConfigChange('tool', e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select tool...</option>
                  {mcpToolOptions.map((toolName) => (
                    <option key={toolName} value={toolName}>{toolName}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={config.tool || ''}
                  onChange={(e) => handleConfigChange('tool', e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    padding: '8px',
                    fontSize: 13,
                  }}
                  placeholder="e.g., scrape, search, analyze"
                />
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Action</label>
              <input
                type="text"
                value={(config.toolArgs && typeof config.toolArgs === 'object' ? config.toolArgs.action : '') || ''}
                onChange={(e) => {
                  const currentArgs = config.toolArgs && typeof config.toolArgs === 'object' ? config.toolArgs : {};
                  handleConfigChange('toolArgs', { ...currentArgs, action: e.target.value });
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="run"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Tool Arguments (JSON)</label>
              <textarea
                value={JSON.stringify(config.toolArgs || {}, null, 2)}
                onChange={(e) => {
                  try {
                    handleConfigChange('toolArgs', JSON.parse(e.target.value));
                  } catch {}
                }}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder='{\n  "url": "https://example.com"\n}'
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.approvalRequired !== false}
                  onChange={(e) => handleConfigChange('approvalRequired', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Require Approval Before External Action
              </label>
            </div>
          </>
        )}

        {nodeType === 'guardrail' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Guardrail Type</label>
              <select
                value={config.guardrailType || 'moderation'}
                onChange={(e) => handleConfigChange('guardrailType', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="moderation">Content Moderation</option>
                <option value="pii">PII Detection</option>
                <option value="jailbreak">Jailbreak Detection</option>
                <option value="hallucination">Hallucination Detection</option>
                <option value="custom">Custom Rules</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Rules (one per line)</label>
              <textarea
                value={(config.guardrailRules as string[])?.join('\n') || ''}
                onChange={(e) => handleConfigChange('guardrailRules', e.target.value.split('\n').filter(Boolean))}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder="no profanity\nno personal data\nfact-check against knowledge base"
              />
            </div>
          </>
        )}

        {nodeType === 'set-state' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>State Variable Key</label>
              <input
                type="text"
                value={config.stateKey || ''}
                onChange={(e) => handleConfigChange('stateKey', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="e.g., user_preferences, cart_items"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>State Value (JSON)</label>
              <textarea
                value={typeof config.stateValue === 'object' ? JSON.stringify(config.stateValue, null, 2) : (config.stateValue || '')}
                onChange={(e) => {
                  try {
                    handleConfigChange('stateValue', JSON.parse(e.target.value));
                  } catch {
                    handleConfigChange('stateValue', e.target.value);
                  }
                }}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder='{\n  "theme": "dark",\n  "language": "en"\n}'
              />
            </div>
          </>
        )}

        {nodeType === 'file-search' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Vector Store ID</label>
              <input
                type="text"
                value={config.vectorStoreId || ''}
                onChange={(e) => handleConfigChange('vectorStoreId', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="vs_abc123"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Search Query</label>
              <textarea
                value={config.searchQuery || ''}
                onChange={(e) => handleConfigChange('searchQuery', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  resize: 'vertical',
                }}
                placeholder="Enter search query or use {{variable}}"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Top K Results</label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.topK || 5}
                onChange={(e) => handleConfigChange('topK', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.approvalRequired !== false}
                  onChange={(e) => handleConfigChange('approvalRequired', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Require Approval Before External Action
              </label>
            </div>
          </>
        )}

        {nodeType === 'end' && (
          <div>
            {/* END NODE CONFIGURATION GUIDE:
                The END node marks the completion of your workflow and returns the final result.
                
                HOW TO USE:
                1. Specify which variable from previous nodes should be returned as the final output
                2. The output variable should match a variable name from an agent or transform node
                3. This value will be displayed in the agent chat interface after workflow completion
                4. Common patterns: "final_answer", "processed_data", "result", "summary"
                
                WORKFLOW FLOW:
                START → [Agent Nodes] → END
                - START: Accepts user input
                - AGENT: Processes data and stores in variables
                - END: Returns final result from specified variable
            */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>ℹ️ END NODE GUIDE</div>
              <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: '1.5' }}>
                Specify the variable containing the final result to return to the user.
                This should match a variable name from a previous agent or transform node.
              </div>
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Output Variable
            </label>
            <input
              type="text"
              value={config.outputVariable || ''}
              onChange={(e) => handleConfigChange('outputVariable', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
              }}
              placeholder="result"
            />
            <div style={{ color: '#64748b', fontSize: 10, marginTop: 6 }}>
              💡 Tip: Use variable names like "final_answer", "processed_data", "summary"
            </div>
          </div>
        )}

        {nodeType === 'webhook-trigger' && (
          <div>
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>🔗 WEBHOOK TRIGGER</div>
              <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: '1.5' }}>
                This workflow will be triggered when a POST request is made to the webhook URL.
              </div>
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Webhook Path
            </label>
            <input
              type="text"
              value={config.webhookPath || ''}
              onChange={(e) => handleConfigChange('webhookPath', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                marginBottom: 12,
              }}
              placeholder="/my-webhook"
            />
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Secret (optional)
            </label>
            <input
              type="password"
              value={config.webhookSecret || ''}
              onChange={(e) => handleConfigChange('webhookSecret', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
              }}
              placeholder="webhook-secret-key"
            />
          </div>
        )}

        {nodeType === 'schedule-trigger' && (
          <div>
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>⏰ SCHEDULE TRIGGER</div>
              <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: '1.5' }}>
                This workflow will run automatically based on the cron schedule.
              </div>
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Cron Expression
            </label>
            <input
              type="text"
              value={config.cronExpression || ''}
              onChange={(e) => handleConfigChange('cronExpression', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                marginBottom: 12,
              }}
              placeholder="0 9 * * *"
            />
            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 12 }}>
              Examples: "0 9 * * *" (9am daily), "0 */2 * * *" (every 2 hours), "0 0 * * 1" (Mondays)
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Timezone
            </label>
            <select
              value={config.timezone || 'UTC'}
              onChange={(e) => handleConfigChange('timezone', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
              }}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern (US)</option>
              <option value="America/Chicago">Central (US)</option>
              <option value="America/Los_Angeles">Pacific (US)</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
        )}

        {nodeType === 'integration' && (
          <div>
            <div style={{ 
              backgroundColor: '#1e293b', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>🔌 INTEGRATION NODE</div>
              <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: '1.5' }}>
                Connect to external services like email, Slack, Linear, or make HTTP requests.
              </div>
            </div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Integration
            </label>
            <select
              value={config.integration || ''}
              onChange={(e) => {
                const nextIntegration = e.target.value;
                const nextDefinition = integrationCatalog.find((item) => String(item?.name) === String(nextIntegration));
                const nextActions = Array.isArray(nextDefinition?.actions) ? nextDefinition.actions : [];
                const nextAction = nextActions.length > 0 ? String(nextActions[0]?.name || '') : '';
                handleConfigChange('integration', nextIntegration);
                handleConfigChange('action', nextAction);
                handleConfigChange('integrationAction', nextAction);
                setIntegrationParams({});
              }}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <option value="">Select integration...</option>
              {(integrationCatalog.length > 0
                ? integrationCatalog
                : [
                    { name: 'gmail', description: 'Gmail' },
                    { name: 'google_calendar', description: 'Google Calendar' },
                    { name: 'hubspot', description: 'HubSpot' },
                    { name: 'salesforce', description: 'Salesforce' },
                    { name: 'slack', description: 'Slack' },
                    { name: 'resend', description: 'Resend' },
                    { name: 'linear', description: 'Linear' },
                    { name: 'http', description: 'HTTP Request' },
                  ]
              ).map((integration) => (
                <option key={String(integration.name)} value={String(integration.name)}>
                  {String(integration.description || integration.name)}
                </option>
              ))}
            </select>

            {integrationLoading && (
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>
                Loading integration actions...
              </div>
            )}

            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Action
            </label>
            {integrationActions.length > 0 ? (
              <select
                value={config.action || config.integrationAction || ''}
                onChange={(e) => {
                  handleConfigChange('action', e.target.value);
                  handleConfigChange('integrationAction', e.target.value);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                <option value="">Select action...</option>
                {integrationActions.map((action) => (
                  <option key={String(action.name)} value={String(action.name)}>
                    {String(action.description || action.name)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.action || config.integrationAction || ''}
                onChange={(e) => {
                  handleConfigChange('action', e.target.value);
                  handleConfigChange('integrationAction', e.target.value);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  marginBottom: 12,
                }}
                placeholder="Action name"
              />
            )}

            {selectedIntegrationAction?.description && (
              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>
                {String(selectedIntegrationAction.description)}
              </div>
            )}

            {Array.isArray(selectedIntegration?.requiredCredentials) && selectedIntegration.requiredCredentials.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
                  Credentials
                </label>
                {selectedIntegration.requiredCredentials.map((credentialName) => {
                  const credentialValue = ((config as any)?.credentials && typeof (config as any).credentials === 'object')
                    ? (config as any).credentials[credentialName]
                    : '';
                  const isSensitive = /token|secret|key|password|credential|session/i.test(String(credentialName));
                  return (
                    <div key={String(credentialName)} style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 6 }}>
                        {String(credentialName)}
                      </label>
                      <input
                        type={isSensitive ? 'password' : 'text'}
                        value={credentialValue || ''}
                        onChange={(e) => setCredentialValue(String(credentialName), e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#0a0a0a',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '8px',
                          fontSize: 13,
                        }}
                        placeholder={`Enter ${String(credentialName)}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {selectedIntegrationAction && Array.isArray(selectedIntegrationAction.params) && selectedIntegrationAction.params.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
                  Parameters
                </label>
                {selectedIntegrationAction.params.map((param) => {
                  const paramName = String(param.name || '');
                  if (!paramName) return null;
                  const paramType = String(param.type || 'string').toLowerCase();
                  const currentValue = (integrationParams || {})[paramName];
                  const isJsonType = paramType === 'array' || paramType === 'object' || paramType === 'json';
                  const useTextarea = isJsonType || /body|content|description|notes|text|message|query|prompt/i.test(paramName);

                  return (
                    <div key={paramName} style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 6 }}>
                        {paramName}
                        {param.required ? ' *' : ''}
                        {param.description ? ` — ${String(param.description)}` : ''}
                      </label>

                      {paramType === 'boolean' ? (
                        <select
                          value={currentValue === true ? 'true' : currentValue === false ? 'false' : ''}
                          onChange={(e) => updateIntegrationParam(paramName, parseFieldValue(e.target.value, paramType))}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '8px',
                            fontSize: 13,
                          }}
                        >
                          <option value="">Not set</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : useTextarea ? (
                        <textarea
                          value={isJsonType ? toJsonText(currentValue) : (currentValue === undefined || currentValue === null ? '' : String(currentValue))}
                          onChange={(e) => updateIntegrationParam(paramName, parseFieldValue(e.target.value, paramType))}
                          style={{
                            width: '100%',
                            minHeight: isJsonType ? 90 : 70,
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '8px',
                            fontSize: 13,
                            fontFamily: isJsonType ? 'monospace' : 'inherit',
                            resize: 'vertical',
                          }}
                          placeholder={isJsonType ? (paramType === 'array' ? '["value"]' : '{"key":"value"}') : `Enter ${paramName}`}
                        />
                      ) : (
                        <input
                          type={paramType === 'number' || paramType === 'integer' ? 'number' : 'text'}
                          value={currentValue === undefined || currentValue === null ? '' : String(currentValue)}
                          onChange={(e) => updateIntegrationParam(paramName, parseFieldValue(e.target.value, paramType))}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a0a0a',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '8px',
                            fontSize: 13,
                          }}
                          placeholder={`Enter ${paramName}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#999', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={config.approvalRequired !== false}
                  onChange={(e) => handleConfigChange('approvalRequired', e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Require Approval Before External Action
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
