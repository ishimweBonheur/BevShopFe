export interface Product {
  id: string
  name: string
  category_id: string
  category_name: string
  description: string
  units_per_pack: number
  selling_price: number
  current_stock: number
  low_stock_level: number
  is_active: boolean
}
