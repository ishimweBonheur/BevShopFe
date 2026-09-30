import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../app/auth/login';
import Users from '@/app/dashboard/users';
import Widget from '@/app/dashboard/Widget';
import ProfilePage from '@/app/profile';
import AdminLayout from '@/components/Admin/DefaultLayout';
import CategoriesList from '@/app/dashboard/categories';
import ProductsList from '@/app/dashboard/products';
import StockMovementsList from '@/app/dashboard/stock_movement';
import POS from '@/app/dashboard/pos';
import SalesList from '@/app/dashboard/pos/sales';
import Orders from '@/app/dashboard/pos/orders';
import ExchangeRateManager from '@/app/dashboard/exchange';
import { RoleProtector } from '@/components/protector';

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="login" element={<Login />} />
        
        {/* Protected Routes for Admin */}
        <Route path="account" element={<AdminLayout />}>
          <Route
            index
            element={
              <RoleProtector element={<Widget />} role="admin" />
            }
          />
          <Route
            path="profile"
            element={
              <RoleProtector element={<ProfilePage />} role="admin" />
            }
          />
          <Route
            path="category"
            element={
              <RoleProtector element={<CategoriesList />} role="admin" />
            }
          />
          <Route
            path="users"
            element={
              <RoleProtector element={<Users />} role="admin" />
            }
          />
          <Route
            path="products"
            element={
              <RoleProtector element={<ProductsList />} role="admin" />
            }
          />
          <Route
            path="stock_movement"
            element={
              <RoleProtector element={<StockMovementsList />} role="admin" />
            }
          />
          <Route
            path="pos"
            element={
              <RoleProtector element={<POS />} role="admin" />
            }
          />
          <Route
            path="sales"
            element={
              <RoleProtector element={<SalesList />} role="admin" />
            }
          />
          <Route
            path="orders"
            element={
              <RoleProtector element={<Orders />} role="admin" />
            }
          />
          <Route
            path="rate"
            element={
              <RoleProtector element={<ExchangeRateManager />} role="admin" />
            }
          />
        </Route>

      </Routes>
    </>
  );
}
