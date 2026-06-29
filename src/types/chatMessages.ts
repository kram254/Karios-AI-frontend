import type { Attachment } from "../services/api/chat.service";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date | string;
  created_at?: string;
  chat_id?: string;
  attachments?: Attachment[];
  metadata?: string | Record<string, any>;
}

export interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  created_at?: string;
  updated_at?: string;
  agent_id?: string;
  language?: string;
  chat_type?: string;
  type?: 'internet_search' | string;
  internet_search?: boolean;
}
