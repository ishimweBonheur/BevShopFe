import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useProducts } from "@/hooks/api/products";
import { useCategories } from "@/hooks/api/categories";
import { uploadImageToCloudinary } from "./cloudinary";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

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

const AddProductModal = ({ isOpen, onClose, handleRefetch }: any) => {
  const { t } = useTranslation();
  const [searchParams]:any = useSearchParams();
  const { categories, fetchCategories } = useCategories();
  const { createProduct, loading, error } = useProducts();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories('pageSize=10000');
  }, [fetchCategories,searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const selectedImage = watch("image");
  const isUniqueSelected = watch("isUnique") === "true";

  useEffect(() => {
    if (selectedImage?.[0]) {
      const file = selectedImage[0];
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  }, [selectedImage]);

  const onSubmit = async (data: any) => {
    try {
      let imageUrl = "";
      if (data.image[0]) {
        imageUrl = await uploadImageToCloudinary(data.image[0]);
      }
      const payload = {
        name: data.name,
        description: data.description,
        image: imageUrl,
        category: data.category,
        price: Number(data.price),
        isUnique: data.isUnique === "true",
        condition: data.condition,
        size: isUniqueSelected ? data.size : undefined,
        color: isUniqueSelected ? data.color : undefined,
      };
      await createProduct(payload);
      handleRefetch();
      onClose();
      reset();
      setImagePreview(null);
    } catch (err) {
      // Handle error if needed
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl my-8 text-black dark:text-white-dark">
                <div className="flex bg-gray-100 dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">{t('products.addNewProduct')}</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}

                  <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                    {/* Name Field */}
                    <div className="mb-4">
                      <InputField
                        type="text"
                        label={t('products.name')}
                        placeholder={t('products.enterName')}
                        registration={register("name")}
                        error={errors.name?.message}
                        name={"name"}
                      />
                    </div>

                    {/* Description Field */}
                    <div className="mb-4">
                      <InputField
                        type="text"
                        label={t('products.description')}
                        placeholder={t('products.enterDescription')}
                        registration={register("description")}
                        error={errors.description?.message}
                        name={"description"}
                      />
                    </div>

                    {/* Price Field */}
                    <div className="mb-4">
                      <InputField
                        type="number"
                        label="Selling price (RWF)"
                        placeholder={t('products.enterPrice')}
                        registration={register("price")}
                        error={errors.price?.message}
                        name={"price"}
                      />
                    </div>

                    {/* Is Unique */}
                    <div className="mb-3 mt-2">
                      <label className="block text-sm font-bold text-gray-700">{t('products.isUnique')}</label>
                      <select
                        {...register("isUnique")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                      >
                        <option value="">{t('products.selectUniqueness')}</option>
                        <option value="true">{t('products.true')}</option>
                        <option value="false">{t('products.false')}</option>
                      </select>
                      {errors.isUnique?.message && (
                        <p className="text-red-500 text-xs mt-1">{String(errors.isUnique.message)}</p>
                      )}
                    </div>

                    {!isUniqueSelected && (
                      <>
                        {/* Size Field */}
                        <div className="mb-4">
                          <InputField
                            type="text"
                            label={t('products.size')}
                            placeholder={t('products.enterSizes')}
                            registration={register("size")}
                            error={errors.size?.message}
                            name={"size"}
                          />
                        </div>


                        <div className="mb-4">
                          <InputField
                            type="text"
                            label={t('products.color')}
                            placeholder={t('products.enterColors')}
                            registration={register("color")}
                            error={errors.color?.message}
                            name={"color"}
                          />
                        </div>
                      </>
                    )}

                    {/* Image Upload */}
                    <div className="mb-4 col-span-2">
                      <label className="block text-sm font-medium text-gray-700">{t('products.image')}</label>
                      <input
                        type="file"
                        {...register("image")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                        accept="image/*"
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-2 w-32 h-32 object-cover rounded-md"
                        />
                      )}
                    </div>

                    {/* Category Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-bold">{t('products.category')}</label>
                      <select
                        {...register("category")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                      >
                        <option value="">{t('products.selectCategory')}</option>
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

                    {/* Condition Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-bold">{t('products.condition')}</label>
                      <select
                        {...register("condition")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm"
                      >
                        <option value="">{t('products.selectCondition')}</option>
                        <option value="New">{t('products.new')}</option>
                        <option value="Like New">{t('products.likeNew')}</option>
                        <option value="Good">{t('products.good')}</option>
                        <option value="Fair">{t('products.fair')}</option>
                      </select>
                      {errors.condition?.message && (
                        <p className="text-red-500 text-xs mt-1">{String(errors.condition.message)}</p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end col-span-2 items-center mt-8">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline-danger"
                      >
                        {t('common.discard')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary ltr:ml-4 rtl:mr-4"
                        disabled={loading}
                      >
                        {loading ? t('common.saving') : t('common.save')}
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

export default AddProductModal;
