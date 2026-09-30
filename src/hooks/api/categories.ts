import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api, queryString } from '.';
import toast from 'react-hot-toast';

export const useCategories = () => {
    const [categories, setCategories] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const fetchCategories = useCallback(async (query?:string) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching categories...');
            const response = await api.get(`/categories${queryString(query)}`);
            console.log('Categories fetched:', response.data);
            setCategories(response.data);
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            setError(error.response?.data?.message || 'An error occurred while fetching categories.');
        } finally {
            setLoading(false);
        }
    }, []);
    const createCategory = async (category: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/categories', category);
            fetchCategories()
            toast.success('Category created successfully');
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while creating category.');
            toast.error(error.response?.data?.message || 'An error occurred while creating category.');
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = async (id: string, category: any) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/categories/${id}`, category);
            fetchCategories()
            toast.success('Category updated successfully');
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while updating category.');
            toast.error(error.response?.data?.message || 'An error occurred while updating category.');
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories()
            toast.success('Category deleted successfully');
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while deleting category.');
            toast.error(error.response?.data?.message || 'An error occurred while deleting category.');
        } finally {
            setLoading(false);
        }
    };

    return {
        categories,
        loading,
        error,
        fetchCategories,
        createCategory,
        updateCategory,
        deleteCategory,
    };
};