import { z } from "zod";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useCategories } from "@/hooks/api/categories";

const categorySchema = z.object({
  name: z.string().nonempty("Name is required"),
  parent: z.string().optional(),
});

const UpdateCategoryModal = ({ isOpen, onClose, category, handleRefetch }: any) => {
  const { t } = useTranslation();
  const { categories, fetchCategories, updateCategory, loading, error } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    fetchCategories('page=1&pageSize=5000000');
  }, [fetchCategories]);

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        parent: category.parent?._id || "",
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        name: data.name,
        parent: data.parent || null,
      };
      await updateCategory(category._id, payload);
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
                  <div className="font-bold text-lg">{t("categories.updateCategory")}</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                      <InputField
                        type="text"
                        label={t("categories.name")}
                        placeholder={t("categories.enterCategoryName")}
                        registration={register("name")}
                        error={errors.name?.message}
                        name={"name"}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("categories.parentCategory")}
                      </label>
                      <select
                        {...register("parent")}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-700 focus:border-blue-700 sm:text-sm pr-10"
                      >
                        <option value="">{t("categories.none")}</option>
                        {categories?.list?.map((category: any) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end items-center mt-8">
                      <button type="button" onClick={onClose} className="btn btn-outline-danger">
                        {t("categories.discard")}
                      </button>
                      <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={loading}>
                        {loading ? t("categories.saving") : t("categories.save")}
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

export default UpdateCategoryModal;
