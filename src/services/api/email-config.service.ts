import { api } from './index';

export interface EmailHealth {
  status: string;
  mailgunSigningKeyConfigured: boolean;
  defaultInboundAddress: string;
}

export interface EmailReplyAddress {
  chatId: string;
  baseAddress: string;
  replyAddress: string;
}

export const emailConfigService = {
  async health(): Promise<EmailHealth> {
    const res = await api.get('/api/v1/email/health');
    return res.data;
  },
  async replyAddress(chatId: string, base?: string): Promise<EmailReplyAddress> {
    const params: Record<string, unknown> = { chat_id: chatId };
    if (base) params.base = base;
    const res = await api.get('/api/v1/email/reply-address', { params });
    return res.data;
  },
};
