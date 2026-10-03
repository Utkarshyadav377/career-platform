const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'aci_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: form ? form : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 401 on login/register is just a wrong password, not an expired session.
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized();
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // auth
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
  updateProfile: (b) => request('/auth/profile', { method: 'PUT', body: b }),
  changePassword: (b) => request('/auth/password', { method: 'PUT', body: b }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request(`/auth/reset-password/${token}`, { method: 'POST', body: { password } }),
  // dashboard
  dashboard: () => request('/dashboard'),
  // resume
  uploadResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return request('/resume/upload', { method: 'POST', form });
  },
  resumes: () => request('/resume'),
  deleteResume: (id) => request(`/resume/${id}`, { method: 'DELETE' }),
  // jobs
  matchJob: (b) => request('/jobs/match', { method: 'POST', body: b }),
  matches: () => request('/jobs/matches'),
  applications: () => request('/jobs/applications'),
  createApplication: (b) => request('/jobs/applications', { method: 'POST', body: b }),
  updateApplication: (id, b) => request(`/jobs/applications/${id}`, { method: 'PUT', body: b }),
  deleteApplication: (id) => request(`/jobs/applications/${id}`, { method: 'DELETE' }),
  // interview
  startInterview: (b) => request('/interview/start', { method: 'POST', body: b }),
  answerInterview: (id, answer) => request(`/interview/${id}/answer`, { method: 'POST', body: { answer } }),
  interviews: () => request('/interview'),
  interview: (id) => request(`/interview/${id}`),
  // career
  recommendations: () => request('/career/recommendations', { method: 'POST' }),
};
