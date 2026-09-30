import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useCategories } from "@/hooks/api/categories";
import { useSearchParams } from "react-router-dom";

const categorySchema = z.object({
  name: z.string().nonempty("Name is required"),
  parent: z.string().optional(),
});

const AddCategoryModal = ({ isOpen, onClose, handleRefetch }: any) => {
  const { t } = useTranslation();
  
    const [searchParams]: any = useSearchParams();
  const { categories, fetchCategories, createCategory, loading, error } = useCategories();
  const params = new URLSearchParams(searchParams);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const categoryId = params.get("categoryId");
    fetchCategories(`page=1&pageSize=5000000${categoryId ? `&categoryId=${categoryId}` : ""}`);
  }, [searchParams, fetchCategories]);
  

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        parent: data.parent || null,
      };
      await createCategory(payload);
      handleRefetch();
      onClose();
      reset();
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
              <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark">
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">{t("addCategory.title")}</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                      <InputField
                        type="text"
                        label={t("addCategory.name")}
                        placeholder={t("addCategory.enterCategoryName")}
                        registration={register("name")}
                        error={errors.name?.message}
                        name={"name"}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("addCategory.parentCategory")}
                      </label>
                      <select
                        {...register("parent")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-700 sm:text-sm pr-10"
                      >
                        <option value="">{t("addCategory.none")}</option>
                        {categories?.list?.map((category: any) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end items-center mt-8">
                      <button type="button" onClick={onClose} className="btn btn-outline-danger">
                        {t("addCategory.discard")}
                      </button>
                      <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={loading}>
                        {loading ? t("addCategory.saving") : t("addCategory.save")}
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

export default AddCategoryModal;
