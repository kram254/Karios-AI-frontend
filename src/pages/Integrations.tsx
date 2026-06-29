import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, Plug, PlugZap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface ConnectorDef {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  color: string;
  logo: React.ReactNode;
  configured: boolean; // whether OAuth creds exist in env (set at runtime)
}

const LOGO_SIZE = 'w-10 h-10';

const CONNECTORS: Omit<ConnectorDef, 'configured'>[] = [
  {
    id: 'gmail',
    name: 'Gmail & Google Calendar',
    description: 'Send and read emails, manage calendar events, and schedule meetings directly from your agents.',
    capabilities: ['Send emails', 'Read inbox', 'Create calendar events', 'Search messages'],
    color: '#EA4335',
    logo: (
      <svg className={LOGO_SIZE} viewBox="0 0 48 48" fill="none">
        <path d="M44 8H4C1.8 8 0 9.8 0 12v24c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V12c0-2.2-1.8-4-4-4z" fill="#fff"/>
        <path d="M44 8L24 26 4 8" stroke="#EA4335" strokeWidth="3" fill="none"/>
        <path d="M0 12l14 12L0 36" stroke="#FBBC05" strokeWidth="2" fill="none"/>
        <path d="M48 12L34 24l14 12" stroke="#34A853" strokeWidth="2" fill="none"/>
        <path d="M4 40l14-16 6 5 6-5 14 16" stroke="#4285F4" strokeWidth="2" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post messages, manage channels, and send notifications to your Slack workspace.',
    capabilities: ['Send messages', 'Read channels', 'Post to channels', 'Send DMs'],
    color: '#4A154B',
    logo: (
      <svg className={LOGO_SIZE} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#4A154B"/>
        <path d="M13 30a4 4 0 1 1-4-4h4v4zm2 0a4 4 0 0 1 8 0v10a4 4 0 0 1-8 0V30z" fill="#E01E5A"/>
        <path d="M18 13a4 4 0 1 1 4-4v4h-4zm0 2a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8h10z" fill="#36C5F0"/>
        <path d="M35 18a4 4 0 1 1 4 4h-4v-4zm-2 0a4 4 0 0 1-8 0V8a4 4 0 0 1 8 0v10z" fill="#2EB67D"/>
        <path d="M30 35a4 4 0 1 1-4 4v-4h4zm0-2a4 4 0 0 1 0-8h10a4 4 0 0 1 0 8H30z" fill="#ECB22E"/>
      </svg>
    ),
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, manage deals, and update CRM records with your sales agents.',
    capabilities: ['Manage contacts', 'Create deals', 'Read companies', 'Update pipelines'],
    color: '#FF7A59',
    logo: (
      <svg className={LOGO_SIZE} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#FF7A59"/>
        <circle cx="33" cy="16" r="5" fill="#fff"/>
        <path d="M29 16a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4z" fill="#fff"/>
        <rect x="11" y="22" width="14" height="3" rx="1.5" fill="#fff"/>
        <rect x="11" y="28" width="10" height="3" rx="1.5" fill="#fff"/>
        <rect x="11" y="16" width="12" height="3" rx="1.5" fill="#fff"/>
      </svg>
    ),
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Query and update Salesforce objects, manage leads, opportunities, and accounts.',
    capabilities: ['Query records', 'Create leads', 'Update opportunities', 'Manage accounts'],
    color: '#00A1E0',
    logo: (
      <svg className={LOGO_SIZE} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="10" fill="#00A1E0"/>
        <path d="M20 14c0-3.3 2.7-6 6-6s6 2.7 6 6c1.1-.7 2.4-1 3.8-1C39.7 13 43 16.3 43 20.5c0 3.8-2.7 6.9-6.3 7.4.3.7.5 1.4.5 2.1C37.2 33.3 34.5 36 31.2 36c-.9 0-1.8-.2-2.5-.6-.7 2.3-2.8 4-5.3 4-2.5 0-4.6-1.7-5.3-4-.7.4-1.6.6-2.5.6C12.3 36 9.7 33.4 9.7 30c0-.8.2-1.6.5-2.3C6.8 27 5 24.6 5 21.8 5 18.2 8 15.4 11.7 15.4c1.1 0 2.1.3 3 .7.3-1.1 1-2.1 2-2.8-.5-.8-.7-1.7-.7-2.7z" fill="#fff" opacity=".15"/>
        <path d="M20 14c0-3.3 2.7-6 6-6s6 2.7 6 6c1.1-.7 2.4-1 3.8-1 3.9 0 7 3.1 7 7-.1 3.8-2.8 6.9-6.4 7.4.3.7.4 1.4.4 2.1C36.8 33.3 34.1 36 30.8 36c-.9 0-1.8-.2-2.5-.6-.7 2.3-2.8 4-5.3 4-2.5 0-4.6-1.7-5.3-4-.7.4-1.6.6-2.5.6-3.3 0-6-2.7-6-6 0-.8.2-1.6.5-2.3C6.7 27 5 24.6 5 21.8 5 18.2 7.9 15.4 11.5 15.4c1.1 0 2.1.3 3 .7.3-1.1 1.1-2.1 2.1-2.8-.4-.8-.6-1.7-.6-2.7z" fill="#fff"/>
      </svg>
    ),
  },
];

type StatusMap = Record<string, boolean>;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Integrations() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    setLoadError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connectors/status?user_id=${user.id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      setLoadError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // On mount: check for post-OAuth redirect param
  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected) {
      const name = CONNECTORS.find((c) => c.id === connected)?.name || connected;
      toast.success(`${name} connected successfully`);
      // Remove param from URL without triggering re-render
      window.history.replaceState({}, '', '/integrations');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async (providerId: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to connect integrations');
      return;
    }
    setConnecting(providerId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/connectors/${providerId}/auth?user_id=${user.id}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to start OAuth flow');
      }
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to connect ${providerId}`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (!user?.id) return;
    setDisconnecting(providerId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/connectors/${providerId}/disconnect?user_id=${user.id}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Disconnect failed');
      setStatus((prev) => ({ ...prev, [providerId]: false }));
      const name = CONNECTORS.find((c) => c.id === providerId)?.name || providerId;
      toast.success(`${name} disconnected`);
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PlugZap className="w-7 h-7 text-cyan-400" />
            <h1 className="text-2xl font-bold">Integrations</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Connect your tools and services so Karios AI agents can act on your behalf.
          </p>
        </div>

        {loadError && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <span>{loadError}</span>
            <button type="button" onClick={fetchStatus} className="ml-auto text-xs underline">Retry</button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {CONNECTORS.map((connector) => {
              const isConnected = !!status[connector.id];
              const isConnecting = connecting === connector.id;
              const isDisconnecting = disconnecting === connector.id;

              return (
                <div
                  key={connector.id}
                  className="flex items-start gap-5 p-5 rounded-xl border border-[#2A2A2A] bg-[#161616] hover:border-[#3A3A3A] transition-colors"
                >
                  {/* Logo */}
                  <div className="flex-shrink-0 mt-0.5">{connector.logo}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-white text-sm">{connector.name}</h2>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{connector.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {connector.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="text-xs px-2 py-0.5 rounded-full bg-[#1E1E1E] border border-[#2A2A2A] text-gray-400"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 self-center">
                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(connector.id)}
                        disabled={!!isDisconnecting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3A3A3A] text-sm text-gray-300 hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plug className="w-4 h-4" />
                        )}
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(connector.id)}
                        disabled={!!isConnecting}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm text-white font-medium transition-colors disabled:opacity-50"
                      >
                        {isConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PlugZap className="w-4 h-4" />
                        )}
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="mt-8 text-xs text-gray-600 text-center">
          All credentials are encrypted at rest. Karios AI only requests the minimum scopes needed.
        </p>
      </div>
    </div>
  );
}
