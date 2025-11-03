export const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  return response;
};
