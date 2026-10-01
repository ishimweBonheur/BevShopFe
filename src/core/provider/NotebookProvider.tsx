import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '@/hooks/api';
import { Row } from '@/components/form/AccountingFields';

type Pending = { path: string; body: Row; method: 'post' | 'put'; key: string };
const messages: Record<string, string> = { products: 'Product saved.', categories: 'Category saved.', suppliers: 'Supplier saved.', purchases: 'Purchase saved successfully.', sales: 'Sale recorded successfully.', expenses: 'Expense saved.', 'damaged-items': 'Damaged items recorded.', 'owner-money': 'Owner money saved.' };
const settings = { currency: 'RWF', timezone: 'Africa/Kigali' };
function useStateValue() {
    const location = useLocation();
    const [ready, setReady] = useState(false), [user, setUser] = useState<Row | null>(null), [connectionError, setConnectionError] = useState('');
    const [products, setProducts] = useState<Row[]>([]), [categories, setCategories] = useState<Row[]>([]), [suppliers, setSuppliers] = useState<Row[]>([]);
    const [busy, setBusy] = useState(false), [revision, setRevision] = useState(0);
    const [pending, setPending] = useState<Pending | null>(() => { try { return JSON.parse(sessionStorage.getItem('notebook-pending') || 'null'); } catch { return null; } });
    const active = useRef(false), route = useRef(location.pathname); route.current = location.pathname;
    useEffect(() => { toast.remove('shop-action'); }, [location.pathname]);
    const refresh = useCallback(async () => {
        const [p, c, s] = await Promise.all([api.get('/products'), api.get('/categories'), api.get('/suppliers')]);
        setProducts(p.data); setCategories(c.data); setSuppliers(s.data);
    }, []);
    useEffect(() => { let cancelled = false; api.get('/auth/check').then(async r => { if (cancelled) return; setUser(r.data); await refresh(); }).catch(e => { if (!cancelled && e.response?.status !== 401) setConnectionError('Could not load your shop. Please reload to try again.'); }).finally(() => { if (!cancelled) setReady(true); }); return () => { cancelled = true; }; }, [refresh]);
    async function save(path: string, body: Row, method: 'post' | 'put' = 'post', retry?: Pending) {
        if (active.current) return;
        if (pending && !retry) { toast.error('Confirm your pending entry first.', { id: 'shop-action' }); return; }
        const action = retry || { path, body, method, key: crypto.randomUUID() };
        const origin = route.current; active.current = true; setBusy(true); toast.remove('shop-action');
        try {
            sessionStorage.setItem('notebook-pending', JSON.stringify(action));
            const r = await api[action.method]('/' + action.path, action.body, { headers: { 'Idempotency-Key': action.key } });
            sessionStorage.removeItem('notebook-pending'); setPending(null); setRevision(n => n + 1);
            if (route.current === origin) toast.success(messages[action.path.split('/')[0]] || 'Saved.', { id: 'shop-action', duration: 3500 });
            refresh().catch(() => toast.error('Saved, but the list could not refresh. Please reload.', { id: 'shop-action', duration: 6500 }));
            return r.data;
        } catch (e: any) {
            const uncertain = !e.response || e.response.status >= 500;
            if (uncertain) setPending(action); else { sessionStorage.removeItem('notebook-pending'); setPending(null); }
            if (route.current === origin) toast.error(e.response?.data?.error || 'Connection interrupted. Confirm the entry before trying another.', { id: 'shop-action', duration: 6500 });
        } finally { active.current = false; setBusy(false); }
    }
    return { ready, user, connectionError, products, categories, suppliers, settings, busy, revision, pending, save };
}
const Context = createContext<ReturnType<typeof useStateValue> | null>(null);
export function NotebookProvider({ children }: { children: React.ReactNode }) {
    const value = useStateValue();
    if (!value.ready) return <p className="p-8">Loading your shop...</p>;
    if (value.connectionError) return <div className="p-8 space-y-4"><p role="alert">{value.connectionError}</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button></div>;
    if (!value.user) return <Navigate to="/login" replace />;
    return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useNotebook() { const value = useContext(Context); if (!value) throw Error('NotebookProvider is required'); return value; }
