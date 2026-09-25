import { request } from "./client.js";

export const plansApi = {
  list() {
    return request("/api/plans");
  },

  categories() {
    return request("/api/plans/categories");
  },

  create(plan) {
    return request("/api/plans", {
      method: "POST",
      body: JSON.stringify(plan),
    });
  },

  update(plan) {
    return request("/api/plans", {
      method: "PUT",
      body: JSON.stringify(plan),
    });
  },

  remove(payload) {
    return request("/api/plans", {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  },
};
