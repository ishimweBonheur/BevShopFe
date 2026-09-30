export interface BaseModel {
	id: string;
	createdAt: string;
	updatedAt: string;
}
export interface DefaultResponse <T> {
	status: number,
	message: string
	data: T
}

export interface ResponseModel<Model> {
    list: any;
  description: any;
	status: string;
	data: Model;
}

export interface ResponseListModel<Model> {
	status: string;
	data: Model[];
	total: number;
	previousPage: number | null;
	currentPage: number | null;
	nextPage: number | null;
}

export interface FailModel {
	status: string;
	error: {
		path: string;
		message: string;
	};
}

export interface ErrorModel {
	status: string;
	message: string;
}


export interface Product {
	_id: string;
	name: string;
	description: string;
	image: string;
	category: string;
	quantity: number;
	sellingPrice: number;
	sku: string;
  }
  
  export interface InventoryItem {
	_id: string;
	product: Product;
	totalQuantity: number;
	buyingPrice: number;
	sellingPrice: number;
	sku: string;
  }
  
  export interface OrderItem {
	product: string;
	quantity: number;
	price: any;
	sku: string;
  }
  
  export interface Order {
	customer: {
	  name: string;
	  email: string;
	  phone: string;
	  address: string;
	};
	items: OrderItem[];
	totalAmount: number;
	discount: any;
	tax: any;
	paymentStatus: string;
	orderStatus: string;
  }