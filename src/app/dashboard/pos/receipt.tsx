import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useRef } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useReactToPrint } from "react-to-print";
import { useTranslation } from "react-i18next";
import { isLoggedIn } from "@/hooks/api/auth";
import { CompanyLegalInfo } from "./campanyInfo";

const ReceiptModal = ({ isOpen, onClose, order }: any) => {
  const printRef = useRef(null);
  
  const { t } = useTranslation();
  const user = isLoggedIn();

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page {
        size: 80mm auto; /* Adjust width for thermal printer */
        margin: 2mm;
      }
      @media print {
        body {
          font-size: 10px;
          font-family: Arial, sans-serif;
          -webkit-print-color-adjust: exact;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border-bottom: 1px solid black;
          padding: 4px;
          text-align: left;
        }
        .no-print {
          display: none;
        }
      }
    `,
  });

  // Convert amount based on currency
  const convertAmount = (amount: number) => formatCurrency(amount);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" open={isOpen} onClose={onClose}>
        <div className="fixed inset-0 bg-black/60 z-[999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <Dialog.Panel className="panel p-0 rounded-lg overflow-hidden w-full max-w-lg my-8 text-black dark:text-white-dark bg-white">
              <div ref={printRef} className="p-6 text-sm">
                <h1 className="text-2xl font-bold text-center mb-2">
                  {t("receipt.title")}
                </h1>

                {/* Company Info */}
                <div className="flex justify-between text-xs">
                  <div>
                    <h2 className="font-bold">{t("company.name")}</h2>
                    <p>{t("company.addressLine1")}</p>
                    <p>{t("company.addressLine2")}</p>
                    <p>{t("company.email")}</p>
                    <p>{t("company.phone")}</p>
                      <CompanyLegalInfo />
                  </div>
                  <div className="text-right">
                    <p>
                      <strong>{t("receipt.orderId")}:</strong> {order?.invoiceNumber}
                    </p>
                    <p>
                      <strong>By:</strong> {user?.firstName} {user?.lastName}
                    </p>
                    <p>
                      <strong>{t("receipt.date")}:</strong>{" "}
                      {new Date(order?.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(order?.createdAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>

                    <p>
                      <strong>{t("receipt.customer")}:</strong>{" "}
                      {order?.customer}
                    </p>
                  </div>
                </div>

                {/* Product Table */}
                <table className="w-full mt-4 border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-xs">
                      <th className="p-2 border border-gray-300 text-left">
                        {t("receipt.product")}
                      </th>
                      <th className="p-2 border border-gray-300 text-right">
                        {t("receipt.quantity")}
                      </th>
                      <th className="p-2 border border-gray-300 text-right">
                        {t("receipt.price")}
                      </th>
                      <th className="p-2 border border-gray-300 text-right">
                        {t("receipt.total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order?.products?.map((product: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-gray-300 text-xs"
                      >
                        <td className="p-2">
                          {product?.product?.name} ({product?.product?.barcode})
                        </td>
                        <td className="p-2 text-right">{product?.quantity}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(product?.price)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(
                            product?.price * product?.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Total Breakdown */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <p className="  ">{t("receipt.subtotal")}:</p>
                    <p className="   ">
                      {formatCurrency(order?.totalAmount)}
                    </p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p className="  ">{t("receipt.discount")}:</p>
                    <p className="   ">{order?.discount}%</p>
                  </div>
                  <div className="flex justify-between text-xs">
                    <p className="  ">{t("receipt.tax")}:</p>
                    <p className="   ">{order?.tax}%</p>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                    <p>{t("receipt.total")}:</p>
                    <p>{formatCurrency(order?.totalAmount)}</p>
                  </div>

                  {/* Amount in another currency */}
                  <div className="flex justify-between font-bold text-sm">
                    <p>
                      {t("receipt.amount") + " (RWF):"}
                    </p>

                    <p>{convertAmount(order?.totalAmount)}</p>
                  </div>
                </div>

                {/* Thank You Message */}
                <p className="text-center mt-4 text-xs ">
                  {t("receipt.thankYouMessage")}
                </p>

                {/* Printed By */}
              </div>

              {/* Footer Buttons */}
              <div className="p-4 flex justify-end space-x-4 bg-gray-50">
                <button
                  onClick={onClose}
                  className="btn btn-outline-danger text-xs"
                >
                  {t("receipt.close")}
                </button>
                <button
                  onClick={handlePrint}
                  className="btn btn-primary text-xs"
                >
                  {t("receipt.download")}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ReceiptModal;
