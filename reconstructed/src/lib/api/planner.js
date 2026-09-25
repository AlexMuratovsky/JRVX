import { request } from "./client.js";

export const plannerApi = {
  async listEntries() {
    const payload = await request("/api/entries");
    return payload?.entries ?? [];
  },

  createEntry(entry) {
    return request("/api/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  updateEntry(entry) {
    return request("/api/entries", {
      method: "PUT",
      body: JSON.stringify(entry),
    });
  },

  deleteEntry({ id, version, confirmed = true }) {
    return request("/api/entries", {
      method: "DELETE",
      body: JSON.stringify({ id, version, confirmed }),
    });
  },

  context() {
    return request("/api/v1/actions/planner_context", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  setTimeZone(timeZone) {
    return request("/api/v1/actions/set_time_zone", {
      method: "POST",
      body: JSON.stringify({ timeZone }),
    });
  },

  setTaskCompletion({ id, version, completed, occurrenceDate }) {
    return request("/api/v1/actions/set_task_completion", {
      method: "POST",
      body: JSON.stringify({ id, version, completed, occurrenceDate }),
    });
  },

  async dueReminders() {
    const payload = await request("/api/reminders/due");
    return payload?.items ?? [];
  },

  acknowledgeReminder(receiptId) {
    return request("/api/reminders/due", {
      method: "POST",
      body: JSON.stringify({ receiptId }),
    });
  },
};
