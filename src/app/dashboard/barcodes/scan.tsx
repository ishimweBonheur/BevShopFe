import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/hooks/api";
import toast from "react-hot-toast";

interface ScanBarcodeForm {
  barcode: string;
}

const BarcodeScanner = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ScanBarcodeForm>();
  const [product, setProduct] = useState<any>(null);

  const onSubmit = async (data: ScanBarcodeForm) => {
    try {
      const response = await api.post("/barcode/scan", data);
      setProduct(response.data);
      toast.success("Product found!");
    } catch (error: any) {
      toast.error("Error scanning barcode: " + (error.response?.data?.message || error.message));
      setProduct(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Scan Barcode</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Barcode</label>
          <input
            type="text"
            {...register("barcode", { required: "Barcode is required" })}
            className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          {errors.barcode && <p className="text-red-500 text-sm mt-1">{errors.barcode.message}</p>}
        </div>
        <button type="submit" className="btn btn-primary">Scan</button>
      </form>
      {product && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Product Details</h2>
          <p><strong>Name:</strong> {product.name}</p>
          <p><strong>Description:</strong> {product.description}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <img src={product.image} alt={product.name} className="w-32 h-32 object-cover mt-2" />
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;