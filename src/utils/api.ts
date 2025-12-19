export const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  return response;
};
