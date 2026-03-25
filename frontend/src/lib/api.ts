const TOKEN_KEY = "pmgps_token";
const SESSION_KEY = "pmgps_session_id";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const setSessionId = (id: string) => localStorage.setItem(SESSION_KEY, id);
export const getSessionId = () => localStorage.getItem(SESSION_KEY);

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const headers = { ...authHeaders(), ...options.headers };
  return fetch(`${API_BASE}${url}`, { ...options, headers });
};
