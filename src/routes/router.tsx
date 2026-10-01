import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/app/auth/login';
import AdminLayout from '@/components/Admin/DefaultLayout';
import { InventoryProvider } from '@/core/provider/InventoryProvider';
import Widget from '@/app/dashboard/Widget';
import Products from '@/app/dashboard/products';
import Categories from '@/app/dashboard/categories';
import StockMovements from '@/app/dashboard/stock_movement';
import POS from '@/app/dashboard/pos';
import Sales from '@/app/dashboard/pos/sales';
import Expenses from '@/app/dashboard/expenses';
import Losses from '@/app/dashboard/stock_movement/Losses';
import Cash from '@/app/dashboard/cash';
import Reconciliation from '@/app/dashboard/cash/Reconciliation';
import StockCounts from '@/app/dashboard/stock_movement/Counts';
import Recovery from '@/app/auth/recovery';
import Profile from '@/app/profile';
export default function AppRoutes() {
    return <Routes>
    <Route path="/login" element={<Login />}/><Route path="/recover" element={<Recovery />}/>
    <Route path="/account" element={<InventoryProvider><AdminLayout /></InventoryProvider>}>
      <Route index element={<Widget />}/>
      <Route path="reports" element={<Widget />}/>
      <Route path="products" element={<Products />}/>
      <Route path="category" element={<Categories />}/>
      <Route path="purchases" element={<StockMovements />}/><Route path="stock_movement" element={<Navigate to="/account/purchases" replace/>}/>
      <Route path="pos" element={<POS />}/>
      <Route path="sales" element={<Sales />}/>
      <Route path="expenses" element={<Expenses />}/>
      <Route path="losses" element={<Losses />}/>
      <Route path="cash" element={<Cash />}/><Route path="reconciliation" element={<Reconciliation />}/><Route path="stock-counts" element={<StockCounts />}/>
      <Route path="profile" element={<Profile />}/>
      <Route path="orders" element={<Navigate to="/account/pos" replace/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/account" replace/>}/>
  </Routes>;
}
