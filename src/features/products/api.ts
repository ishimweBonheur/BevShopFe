import { list } from '../../lib/apiClient'
import type { Product } from './types'
export const productKeys = { all: ['products'] as const }
export const fetchProducts = () => list<Product>('/products')
