import { environment } from '../../environments/environment';

// Normalized base URL for the backend (no trailing slash)
export const API_BASE_URL = environment.apiBaseUrl.replace(/\/$/, '');
export const API_URL = `${API_BASE_URL}/api`;
