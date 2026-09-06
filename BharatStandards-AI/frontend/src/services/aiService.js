import { apiClient } from './api';

export const aiService = {
  async askCopilot(query, context) {
    const res = await apiClient.post('/ai/chat', { query, context });
    return res.data;
  },
};
