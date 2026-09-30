import { useEffect, useState } from "react";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import { FaTimes, FaCheck, FaDownload } from "react-icons/fa";
import { formatCurrency } from "@/utils/formatCurrency";
import { useSales } from "@/hooks/api/payments";
import ConfirmCompleteModal from "./complete";
import ReceiptModal from "./receipt";
import { useExchangeRate } from "@/hooks/api/exchangeRate";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import formatDateToLongForm from "@/utils/DateFormattter";
import Filter from "@/components/filter";
import AppSelect from "@/components/select/SelectField";
import { useProducts } from "@/hooks/api/products";
import { useForm } from "react-hook-form";
import DataTableSales from "@/components/datatable/sales";

const SalesList = () => {
  const { t } = useTranslation();
  const { sales, loading, fetchSales, confirmPayment } = useSales();
  const { rate } = useExchangeRate();
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const { products, fetchProducts } = useProducts();
  const { register, setValue, handleSubmit } = useForm();

  const [searchParams, setSearchParams] = useSearchParams();
  const [productId, setproductId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts("pageSize=1000000");
  }, [fetchProducts]);

  useEffect(() => {
    fetchSales(searchParams.toString());
  }, [searchParams, fetchSales]);

  const handleFilter = () => {
    const newSearchParams: any = {};

    if (productId) newSearchParams.productId = productId;
    if (fromDate) newSearchParams.fromDate = fromDate;
    if (toDate) newSearchParams.toDate = toDate;

    setSearchParams(newSearchParams);
  };

  const handleConfirmPayment = async (
    paymentMethod: string,
    paidAmount: string,
    notes: string
  ) => {
    try {
      await confirmPayment(
        selectedSale.order._id,
        paymentMethod,
        paidAmount,
        notes
      );
      fetchSales();
      setIsCompleteModalOpen(false);
    } catch (error) {
      console.error(t("salesList.confirmPaymentError"));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="badge bg-green-500 text-white">
            {t("salesList.paid")}
          </span>
        );
      case "pending":
        return (
          <span className="badge bg-yellow-500 text-white">
            {t("salesList.pending")}
          </span>
        );
      case "refunded":
        return (
          <span className="badge bg-red-500 text-white">
            {t("salesList.refunded")}
          </span>
        );
      case "half-paid":
        return (
          <span className="badge bg-green-200 text-white">
            {t("salesList.halfPaid")}
          </span>
        );
      default:
        return (
          <span className="badge bg-gray-500 text-white">
            {t("salesList.unknown")}
          </span>
        );
    }
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: "INV N0",
      accessor: "order.invoiceNumber",
      render: (row) => <p>{row.order?.invoiceNumber ?? "-"}</p>,
    },
    {
      title: t("salesList.cashier"),
      accessor: "order.preparedBy.firstName",
      render: (row) => (
        <p>
          {row.order?.preparedBy?.firstName ?? "-"}{" "}
          {row.order?.preparedBy?.lastName ?? "-"}
        </p>
      ),
    },
    {
      title: t("salesList.customer"),
      accessor: "order.customer",
      render: (row) => <p>{row.order.customer}</p>,
    },
    {
      title: t("salesList.totalAmount"),
      accessor: "totalAmount",
      render: (row) => <p>{formatCurrency(row?.totalAmount ?? 0, rate)}</p>,
    },
    {
      title: t("salesList.paidAmount"),
      accessor: "amountPaid",
      render: (row) => <p>{formatCurrency(row?.amountPaid ?? 0, rate)}</p>,
    },
    {
      title: t("salesList.remainingAmount"),
      accessor: "remainingAmount",
      render: (row) => <p>{formatCurrency(row?.remainingAmount ?? 0, rate)}</p>,
    },
    {
      title: t("salesList.overPaid"),
      accessor: "overPaid",
      render: (row) => <p>{formatCurrency(row?.overPaid ?? 0, rate)}</p>,
    },
    {
      title: t("salesList.phone"),
      accessor: "notes",
      render: (row) => <p>{row?.notes}</p>,
    },
   
    {
      title: t("salesList.paymentMethod"),
      accessor: "paymentMethod",
      render: (row) => (
        <p>
          {row.paymentMethod.charAt(0).toUpperCase() +
            row.paymentMethod.slice(1)}
        </p>
      ),
    },
    {
      title: t("salesList.status"),
      accessor: "status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      title: t("salesList.products"),
      accessor: "order.products",
      render: (row) => (
        <ul>
          {row.order.products.map((product: any, index: number) => (
            <li key={index} className="mb-2">
              <strong>{t("salesList.product")}:</strong> {product.product.name}{" "}
              ({product.product.barcode}) <br />
              <strong>{t("salesList.quantity")}:</strong> {product.quantity}{" "}
              <br />
              <strong>{t("salesList.price")}:</strong>{" "}
              {formatCurrency(product.price, rate)}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: t("categories.dateCreated"),
      accessor: "created_at",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },

    {
      title: t("salesList.actions"),
      accessor: "actions",
      render: (row) => (
        <div className="flex space-x-2">
          {row.status !== "paid" && (
            <button
              onClick={() => {
                setSelectedSale(row);
                setIsCompleteModalOpen(true);
              }}
              className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition"
              title={t("salesList.completePayment")}
            >
              <FaCheck className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              setSelectedSale(row);
              setIsReceiptModalOpen(true);
            }}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            title={t("salesList.downloadReceipt")}
          >
            <FaDownload className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <ol className="flex text-gray-500 mb-4 font-semibold dark:text-white-dark">
        <Link to="/account">
          <button className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            {t("orders.home")}
          </button>
        </Link>
        <li className="before:content-['/'] before:px-1.5">
          <button className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70">
            {t("orders.salesOrders")}
          </button>
        </li>
      </ol>
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">{t("salesList.title")}</h1>

        <DataTableSales
          columns={columns}
          data={sales?.list ?? []}
          isLoading={loading}
          currentPage={sales?.currentPage ?? 0}
          total={sales?.total}
          lastPage={sales?.totalPages + 1}
          previousPage={sales?.previousPage}
          nextPage={sales?.nextPage}
          tableName={t("salesList.tableName")}
          header={
            <Filter
              resetFilters={() => {
                setproductId(null);
                setFromDate(null);
                setToDate(null);
              }}
              title={t("common.filter")}
              onApply={handleFilter}
            >
              <div className="flex flex-col">
                <div className="mb-4">
                  <AppSelect
                    label={t("stockMovements.product")}
                    name="product"
                    options={
                      products?.list?.map((product: any) => ({
                        label: product.name,
                        value: product._id,
                      })) ?? []
                    }
                    placeholder={t("stockMovements.product")}
                    defaultValue={
                      productId
                        ? products?.list?.find((p: any) => p._id === productId)
                          ? {
                              label: products.list.find(
                                (p: any) => p._id === productId
                              ).name,
                              value: productId,
                            }
                          : undefined
                        : undefined
                    }
                    setValue={(name: string, value: string) =>
                      setproductId(value)
                    }
                    register={register}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="fromDate">{t("common.fromDate")}:</label>
                  <input
                    type="date"
                    id="fromDate"
                    className="form-input"
                    value={fromDate ?? ""}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="toDate">{t("common.toDate")}:</label>
                  <input
                    type="date"
                    id="toDate"
                    className="form-input"
                    value={toDate ?? ""}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <button onClick={handleFilter} className="btn btn-primary mt-4">
                  {t("common.applyFilter")}
                </button>
              </div>
            </Filter>
          }
        />

        {isCompleteModalOpen && (
          <ConfirmCompleteModal
            isOpen={isCompleteModalOpen}
            onClose={() => setIsCompleteModalOpen(false)}
            handleConfirm={handleConfirmPayment}
          />
        )}

        {isReceiptModalOpen && (
          <ReceiptModal
            isOpen={isReceiptModalOpen}
            onClose={() => setIsReceiptModalOpen(false)}
            order={selectedSale.order}
          />
        )}
      </div>
    </>
  );
};

export default SalesList;
