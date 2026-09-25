import { request, apiUrl, writesEnabled } from "./client.js";

export const chatApi = {
  config() {
    return request("/api/chat/config");
  },

  listThreads() {
    return request("/api/chat/threads");
  },

  send(payload) {
    return request("/api/chat/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  aiSettings() {
    return request("/api/ai/settings");
  },

  openApiDocument() {
    return request("/api/v1/openapi.json");
  },

  routes: Object.freeze({
    thread: (id) => apiUrl(`/api/chat/threads/${encodeURIComponent(id)}`),
    attachment: (id) => apiUrl(`/api/chat/attachments/${encodeURIComponent(id)}`),
    attachments: () => apiUrl("/api/chat/attachments"),
    transcribe: () => apiUrl("/api/chat/transcribe"),
    mcp: () => apiUrl("/mcp"),
  }),

  writesEnabled,
};
