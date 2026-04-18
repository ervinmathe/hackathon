import axios from 'axios';

// Get backend URL from .env (VITE_ prefixed vars are accessible)
// If VITE_API_BASE_URL is not set, use a relative base URL so requests go to the same origin.
const rawBaseURL = import.meta.env.VITE_API_BASE_URL ?? '';
const baseURL = rawBaseURL ? rawBaseURL.replace(/\/$/, '') : '';

const api = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export default api;
