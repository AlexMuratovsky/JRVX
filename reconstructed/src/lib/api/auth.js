import { request } from "./client.js";

export const authApi = {
  session() {
    return request("/api/auth/session");
  },

  login({ username, password }) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  register({ username, password, linkExisting = true }) {
    return request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, linkExisting }),
    });
  },

  changePassword({ currentPassword, newPassword }) {
    return request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout() {
    return request("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  linkChatGPT({ password, confirmed = true }) {
    return request("/api/auth/link-chatgpt", {
      method: "POST",
      body: JSON.stringify({ password, confirmed }),
    });
  },
};
