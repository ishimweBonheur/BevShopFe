import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useProducts } from "@/hooks/api/products";
import { useCategories } from "@/hooks/api/categories";
import { uploadImageToCloudinary } from "./cloudinary";
import * as z from "zod";
import { useTranslation } from "react-i18next";

const productSchema = z.object({
  name: z.string().nonempty("Name is required"),
  description: z.string().optional(),
  image: z.any().optional(),
  price: z.string().nonempty("Price is required"),
  category: z.string().nonempty("Category is required"),
  condition: z.enum(["New", "Like New", "Good", "Fair"], {
    required_error: "Condition is required",
  }),
  isUnique: z.enum(["true", "false"], {
    required_error: "Uniqueness is required",
  }),
  size: z.string().optional(),
  color: z.string().optional(),
});

const UpdateProductModal = ({ isOpen, onClose, product, handleRefetch }: any) => {
  const { t } = useTranslation();
  const { categories, fetchCategories } = useCategories();
  const { updateProduct, loading, error } = useProducts();

  useEffect(() => {
    fetchCategories('pageSize=10000');
  }, [fetchCategories]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      category: product?.category?._id || "",
      price: product?.price ? String(product.price) : "",
      condition: product?.condition || "New",
      isUnique: product?.isUnique ? "true" : "false",
      image: product?.image || "",
      size: product?.size || "",
      color: product?.color || "",
    },
  });

  const isUniqueSelected = watch("isUnique") === "true";

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        description: product.description || "",
        category: product.category?._id || "",
        price: product.price ? String(product.price) : "",
        condition: product.condition || "New",
        isUnique: product.isUnique ? "true" : "false",
        image: product.image || "",
        size: product.size || "",
        color: product.color || "",
      });

      setValue("category", product.category?._id || "");
      setValue("price", product.price ? String(product.price) : "");
    }
  }, [product, reset, setValue]);

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = product.image;

      if (data.image && data.image.length > 0 && data.image[0] instanceof File) {
        imageUrl = await uploadImageToCloudinary(data.image[0]);
      }

      const payload: any = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        condition: data.condition,
        isUnique: data.isUnique === "true",
        size: isUniqueSelected ? data.size : undefined,
        color: isUniqueSelected ? data.color : undefined,
      };

      if (imageUrl !== product.image) {
        payload.image = imageUrl;
      }

      await updateProduct(product._id, payload);
      handleRefetch();
      onClose();
      reset();
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" />
        </Transition.Child>
        <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen px-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-xl my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">{t("products.updateProduct")}</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}

                  <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-5">
                    <div className="mb-4">
                      <InputField
                      name="name"
                        type="text"
                        label={t("products.name")}
                        placeholder={t("products.enterProductName")}
                        registration={register("name")}
                        error={errors.name?.message}
                      />
                    </div>
                    <div className="mb-4">
                      <InputField
                       name="description"
                        type="text"
                        label={t("products.description")}
                        placeholder={t("products.enterDescription")}
                        registration={register("description")}
                        error={errors.description?.message}
                      />
                    </div>
                    <div className="mb-4">
                      <InputField
                        type="text"
                        name="price"
                        label={t("products.price")}
                        placeholder={t("products.enterPrice")}
                        registration={register("price")}
                        error={errors.price?.message}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold">{t("products.category")}</label>
                      <select
                        {...register("category")}
                        className="block w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">{t("products.selectCategory")}</option>
                        {categories?.list?.map((category: any) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {errors.category?.message && (
                        <p className="text-red-500 text-xs mt-1">{String(errors.category.message)}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold">{t("products.condition")}</label>
                      <select
                        {...register("condition")}
                        className="block w-full px-3 py-2 border rounded-md"
                      >
                        <option value="New">{t("products.new")}</option>
                        <option value="Like New">{t("products.likeNew")}</option>
                        <option value="Good">{t("products.good")}</option>
                        <option value="Fair">{t("products.fair")}</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-bold">{t("products.isUnique")}</label>
                      <select
                        {...register("isUnique")}
                        className="block w-full px-3 py-2 border rounded-md"
                      >
                        <option value="true">{t("common.yes")}</option>
                        <option value="false">{t("common.no")}</option>
                      </select>
                    </div>

                    {!isUniqueSelected && (
                      <>
                        <div className="mb-4">
                          <InputField
                            type="text"
                            name="size"
                            label={t("products.sizes")}
                            placeholder={t("products.enterSize")}
                            registration={register("size")}
                            error={errors.size?.message}
                          />
                        </div>
                        <div className="mb-4">
                          <InputField
                            type="text"
                            name="color"
                            label={t("products.colors")}
                            placeholder={t("products.enterColor")}
                            registration={register("color")}
                            error={errors.color?.message}
                          />
                        </div>
                      </>
                    )}

                    <div className="mb-4 col-span-2">
                      <label className="block text-sm font-bold">{t("products.image")}</label>
                      <input
                        type="file"
                        {...register("image")}
                        className="block w-full px-3 py-2 border rounded-md"
                      />
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="mt-2 w-32 h-32 object-cover"
                        />
                      )}
                    </div>

                    <div className="flex justify-end col-span-2 items-center mt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline-danger"
                      >
                        {t("common.discard")}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary ltr:ml-4 rtl:mr-4"
                        disabled={loading}
                      >
                        {loading ? t("products.saving") : t("common.save")}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UpdateProductModal;
