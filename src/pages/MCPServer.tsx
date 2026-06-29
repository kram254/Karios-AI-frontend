import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Cpu, Copy, RefreshCw, Key, ShieldCheck, ShieldOff, Wrench } from 'lucide-react';
import { mcpService, MCPInfo, MCPTool, MCPSkill } from '../services/api/mcp.service';

function generateApiKey(): string {
  const arr = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return 'karios_mcp_' + Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function MCPServer() {
  const [info, setInfo] = useState<MCPInfo | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [skills, setSkills] = useState<MCPSkill[]>([]);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('mcp_api_key') || '');
  const [proposedKey, setProposedKey] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [i, t, s] = await Promise.all([
        mcpService.info(),
        mcpService.listTools(apiKey ? { apiKey } : undefined).catch(() => ({ count: 0, tools: [] })),
        mcpService.listSkills(apiKey ? { apiKey } : undefined).catch(() => ({ count: 0, skills: [] })),
      ]);
      setInfo(i);
      setTools(t.tools);
      setSkills(s.skills);
    } catch (e) {
      toast.error(`Failed to load: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onGenerate = () => {
    setProposedKey(generateApiKey());
  };

  const onSaveKey = () => {
    if (!proposedKey) return;
    localStorage.setItem('mcp_api_key', proposedKey);
    setApiKey(proposedKey);
    setProposedKey('');
    toast.success('API key saved locally. Set MCP_API_KEY on the server to enforce it.');
  };

  const onCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Cpu className="w-8 h-8 text-[#00F3FF]" />
              MCP Server
            </h1>
            <p className="text-gray-400 mt-2">Expose Karios tools to external agents via the Model Context Protocol.</p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded hover:border-[#00F3FF]/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {info && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
              <div className="text-xs text-gray-500 uppercase">Protocol</div>
              <div className="text-lg font-mono text-[#00F3FF]">{info.protocolVersion}</div>
            </div>
            <div className="p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
              <div className="text-xs text-gray-500 uppercase">Server</div>
              <div className="text-lg">{info.serverInfo.name} <span className="text-xs text-gray-500">v{info.serverInfo.version}</span></div>
            </div>
            <div className="p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
              <div className="text-xs text-gray-500 uppercase">Auth</div>
              <div className="flex items-center gap-2">
                {info.authRequired ? (
                  <><ShieldCheck className="w-5 h-5 text-green-400" /><span className="text-green-400">required</span></>
                ) : (
                  <><ShieldOff className="w-5 h-5 text-yellow-400" /><span className="text-yellow-400">open</span></>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Key className="w-5 h-5 text-[#00F3FF]" />
              API Key
            </h2>
            <button onClick={onGenerate} className="text-sm px-3 py-1 bg-[#00F3FF]/20 text-[#00F3FF] rounded hover:bg-[#00F3FF]/30">
              Generate New
            </button>
          </div>
          {apiKey && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase mb-1">Current local key (stored in localStorage)</div>
              <div className="flex items-center gap-2 p-3 bg-[#0A0A0A] border border-gray-700 rounded font-mono text-sm">
                <span className="flex-1 truncate">{apiKey}</span>
                <button onClick={() => onCopy(apiKey, 'API key')} className="text-gray-400 hover:text-[#00F3FF]">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {proposedKey && (
            <div>
              <div className="text-xs text-yellow-400 uppercase mb-1">New key (not yet saved)</div>
              <div className="flex items-center gap-2 p-3 bg-[#0A0A0A] border border-yellow-400/40 rounded font-mono text-sm">
                <span className="flex-1 truncate">{proposedKey}</span>
                <button onClick={() => onCopy(proposedKey, 'Proposed key')} className="text-gray-400 hover:text-[#00F3FF]">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={onSaveKey} className="px-3 py-1 bg-[#00F3FF] text-black rounded text-xs font-medium">
                  Save
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Set <code className="text-[#00F3FF]">MCP_API_KEY={proposedKey.slice(0, 20)}...</code> on the backend server to enforce this key.
              </div>
            </div>
          )}
          {!apiKey && !proposedKey && (
            <div className="text-gray-500 text-sm">No key configured. Click Generate New to create one. Until you set <code className="text-[#00F3FF]">MCP_API_KEY</code> on the server, the MCP endpoints accept any request.</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#00F3FF]" />
              Available Tools <span className="text-sm text-gray-500">({tools.length})</span>
            </h2>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {tools.map((t) => (
                <div key={t.name} className="p-3 bg-[#0A0A0A] border border-gray-800 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[#00F3FF] text-sm">{t.name}</span>
                    {t.metadata.isDestructive && <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">destructive</span>}
                    {t.metadata.requiresApproval && <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">approval</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{t.description}</div>
                  {t.metadata.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {t.metadata.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {tools.length === 0 && <div className="text-gray-500 text-sm">No tools registered yet.</div>}
            </div>
          </div>
          <div className="p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
            <h2 className="text-xl font-semibold mb-4">Available Skills <span className="text-sm text-gray-500">({skills.length})</span></h2>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {skills.map((s) => (
                <div key={s.id} className="p-3 bg-[#0A0A0A] border border-gray-800 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-gray-500">v{s.version}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{s.description}</div>
                  {s.category && <div className="text-xs text-[#00F3FF] mt-1">{s.category}</div>}
                </div>
              ))}
              {skills.length === 0 && <div className="text-gray-500 text-sm">No skills registered yet.</div>}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <div className="text-xs text-gray-500 uppercase mb-2">External Agent Integration</div>
          <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
{`# List available tools
GET  {your-host}/api/v1/mcp/tools  -H 'Authorization: Bearer ${apiKey || 'YOUR_KEY'}'

# Call a tool
POST {your-host}/api/v1/mcp/tools/call
  Headers: Authorization: Bearer ${apiKey || 'YOUR_KEY'}
  Body:    {"name":"web_search","arguments":{"query":"hello"}}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
