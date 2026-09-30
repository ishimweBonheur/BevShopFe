import { useState, useCallback } from 'react';
import axios from 'axios';
import { api } from '.';
import toast from 'react-hot-toast';

export const useInventory = () => {
  const [inventory, setInventory] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/inventory');
      setInventory(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while fetching inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createInventory = async (inventoryItem: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/inventory', inventoryItem);
  fetchInventory()
      toast.success('Inventory item created successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while creating inventory item.');
      toast.error(error.response?.data?.message || 'An error occurred while creating inventory item.');
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (id: string, inventoryItem: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/inventory/${id}`, inventoryItem);
      fetchInventory()
      toast.success('Inventory item updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while updating inventory item.');
      toast.error(error.response?.data?.message || 'An error occurred while updating inventory item.');
    } finally {
      setLoading(false);
    }
  };

  const deleteInventory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory()
      toast.success('Inventory item deleted successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred while deleting inventory item.');
      toast.error(error.response?.data?.message || 'An error occurred while deleting inventory item.');
    } finally {
      setLoading(false);
    }
  };

  return {
    inventory,
    loading,
    error,
    fetchInventory,
    createInventory,
    updateInventory,
    deleteInventory,
  };
};