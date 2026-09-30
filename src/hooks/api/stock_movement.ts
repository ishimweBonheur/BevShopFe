import { useState, useCallback } from 'react';
import { api, queryString } from '.';
import toast from 'react-hot-toast';

export const useStockMovements = () => {
  const [stockMovements, setStockMovements] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockMovements = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/stock-movements${queryString(query)}`);
      setStockMovements(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch stock movements');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStockMovement = async (stockMovement: any) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/stock-movements', stockMovement);
      await fetchStockMovements();
      toast.success('Stock movement created successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creating stock movement');
      toast.error(error.response?.data?.message || 'Error creating stock movement');
    } finally {
      setLoading(false);
    }
  };

  const updateStockMovement = async (id: string, stockMovement: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/stock-movements/${id}`, stockMovement);
     fetchStockMovements()
      toast.success('Stock movement updated successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating stock movement');
      toast.error(error.response?.data?.message || 'Error updating stock movement');
    } finally {
      setLoading(false);
    }
  };

  const deleteStockMovement = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/stock-movements/${id}`); 
      fetchStockMovements()
      toast.success('Stock movement deleted successfully');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error deleting stock movement');
      toast.error(error.response?.data?.message || 'Error deleting stock movement');
    } finally {
      setLoading(false);
    }
  };

  return {
    stockMovements,
    loading,
    error,
    fetchStockMovements,
    createStockMovement,
    updateStockMovement,
    deleteStockMovement,
  };
};
