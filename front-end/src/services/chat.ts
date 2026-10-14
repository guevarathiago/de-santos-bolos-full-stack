import { api } from './api';

export type ChatSource = {
  documentId: string;
  filename: string;
  page?: number;
};

export type ChatReply = {
  answer: string;
  sources: ChatSource[];
};

const CHAT_TIMEOUT_MS = 60000;

export const sendChatMessage = async (message: string) => {
  const { data } = await api.post<ChatReply>('/chat', { message }, { timeout: CHAT_TIMEOUT_MS });
  return data;
};
