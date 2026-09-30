import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useProducts } from "@/hooks/api/products";
import IconX from "@/components/Icon/IconX";
import { useTranslation } from "react-i18next";

const ConfirmDeleteModal = ({ isOpen, onClose, product, handleRefetch }: any) => {
  const { t } = useTranslation();
  const { deleteProduct, loading, error } = useProducts();

  const handleDelete = async () => {
    try {
      await deleteProduct(product._id);
      handleRefetch();
      onClose();
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
                <div className="bg-white dark:bg-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">
                    {t("products.deleteProduct")}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t("products.areYouSureDelete", { productName: product?.name })}
                  </p>  
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-outline-danger flex items-center"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="btn btn-danger flex items-center"
                    >
                      <IconX className="mr-2" />
                      {t("products.delete")}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
export default ConfirmDeleteModal;