/**
 * Typed wrappers over the XetaX API — paths and shapes mirror the web panel's
 * Angular services (the source of truth), so the app and the panel always
 * agree with the same backend.
 */
import { api } from '@/lib/api';

// ------------------------------------------------------------------ models

// ------------------------------------------------------------------ helpers
export function fieldOptions(f) {
  if (!f.optionsJson) return [];
  try {
    const parsed = JSON.parse(f.optionsJson);
    if (Array.isArray(parsed)) return parsed.map((o) => typeof o === 'string' ? o : o?.label ?? o?.value ?? String(o));
    return [];
  } catch {return f.optionsJson.split(',').map((s) => s.trim()).filter(Boolean);}
}
/** Best human title for a record: first text-ish field with a value. */
export function recordTitle(r, fields) {
  for (const f of fields) {
    if (['TEXT', 'EMAIL', 'PHONE'].includes(f.fieldType)) {
      const v = r.data?.[f.fieldKey];
      if (v !== undefined && v !== null && String(v).trim()) return String(v);
    }
  }
  const first = Object.values(r.data || {}).find((v) => v !== null && v !== undefined && String(v).trim());
  return first ? String(first) : `Record ${r.id.slice(-6)}`;
}

// ------------------------------------------------------------------ services
export const dashboard = {
  summary: () => api.data('api/dashboard/summary')
};
export const team = {
  me: () => api.data('api/team/me'),
  members: () => api.data('api/team/members'),
  roles: () => api.data('api/team/roles'),
  assignees: () => api.data('api/team/assignees'),
  createMember: (name, email, password, roleId) => api.postData('api/team/members', { name, email, password, roleId })
};
export const forms = {
  list: () => api.data('api/forms'),
  fields: (formId) => api.data(`api/fields/${formId}`),
  stages: (formId) => api.data(`stage/forms/${formId}/stages`)
};
export const records = {
  list: (slug, page = 0, size = 25) => api.data(`api/record/${slug}/all`, { page, size, sort: 'createdAt', direction: 'DESC' }),
  search: (slug, search, page = 0, size = 25) => api.postData(`api/record/${slug}/search`, { search, page, size, sortBy: 'createdAt', direction: 'DESC' }),
  get: (id) => api.data(`api/record/${id}`),
  create: (slug, data) => api.postData(`api/record/${slug}`, { data }),
  update: (id, data) => api.putData(`api/record/${id}/update`, { data }),
  changeStage: (id, stageId) => api.putData(`api/record/${id}/stage/${stageId}`, {}),
  remove: (id) => api.delete(`api/record/${id}/delete`),
  activity: (id) => api.data(`api/record/${id}/activity`)
};
export const tasks = {
  mine: (status) => api.data('api/tasks', { status }),
  forRecord: (recordId) => api.data(`api/tasks/record/${recordId}`),
  create: (input) => api.postData('api/tasks', input),
  setDone: (id, value) => api.postData(`api/tasks/${id}/done`, {}, { value }),
  remove: (id) => api.delete(`api/tasks/${id}`)
};
export const contacts = {
  list: (query = '', page = 0, size = 50) => api.data('api/contacts', { query: query || undefined, page, size }),
  get: (id) => api.data(`api/contacts/${id}`),
  create: (input) => api.postData('api/contacts', input),
  whatsapp: (id, message) => api.post(`api/contacts/${id}/whatsapp`, { message })
};
export const notifications = {
  feed: () => api.data('api/notifications'),
  markRead: (id) => api.post(`api/notifications/${id}/read`, {})
};
/** Where the 9 AM morning digest is delivered — same endpoint as the panel's profile card. */
export const settings = {
  digest: () => api.data('api/settings/digest'),
  saveDigest: (body) => api.putData('api/settings/digest', body)
};
export const whatsapp = {
  config: () => api.data('api/whatsapp/config'),
  conversations: (page = 0, size = 50) => api.data('api/whatsapp/conversations', { page, size }),
  messages: (id, page = 0, size = 50) => api.data(`api/whatsapp/conversations/${id}/messages`, { page, size }),
  templates: () => api.data('api/whatsapp/templates'),
  send: (body) => api.postData('api/whatsapp/messages/send', body),
  /**
   * This month's message counts and what they are estimated to cost, beside
   * WhatsApp's own figures. Read-only: rates and plans are set on the panel.
   */
  usage: () => api.data('api/whatsapp/usage')
};
/**
 * WhatsApp Flows — the forms a customer fills inside the chat.
 *
 * Building one needs a picker, field mapping and sometimes raw JSON, so the
 * app deliberately does not author them: it sends a published Flow to a
 * customer and shows what came back.
 */
export const flows = {
  list: () => api.data('api/whatsapp/flows'),
  get: (id) => api.data(`api/whatsapp/flows/${id}`),
  send: (body) => api.postData('api/whatsapp/flows/send', body),
  responses: (flowId, page = 0, size = 30) =>
  api.data('api/whatsapp/flows/responses', flowId ? { flowId, page, size } : { page, size })
};

export const desk = {
  badge: () => api.data('api/desk/badge'),
  state: () => api.data('api/desk/state'),
  accept: (requestId) => api.postData(`api/desk/requests/${requestId}/accept`, {}),
  decline: (requestId) => api.post(`api/desk/requests/${requestId}/decline`, {}),
  messages: (sessionId, after) => api.data(`api/desk/sessions/${sessionId}/messages`, { after }),
  reply: (sessionId, text) => api.postData(`api/desk/sessions/${sessionId}/messages`, { text }),
  resolve: (sessionId, resumeAi) => api.post(`api/desk/sessions/${sessionId}/resolve`, { resumeAi }),
  recordAi: (recordId) => api.data(`api/desk/records/${recordId}/ai`),
  applySuggestion: (sessionId) => api.post(`api/desk/sessions/${sessionId}/apply-suggestion`, {}),
  dismissSuggestion: (sessionId) => api.post(`api/desk/sessions/${sessionId}/dismiss-suggestion`, {})
};
export const ai = {
  chat: (message, conversationId) => api.post('api/ai/chat', { message, conversationId })
};
export const invoices = {
  list: (page = 0, size = 30) => api.data('api/invoices', { page, size }),
  get: (id) => api.data(`api/invoices/${id}`),
  pdfUrl: (id) => api.url(`api/invoices/${id}/pdf`)
};

/** Bulk email from the org's own SMTP — /api/email/campaigns (same shape as WhatsApp campaigns). */
export const emailCampaigns = {
  status: () => api.data('api/email/campaigns/status'),
  list: (page = 0, size = 30) => api.data('api/email/campaigns', { page, size }),
  get: (id) => api.data(`api/email/campaigns/${id}`),
  create: (input) => api.postData('api/email/campaigns', input),
  start: (id, scheduledAt) => api.postData(`api/email/campaigns/${id}/start`, scheduledAt ? { scheduledAt } : {}),
  pause: (id) => api.postData(`api/email/campaigns/${id}/pause`, {}),
  resume: (id) => api.postData(`api/email/campaigns/${id}/resume`, {}),
  cancel: (id) => api.postData(`api/email/campaigns/${id}/cancel`, {}),
  recipients: (id, status, page = 0, size = 100) => api.data(`api/email/campaigns/${id}/recipients`, { page, size, status: status || undefined })
};
