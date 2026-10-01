import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputField } from '@/components/input';
import { useLogin } from '@/hooks/api/auth';
import { api } from '@/hooks/api';
import { storage } from '@/utils/storage';
import { useTranslation } from 'react-i18next';
export default function Login() {
    const navigate = useNavigate();
    const { loadingLogin, login, loginError } = useLogin();
    const [credentials, setCredentials] = useState({ email: '', password: '', name: '', setupToken: '' });
    const [setup, setSetup] = useState(false);
    const [checking, setChecking] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { t } = useTranslation();
    useEffect(() => {
        api.get('/auth/setup-status').then(r => setSetup(r.data.needsSetup)).catch(() => setError('Cannot reach the server. Check that the backend is running.')).finally(() => setChecking(false));
    }, []);
    const change = (event: ChangeEvent<HTMLInputElement>) => setCredentials(old => ({ ...old, [event.target.name]: event.target.value }));
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setSaving(true);
        try {
            if (setup) {
                const response = await api.post('/auth/setup', credentials);
                storage.setToken(response.data.token);
                localStorage.setItem('Farm_user', JSON.stringify(response.data.user));
                navigate('/account');
            }
            else {
                const response = await login({ email: credentials.email, password: credentials.password });
                if (response)
                    navigate('/account');
            }
        }
        catch (e: any) {
            setError(e.response?.data?.error || 'Sign-in failed. Please try again.');
        }
        finally {
            setSaving(false);
        }
    }
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-black px-4">
    <div className="bg-white dark:bg-gray-900 shadow-lg rounded-2xl p-8 w-full max-w-md">
      <div className="text-center"><p className="dark:text-white text-3xl text-primary font-bold">My Shop</p><h1 className="mt-6 text-2xl font-bold text-gray-800 dark:text-white">{setup ? 'Create owner account' : 'Welcome back'}</h1><p className="mt-2 text-gray-500">Your daily notebook · RWF</p></div>
      {(error || loginError) && <div role="alert" className="mt-4 rounded bg-danger/10 p-3 text-danger">{error || loginError}</div>}
      <form className="mt-6 space-y-5" onSubmit={submit}><fieldset disabled={checking || saving || loadingLogin} className="space-y-5 disabled:opacity-60">
        {setup && <><InputField type="text" name="name" label="Your name" placeholder="Shop owner" value={credentials.name} onChange={change} required/><InputField type="password" name="setupToken" label="Setup token from the backend .env" placeholder="SETUP_TOKEN" value={credentials.setupToken} onChange={change} required/></>}
        <InputField type="email" name="email" label={t('emailLabel')} placeholder={t('emailLabel')} value={credentials.email} onChange={change} required/>
        <InputField type="password" name="password" label={setup ? 'Password (at least 10 characters)' : t('passwordLabel')} placeholder={t('passwordLabel')} value={credentials.password} onChange={change} required/>
        <button type="submit" className="w-full bg-primary hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition disabled:opacity-50">{checking ? 'Connecting…' : saving || loadingLogin ? t('signingIn') : setup ? 'Create owner account' : t('signIn')}</button>
      </fieldset></form>{!setup&&<Link className="mt-4 block text-primary underline" to="/recover">Forgot password? Use recovery code</Link>}
    </div>
  </div>;
}
