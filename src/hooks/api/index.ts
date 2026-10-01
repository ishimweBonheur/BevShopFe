
import { storage } from '@/utils';
import axios from 'axios';

const configuredServerUrl = process.env.REACT_APP_SERVER_URL || 'https://bev-shop-be.vercel.app';

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

api.interceptors.response.use(response=>response,error=>{
 if(error.response?.status===401 && !error.config?.url?.includes('/auth/login')) { storage.removeToken(); localStorage.removeItem('Farm_user'); if(window.location.pathname!=='/login') window.location.assign('/login'); }
 return Promise.reject(error);
});
