import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getApiBaseUrl } from '@/utils/environment.util';
import { clearAuthSession, readAuthSession } from '@/utils/auth-session';

const apiClient: AxiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for token (placeholder for now)
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
let authRedirectPending = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && readAuthSession()) {
      clearAuthSession();
      const path = window.location.pathname + window.location.search;
      if (!authRedirectPending && !path.startsWith('/signin')) {
        authRedirectPending = true;
        const returnParam = encodeURIComponent(path);
        window.location.assign(`/signin?return=${returnParam}`);
      }
    }
    return Promise.reject(error);
  }
);

// Generic response wrapper to match server's ActionRes
export interface ActionRes<T> {
    item: T;
}

export interface ActionReq<T> {
    item: T;
}

export default apiClient;
