import axios from 'axios';

// Get backend URL from .env (VITE_ prefixed vars are accessible)
// Default to localhost:3000 if not set
const rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const baseURL = rawBaseURL.replace(/\/$/, '');

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default api;
