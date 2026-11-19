import axios from 'axios';
import type { AxiosInstance } from 'axios';

// Relative path: requests go through the Vite proxy (dev)
// or the Express server (production), so the browser sees one origin
// and sends the admin cookie.
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default apiClient;