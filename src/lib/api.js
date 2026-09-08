import { API_BASE_URL } from './config';
import { storage } from './storage';

/** Normalised API failure — message is always something you can show. */
export class ApiError extends Error {
  status;
  body;
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/** Every XetaX endpoint answers { success, message, data } (ApiResponse). */

/** Spring Data page as the records/list endpoints return it. */

let baseUrl = API_BASE_URL;
let onUnauthorized = null;
let refreshing = null;

export const api = {
  setBaseUrl(url) {baseUrl = url.endsWith('/') ? url : url + '/';},
  getBaseUrl() {return baseUrl;},
  /** Called when a refresh fails — the auth store signs the user out. */
  setUnauthorizedHandler(fn) {onUnauthorized = fn;},

  /** Raw calls (whatever the server returns). */
  get(path, query) {return request('GET', path, undefined, query);},
  post(path, body, query) {return request('POST', path, body, query);},
  put(path, body, query) {return request('PUT', path, body, query);},
  delete(path, query) {return request('DELETE', path, undefined, query);},

  /** Envelope-unwrapping helpers — the common case. */
  async data(path, query) {return unwrap(await request('GET', path, undefined, query));},
  async postData(path, body, query) {return unwrap(await request('POST', path, body, query));},
  async putData(path, body, query) {return unwrap(await request('PUT', path, body, query));},

  url(path, query) {return buildUrl(path, query);}
};

export function unwrap(res) {
  if (res && typeof res === 'object' && 'data' in res && ('success' in res || 'message' in res)) return res.data;
  return res;
}

function buildUrl(path, query) {
  const url = path.startsWith('http') ? path : baseUrl + path.replace(/^\//, '');
  if (!query) return url;
  const qs = Object.entries(query).
  filter(([, v]) => v !== undefined && v !== null && v !== '').
  map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).
  join('&');
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url;
}

const PUBLIC = [/^auth\/v1\/(login|refresh|forgot-password|reset-password|verify-email)/, /^auth\/api\/v1\/users\/register/, /^api\/public\//];

async function request(method, path, body, query, retried = false) {
  const rel = path.replace(/^\//, '');
  const isPublic = PUBLIC.some((re) => re.test(rel));
  const token = isPublic ? null : await storage.getToken();
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(buildUrl(path, query), { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'No internet connection — check your network and try again.');
  }

  const text = await res.text();
  let data = null;
  try {data = text ? JSON.parse(text) : null;} catch {data = text;}

  // Expired access token → one silent refresh, then replay the call.
  if (res.status === 401 && !isPublic && !retried) {
    const fresh = await refreshAccessToken();
    if (fresh) return request(method, path, body, query, true);
    onUnauthorized?.();
    throw new ApiError(401, 'Your session has expired. Please sign in again.', data);
  }
  if (!res.ok) {
    const message =
    data && typeof data === 'object' && (data.message || data.error || data.returnMessage) ||
    `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message), data);
  }
  return data;
}

/** POST /auth/v1/refresh with the stored refresh token; de-duplicated across parallel calls. */
async function refreshAccessToken() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) return null;
      const r = await fetch(buildUrl('auth/v1/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (!r.ok) return null;
      const t = await r.json();
      if (!t?.accessToken) return null;
      await storage.setToken(t.accessToken);
      if (t.refreshToken) await storage.setRefreshToken(t.refreshToken);
      return t.accessToken;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
