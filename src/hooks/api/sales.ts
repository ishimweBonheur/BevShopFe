import { useState, useCallback } from 'react';
import { api, queryString } from '.';
import toast from 'react-hot-toast';

type Product = {
  _id: string;
  name: string;
  sellingPrice: number;
};

type Order = {
  customer: string;
  products: {
    product: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  discount: number;
  tax: number;
};

export const usePOS = () => {
  const [orders, setOrders] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (query?:string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/salesOrders${queryString(query)}`);
      setOrders(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while fetching orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = async (order: Order) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/salesOrders', order);
      fetchOrders();
      toast.success('Order created successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while creating the order.');
      toast.error(err.response?.data?.message || 'An error occurred while creating the order.');
    } finally {
      setLoading(false);
    }
  };

  const scanBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      const response = await api.post('/sales/scan-barcode', { barcode });
      return response.data;
    } catch (err) {
      
      return null;
    }
  };
  const cancelOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/salesOrders/${orderId}`);
      toast.success('Order cancelled successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while canceling the order.');
      toast.error(err.response?.data?.message || 'An error occurred while canceling the order.');
    } finally {
      setLoading(false);
    }
  };
  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    cancelOrder,
    scanBarcode,
  };
};
