import { useStockMovements } from "@/hooks/api/stock_movement";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

const ConfirmDeleteModal = ({ isOpen, onClose, stock_movement, handleRefetch }: any) => {
  const { t } = useTranslation();
  const { deleteStockMovement, loading: deleteLoading } = useStockMovements();

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
                    {t("deleteStockMovement.confirmTitle")}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {t("deleteStockMovement.confirmMessage")}
                  </p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="btn btn-outline-danger">
                      {t("deleteStockMovement.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteStockMovement(stock_movement._id);
                        handleRefetch(); // Refetch the stock movements after deletion
                        onClose(); // Close the modal after deletion
                      }}
                      className="btn btn-danger"
                    >
                      {deleteLoading ? t("deleteStockMovement.deleting") : t("deleteStockMovement.delete")}
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
