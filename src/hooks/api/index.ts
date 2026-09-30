
import { storage } from '@/utils';
import axios from 'axios';

const configuredServerUrl = process.env.REACT_APP_SERVER_URL || 'https://demostock-be.vercel.app';

// Accept either a server URL or a URL that already ends in `/api` without
// accidentally requesting `/api/api/...`.
export const baseURL = configuredServerUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${baseURL}/api`
});

api.interceptors.request.use(
    (config) => {
      const tokenId = storage.getToken();
      if (tokenId) {
        config.headers.Authorization = `Bearer ${tokenId}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  export const queryString = (query?: string): string => {
    return query ? `?${query}` : '';
};
