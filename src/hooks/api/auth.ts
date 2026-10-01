import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { api, queryString } from '.';
import { storage } from '@/utils';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';




export const useLogin = () => {
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    const login = async (credentials: {
        email: string;
        password: string;
    }) => {
        setLoadingLogin(true);
        setLoginError(null);
        try {
            const response = await api.post(`/auth/login`, credentials);
            const { token, user } = response.data;
            storage.setToken(token);
            localStorage.setItem('Farm_user', JSON.stringify(user));
            setLoginSuccess(true);
            toast.success('Login successful');
            return response.data;
        } catch (error: any) {

            const errorMessage =
                error.response?.data?.error ||
                'An error occurred during login.';
            toast.error(errorMessage);
            setLoginError(errorMessage);
        } finally {
            setLoadingLogin(false);
        }
    };

    return {
        loadingLogin,
        login,
        loginSuccess,
        loginError,
    };
};

export const isLoggedIn = () => {
 try { const token=storage.getToken(); if(!token)return false; const decoded:any=jwt_decode(token); if(!decoded.exp || decoded.exp<Date.now()/1000){storage.removeToken();localStorage.removeItem('Farm_user');return false;} return JSON.parse(localStorage.getItem('Farm_user')||'false'); } catch {storage.removeToken();localStorage.removeItem('Farm_user');return false;}
};

