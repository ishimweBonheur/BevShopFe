import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

const ConfirmCompleteModal = ({ isOpen, onClose, handleConfirm }: any) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");
  const [payerMobileNumber, setPayerMobileNumber] = useState("");
  const { t } = useTranslation();

  const handleConfirmWithPayment = () => {
    const Paid = Number(paidAmount)
    handleConfirm(paymentMethod, Paid, note );
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
                <div className="flex bg-gray-100 dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">
                    {t("completeModal.title")}
                  </div>
                </div>
                <div className="p-5">
                  <p>{t("completeModal.message")}</p>

                  
                  <div className="mt-4">
                    <label className="block font-medium mb-2">
                      {t("completeModal.paymentMethod")}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="p-2 border rounded-md w-full"
                    >
                      <option value="cash">
                        {t("completeModal.methods.cash")}
                      </option>
                      <option value="card">
                        {t("completeModal.methods.card")}
                      </option>
                      <option value="mobile">
                        {t("completeModal.methods.mobile")}
                      </option>
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium mb-2">
                      {t("completeModal.paidAmount")}
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="p-2 border rounded-md w-full"
                      placeholder={t("completeModal.paidAmountPlaceholder")}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block font-medium mb-2">
                      {t("completeModal.note")}
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="p-2 border rounded-md w-full"
                      placeholder={t("completeModal.notePlaceholder")}
                    />
                  </div>

                  <div className="flex justify-end items-center mt-8">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-outline-danger"
                    >
                      {t("completeModal.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmWithPayment}
                      className="btn btn-success ltr:ml-4 rtl:mr-4"
                    >
                      {t("completeModal.confirm")}
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

export default ConfirmCompleteModal;
