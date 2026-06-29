import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Mail, Copy, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { emailConfigService, EmailHealth } from '../services/api/email-config.service';

export default function EmailConfig() {
  const [health, setHealth] = useState<EmailHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState('');
  const [generated, setGenerated] = useState<{ baseAddress: string; replyAddress: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setHealth(await emailConfigService.health());
    } catch (e) {
      toast.error(`Failed to load: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onGenerate = async () => {
    if (!chatId.trim()) {
      toast.error('Enter a chat ID first');
      return;
    }
    try {
      const r = await emailConfigService.replyAddress(chatId.trim());
      setGenerated({ baseAddress: r.baseAddress, replyAddress: r.replyAddress });
    } catch (e) {
      toast.error(`Generate failed: ${(e as Error).message}`);
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Mail className="w-8 h-8 text-[#00F3FF]" />
              Email Configuration
            </h1>
            <p className="text-gray-400 mt-2">Inbound email routing via Mailgun-shape webhooks.</p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded hover:border-[#00F3FF]/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {health && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
              <div className="text-xs text-gray-500 uppercase mb-1">Signature verification</div>
              <div className="flex items-center gap-2">
                {health.mailgunSigningKeyConfigured ? (
                  <><ShieldCheck className="w-5 h-5 text-green-400" /><span className="text-green-400">Mailgun signing key configured</span></>
                ) : (
                  <><ShieldOff className="w-5 h-5 text-yellow-400" /><span className="text-yellow-400">Not configured (signature checks skipped)</span></>
                )}
              </div>
            </div>
            <div className="p-4 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
              <div className="text-xs text-gray-500 uppercase mb-1">Base inbound address</div>
              <div className="font-mono text-sm text-[#00F3FF]">{health.defaultInboundAddress}</div>
            </div>
          </div>
        )}

        <div className="mb-6 p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <h2 className="text-xl font-semibold mb-3">Webhook Endpoint</h2>
          <p className="text-sm text-gray-400 mb-3">Configure your Mailgun forward route to send POST requests here:</p>
          <div className="flex items-center gap-2 p-3 bg-[#0A0A0A] border border-gray-700 rounded font-mono text-sm">
            <span className="flex-1">{`{your-host}/api/v1/email/inbound`}</span>
            <button onClick={() => onCopy('/api/v1/email/inbound', 'Endpoint')} className="text-gray-400 hover:text-[#00F3FF]">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Accepts <code>application/json</code> or <code>multipart/form-data</code>. Verifies Mailgun signature when{' '}
            <code className="text-[#00F3FF]">MAILGUN_SIGNING_KEY</code> env var is set.
          </p>
        </div>

        <div className="mb-6 p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <h2 className="text-xl font-semibold mb-3">Threading Reply-Address Generator</h2>
          <p className="text-sm text-gray-400 mb-4">
            Generate a uniquely-tagged reply address for a chat ID. When users reply to that address, the message routes back to the same thread.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="chat-uuid-here"
              className="flex-1 bg-[#0A0A0A] border border-gray-700 rounded px-3 py-2 font-mono"
            />
            <button onClick={onGenerate} className="px-4 py-2 bg-[#00F3FF] text-black rounded font-medium">
              Generate
            </button>
          </div>
          {generated && (
            <div className="p-3 bg-[#0A0A0A] border border-[#00F3FF]/40 rounded">
              <div className="text-xs text-gray-500 uppercase mb-1">Threading reply address</div>
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="flex-1 text-[#00F3FF]">{generated.replyAddress}</span>
                <button onClick={() => onCopy(generated.replyAddress, 'Reply address')} className="text-gray-400 hover:text-[#00F3FF]">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Reply emails to this address will be routed back to chat <code className="text-[#00F3FF]">{chatId}</code>.
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded">
          <h2 className="text-xl font-semibold mb-3">Required Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <code className="text-[#00F3FF] font-mono">MAILGUN_SIGNING_KEY</code>
              <span className="text-gray-400">
                — your Mailgun webhook signing key. Without it, signature verification is skipped (development only).
              </span>
            </div>
            <div className="flex items-start gap-3">
              <code className="text-[#00F3FF] font-mono">EMAIL_INBOUND_BASE_ADDRESS</code>
              <span className="text-gray-400">
                — the base address users send to (e.g. <code>agent@yourdomain.com</code>). Threaded replies append <code>+thread-{`{chat_id}`}</code> automatically.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
