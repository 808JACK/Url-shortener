// API Configuration
const API_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (path) => {
  // In development with proxy, use relative paths
  if (import.meta.env.DEV) {
    return path;
  }
  // In production, use full API URL
  return `${API_URL}${path}`;
};

export default API_URL;
