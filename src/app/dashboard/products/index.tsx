import { useProducts } from "@/hooks/api/products";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AddProductModal from "./add";
import UpdateProductModal from "./update";
import ConfirmDeleteModal from "./delete";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import IconPlus from "@/components/Icon/IconPlus";
import IconTrash from "@/components/Icon/IconTrash";
import IconPencil from "@/components/Icon/IconPencil";
import IconPrinter from "@/components/Icon/IconPrinter";
import PrintBarcodeModal from "../barcodes/generate";
import { formatCurrency } from "@/utils/formatCurrency";
import { useExchangeRate } from "@/hooks/api/exchangeRate";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { useCategories } from "@/hooks/api/categories";
import Filter from "@/components/filter";
import AppSelect from "@/components/select/SelectField";
import { useForm } from "react-hook-form";
import formatDateToLongForm from "@/utils/DateFormattter";

const ProductsList = () => {
  const { t } = useTranslation();
  const { rate } = useExchangeRate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, loading, fetchProducts } = useProducts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { categories, fetchCategories } = useCategories();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  const { register, setValue, handleSubmit } = useForm();

  useEffect(() => {
    fetchCategories("pageSize=1000000");
  }, [searchParams, fetchCategories]);

  useEffect(() => {
    fetchProducts(searchParams.toString());
  }, [searchParams, fetchProducts]);
  const handleFilter = () => {
    const newSearchParams: any = {};

    if (categoryId) newSearchParams.categoryId = categoryId;
    if (fromDate) newSearchParams.fromDate = fromDate;
    if (toDate) newSearchParams.toDate = toDate;

    setSearchParams(newSearchParams);
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: t("products.name"),
      accessor: "name",
      render: (row) => <p>{row?.name}</p>,
    },
    {
      title: t("products.description"),
      accessor: "description",
      render: (row) => <p>{row?.description}</p>,
    },
    {
      title: t("products.category"),
      accessor: "category",
      render: (row) => <p>{row?.category?.name}</p>,
    },
    {
      title: t("products.price"),
      accessor: "price",
      render: (row) => <p> {formatCurrency(row.price, rate)}</p>,
    },
    {
      title: t("products.quantityInStock"),
      accessor: "quantity",
      render: (row) => <p>{row?.quantity}</p>,
    },
    {
      title: t("products.isUnique"),
      accessor: "isUnique",
      render: (row) => (
        <p>{row?.isUnique ? t("common.yes") : t("common.no")}</p>
      ),
    },
    {
      title: t("products.condition"),
      accessor: "condition",
      render: (row) => <p>{row?.condition}</p>,
    },
    {
      title: t("products.status"),
      accessor: "status",
      render: (row) => (
        <span
          className={`badge ${
            row.status === "available" ? "bg-success" : "bg-danger"
          }`}
        >
          {t(`products.${row.status}`)}
        </span>
      ),
    },
    {
      title: t("categories.dateCreated"),
      accessor: "created_at",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },

    {
      title: t("products.actions"),
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2 justify-start">
          <button
            className="flex items-center gap-2 btn btn-primary btn-sm"
            onClick={() => {
              setSelectedProduct(row);
              setIsUpdateModalOpen(true);
            }}
          >
            <IconPencil />
            {t("common.update")}
          </button>
          <button
            onClick={() => {
              setSelectedProduct(row);
              setIsPrintModalOpen(true);
            }}
            className="flex items-center gap-2 btn btn-info btn-sm"
          >
            <IconPrinter />
            {t("products.printBarcode")}
          </button>

          {row.isActive && (
            <button
              onClick={() => {
                setSelectedProduct(row);
                setIsDeleteModalOpen(true);
              }}
              className="flex items-start gap-2 btn btn-danger btn-sm"
            >
              <IconTrash />
              {t("products.delete")}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <ol className="flex text-gray-500 mb-4 font-semibold dark:text-white-dark">
        <li>
          <button className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            {t("common.home")}
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <button className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70">
            {t("products.products")}
          </button>
        </li>
      </ol>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">{t("products.products")}</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <IconPlus className="mr-2" />
          {t("products.addNewProduct")}
        </button>
      </div>
      <DataTableV2
        columns={columns}
        data={products?.list ?? []}
        isLoading={loading}
        currentPage={products?.currentPage ?? 0}
        total={products?.total}
        lastPage={products?.totalPages + 1}
        previousPage={products?.previousPage}
        nextPage={products?.nextPage}
        tableName={t("products.products")}
        header={
          <Filter
            resetFilters={() => {
              setCategoryId(null);
              setFromDate(null);
              setToDate(null);
            }}
            title={t("common.filter")}
            onApply={handleFilter}
          >
            <div className="flex flex-col">
              <div className="mb-4">
                <AppSelect
                  label={t("products.category")}
                  name="category"
                  options={
                    categories?.list?.map((product: any) => ({
                      label: product.name,
                      value: product._id,
                    })) ?? []
                  }
                  placeholder={t("products.category")}
                  defaultValue={
                    categoryId
                      ? products?.list?.find((p: any) => p._id === categoryId)
                        ? {
                            label: products.list.find(
                              (p: any) => p._id === categoryId
                            ).name,
                            value: categoryId,
                          }
                        : undefined
                      : undefined
                  }
                  setValue={(name: string, value: string) =>
                    setCategoryId(value)
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

      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          handleRefetch={fetchProducts}
          isOpen={isAddModalOpen}
        />
      )}
      {isUpdateModalOpen && (
        <UpdateProductModal
          product={selectedProduct}
          onClose={() => setIsUpdateModalOpen(false)}
          handleRefetch={fetchProducts}
          isOpen={isUpdateModalOpen}
        />
      )}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          product={selectedProduct}
          onClose={() => setIsDeleteModalOpen(false)}
          handleRefetch={fetchProducts}
          isOpen={isDeleteModalOpen}
        />
      )}
      {isPrintModalOpen && (
        <PrintBarcodeModal
          product={selectedProduct}
          onClose={() => setIsPrintModalOpen(false)}
          isOpen={isPrintModalOpen}
        />
      )}
    </div>
  );
};

export default ProductsList;
