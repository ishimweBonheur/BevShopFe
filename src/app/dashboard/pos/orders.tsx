import { useState, useEffect } from "react";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import { FaTimes, FaFileInvoice } from "react-icons/fa";
import { formatCurrency } from "@/utils/formatCurrency";
import { usePOS } from "@/hooks/api/sales";
import { Link, useSearchParams } from "react-router-dom";
import ConfirmDeleteModal from "./cancel";
import InvoiceModal from "./invoice";
import { useTranslation } from "react-i18next";
import formatDateToLongForm from "@/utils/DateFormattter";
import { useProducts } from "@/hooks/api/products";
import { useForm } from "react-hook-form";
import Filter from "@/components/filter";
import AppSelect from "@/components/select/SelectField";
import DataTableOrders from "@/components/datatable/Orders";

const Orders = () => {
  const { t } = useTranslation();
  const { orders, loading, fetchOrders, cancelOrder } = usePOS();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, setValue, handleSubmit } = useForm();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { products, fetchProducts } = useProducts();
  const [productId, setproductId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts("pageSize=1000000");
  }, [fetchProducts]);

  useEffect(() => {
    fetchOrders(searchParams.toString());
  }, [searchParams, fetchOrders]);
  const handleFilter = () => {
    const newSearchParams: any = {};

    if (productId) newSearchParams.productId = productId;
    if (fromDate) newSearchParams.fromDate = fromDate;
    if (toDate) newSearchParams.toDate = toDate;

    setSearchParams(newSearchParams);
  };

  const handleDeleteOrder = async () => {
    try {
      await cancelOrder(selectedSale._id);
      fetchOrders();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error(t("orders.errorCancelOrder"));
    }
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: "INV N0",
      accessor: "invoiceNumber",
      render: (row) => <p>{row?.invoiceNumber ?? "-"}</p>,
    },
    {
      title: t("salesList.cashier"),
      accessor: "preparedBy.firstName",
      render: (row) => (
        <p>
          {row?.preparedBy?.firstName ?? "-"}{" "}
          {row?.preparedBy?.lastName ?? "-"}
        </p>
      ),
    },
    {
      title: t("orders.customer"),
      accessor: "customer",
      render: (row) => <p>{row.customer}</p>,
    },
    {
      title: t("orders.totalAmount"),
      accessor: "totalAmount",
      render: (row) => <p>{formatCurrency(row.totalAmount)}</p>,
    },
    {
      title: t("orders.discount"),
      accessor: "discount",
      render: (row) => <p>{row.discount}%</p>,
    },
    {
      title: t("orders.tax"),
      accessor: "tax",
      render: (row) => <p>{row.tax}%</p>,
    },

    {
      title: t("orders.orderStatus"),
      accessor: "status",
      render: (row) => (
        <span
          className={`badge ${
            row.status === "pending"
              ? "bg-yellow-500"
              : row.status === "completed"
              ? "bg-green-500"
              : "bg-red-500"
          } text-white`}
        >
          {t(`orders.status.${row.status.toLowerCase()}`)}
        </span>
      ),
    },
    
    {
      title: t("orders.items"),
      accessor: "products",
      render: (row) => (
        <div>
          {row.products.map((item: any, index: number) => (
            <div key={index} className="mb-2">
              <p>
                <strong>{t("orders.product")}:</strong> {item.product.name}
              </p>
              <p>
                <strong>{t("orders.quantity")}:</strong> {item.quantity}
              </p>
              <p>
                <strong>{t("orders.price")}:</strong>{" "}
                {formatCurrency(item.price)}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: t("categories.dateCreated"),
      accessor: "created_at",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },
    {
      title: t("orders.actions"),
      accessor: "actions",
      render: (row) => (
        <div className="flex space-x-2">
          {row.status === "pending" && (
            <button
              onClick={() => {
                setSelectedSale(row);
                setIsDeleteModalOpen(true);
              }}
              className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              setSelectedOrder(row);
              setIsInvoiceModalOpen(true);
            }}
            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
          >
            <FaFileInvoice className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
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
      <h1 className="text-2xl font-semibold mb-4">{t("orders.title")}</h1>

      <DataTableOrders
        columns={columns}
        data={orders?.list ?? []}
        isLoading={loading}
        currentPage={orders?.currentPage ?? 0}
        total={orders?.total}
        lastPage={orders?.totalPages + 1}
        previousPage={orders?.previousPage}
        nextPage={orders?.nextPage}
        tableName={t("orders.tableName")}
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

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          handleConfirm={handleDeleteOrder}
        />
      )}

      {isInvoiceModalOpen && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default Orders;
