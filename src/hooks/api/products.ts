import { useState, useCallback } from 'react';
import axios from 'axios';
import { api, queryString } from '.';
import toast from 'react-hot-toast';

export const useProducts = () => {
    const [products, setProducts] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProducts = useCallback(async (query?:string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/products${queryString(query)}`);
            setProducts(response.data);
        } catch (error: any) {
            setError(error.response?.data?.error);

        } finally {
            setLoading(false);
        }
    }, []);

    const createProduct = async (product: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/products', product);
            setProducts(response.data)
            toast.success('Product created successfully');
        } catch (error: any) {
            setError(error.response?.data?.error || 'An error occurred while creating product.');
            toast.error(error.response?.data?.error || 'An error occurred while creating product.');
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (id: string, product: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/products/${id}`, product);
            fetchProducts()
            toast.success('Product updated successfully');
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while updating product.');
            toast.error(error.response?.data?.message || 'An error occurred while updating product.');
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/products/${id}`);
            fetchProducts()
            toast.success('Product deleted successfully');
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while deleting product.');
            toast.error(error.response?.data?.message || 'An error occurred while deleting product.');
        } finally {
            setLoading(false);
        }
    };

    return {
        products,
        loading,
        error,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    };
};