import {Routes,Route,Navigate} from 'react-router-dom';
import Login from '@/app/auth/login';
import Recovery from '@/app/auth/recovery';
import AdminLayout from '@/components/Admin/DefaultLayout';
import {NotebookProvider} from '@/core/provider/NotebookProvider';
import Notebook from '@/app/dashboard/Notebook';
import Profile from '@/app/profile';
export default function AppRoutes(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/recover" element={<Recovery/>}/><Route path="/account" element={<NotebookProvider><AdminLayout/></NotebookProvider>}><Route index element={<Notebook/>}/>{['products','categories','purchases','sales','expenses','damaged-items','owner-money','history','reports'].map(path=><Route key={path} path={path} element={<Notebook/>}/>)}<Route path="profile" element={<Profile/>}/>{Object.entries({category:'categories',stock_movement:'purchases',pos:'sales',orders:'sales',losses:'damaged-items',cash:'owner-money',reconciliation:'history','stock-counts':'products'}).map(([from,to])=><Route key={from} path={from} element={<Navigate to={'/account/'+to} replace/>}/>)}</Route><Route path="*" element={<Navigate to="/account" replace/>}/></Routes>;}
