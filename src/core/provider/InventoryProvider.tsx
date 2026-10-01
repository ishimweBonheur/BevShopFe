import React, { createContext, FormEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/hooks/api';
import { storage } from '@/utils/storage';
import { Row, values } from '@/components/form/AccountingFields';
type Action = {
    path: string;
    body: Row;
    method: 'post' | 'put';
};
function useInventoryState() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<Row | null>(null);
    const [setup, setSetup] = useState(false);
    const [ready, setReady] = useState(false);
    const [products, setProducts] = useState<Row[]>([]);
    const [categories, setCategories] = useState<Row[]>([]);
    const [settings, setSettings] = useState<Row>({ currency: 'RWF', timezone: 'Africa/Kigali', target_margin: 20 });
    const [transactions, setTransactions] = useState<Row[]>([]);
    const [suppliers,setSuppliers]=useState<Row[]>([]);
    const [receipt,setReceipt]=useState<Row|null>(null);
    const [reportDate,setReportDate]=useState('');
    const [duplicateProductId,setDuplicateProductId]=useState('');
    const [summary, setSummary] = useState<Row | null>(null);
    const [period, setPeriod] = useState('daily');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState<Action | null>(() => { try {
        return JSON.parse(sessionStorage.getItem('shop-pending-entry') || 'null');
    }
    catch {
        return null;
    } });
    const active = useRef(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [selected, setSelected] = useState('');
    const [packs, setPacks] = useState('1');
    const [cost, setCost] = useState('');
    const [delivery, setDelivery] = useState('0');
    const [cart, setCart] = useState<Row[]>([]);
    const [revision, setRevision] = useState(0);
    const [page, setPage] = useState(1);
    const route = location.pathname.split('/')[2] || '';
    const tab = ({ stock_movement: 'purchases', pos: 'sales', sales: 'history', category: 'categories' } as Record<string, string>)[route] || route || 'dashboard';
    const manager = !!user;
    const product = products.find(p => p.id === selected);
    const refresh = useCallback(async () => {
        const results = await Promise.all([api.get('/products'), api.get('/categories'), api.get('/settings'), api.get(`/transactions?page=${page}`), api.get('/suppliers')]);
        setSuppliers(results[4].data);
        setProducts(results[0].data.list);
        setCategories(results[1].data);
        setSettings(results[2].data);
        setTransactions(results[3].data.list);
    }, [page]);
    useEffect(() => {
        (async () => {
            try {
                const status = await api.get('/auth/setup-status');
                setSetup(status.data.needsSetup);
                if (storage.getToken()) {
                    try {
                        const me = await api.get('/auth/check');
                        setUser(me.data);
                    }
                    catch (e: any) {
                        if (e.response?.status === 401)
                            storage.removeToken();
                        else
                            throw e;
                    }
                }
            }
            catch (e: any) {
                setError(e.response?.data?.error || 'Cannot reach the shop server. Start the backend and retry.');
            }
            finally {
                setReady(true);
            }
        })();
    }, []);
    useEffect(() => { if (user)
        refresh().catch(e => setError(e.response?.data?.error || 'Could not load shop data.')); }, [user, refresh, revision]);
    useEffect(() => {
        if (!manager || !['reports','dashboard'].includes(tab) || (tab==='reports' && period === 'custom' && (!startDate || !endDate))) {
            setSummary(null);
            return;
        }
        let cancelled = false;
        setSummary(null);
        api.get('/reports/summary', { params: { period:tab==='dashboard' ? 'daily':period, date:tab==='dashboard' ? undefined:reportDate, startDate, endDate } }).then(r => { if (!cancelled)
            setSummary(r.data); })
            .catch(e => { if (!cancelled)
            setError(e.response?.data?.error || 'Could not load the report.'); });
        return () => { cancelled = true; };
    }, [manager, tab, period, reportDate, startDate, endDate, revision]);
    async function save(path: string, body: Row, method: 'post' | 'put' = 'post') {
        if (active.current)
            return;
        if(pending && body!==pending.body){setError('Use Retry safely to confirm the pending entry before recording another.');return;}
        active.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        const financial = ['purchases', 'sales', 'expenses', 'losses', 'capital', 'withdrawals', 'reversals', 'stock-counts', 'reconciliations'].includes(path) || (path==='products' && body.packs!==undefined);
        const action = (financial && pending) || { path, body: financial ? { ...body, requestKey: crypto.randomUUID() } : body, method };
        try {
            if (financial)
                sessionStorage.setItem('shop-pending-entry', JSON.stringify(action));
            const response = await api[action.method]('/' + action.path, action.body);
            if (financial) {
                setPending(null);
                sessionStorage.removeItem('shop-pending-entry');
            }
            setNotice(action.path==='sales' ? 'Sale recorded successfully.' : 'Saved successfully.');
            setRevision(x => x + 1);
            if (action.path === 'sales') { setReceipt(response.data); setCart([]); }
            if (action.path.startsWith('products'))
                setEditing(null);
            if (action.path.startsWith('auth/')) {
                storage.setToken(response.data.token);
                localStorage.setItem('Farm_user', JSON.stringify(response.data.user));
                setUser(response.data.user);
                setSetup(false);
                navigate('/account');
            }
            return response.data;
        }
        catch (e: any) {
            if(e.response?.data?.productId){setDuplicateProductId(e.response.data.productId); refresh().catch(()=>{});}
            setError(e.response?.data?.error || 'Connection interrupted. Retry the same entry to check whether it was saved.');
            if (financial && (!e.response || e.response.status >= 500))
                setPending(action);
            else if (financial) {
                setPending(null);
                sessionStorage.removeItem('shop-pending-entry');
            }
        }
        finally {
            active.current = false;
            setBusy(false);
        }
    }
    const submit = (path: string, extra: Row = {}, method: 'post' | 'put' = 'post') => (e: FormEvent<HTMLFormElement>) => save(path, { ...values(e), ...extra }, method);
    const productSelect = <label className="block space-y-2 text-sm font-medium">Product<select className="form-select" name="productId" required value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose a product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.quantity} individual items</option>)}</select></label>;
    return { suppliers, receipt, setReceipt, reportDate, setReportDate, tab, ready, setup, user, products, categories, settings, transactions, summary, period, startDate, endDate, error, notice, busy, pending, editing, selected, packs, cost, delivery, cart, revision, page, manager, product, save, submit, productSelect, duplicateProductId, setDuplicateProductId, setSummary, setPeriod, setStartDate, setEndDate, setError, setNotice, setEditing, setSelected, setPacks, setCost, setDelivery, setCart, setPage };
}
type InventoryState = ReturnType<typeof useInventoryState>;
const InventoryContext = createContext<InventoryState | null>(null);
export function InventoryProvider({ children }: {
    children: React.ReactNode;
}) {
    const value = useInventoryState();
    if (!value.ready)
        return <div className="p-6 text-center">Loading your account…</div>;
    if (!value.user)
        return <Navigate to="/login" replace/>;
    return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
export function useInventory() {
    const value = useContext(InventoryContext);
    if (!value)
        throw new Error('InventoryProvider is required');
    return value;
}
