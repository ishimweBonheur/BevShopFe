import { useStockMovements } from "@/hooks/api/stock_movement";
import { useState, useEffect } from "react";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import IconPlus from "@/components/Icon/IconPlus";
import IconTrash from "@/components/Icon/IconTrash";
import IconPencil from "@/components/Icon/IconPencil";
import AddStockMovementModal from "./AddStockMovement";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import UpdateStockMovementModal from "./Update";
import ConfirmDeleteModal from "./Delete";
import { useProducts } from "@/hooks/api/products";
import Filter from "@/components/filter";
import AppSelect from "@/components/select/SelectField";
import { useForm } from "react-hook-form";
import formatDateToLongForm from "@/utils/DateFormattter";

const StockMovementsList = () => {
  const { t } = useTranslation();
  const {
    stockMovements,
    loading,
    fetchStockMovements,
    updateStockMovement,
    deleteStockMovement,
  } = useStockMovements();
  const { register, setValue, handleSubmit } = useForm();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStockMovement, setSelectedStockMovement] = useState<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { products, fetchProducts } = useProducts();
  const [productId, setproductId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts("pageSize=1000000");
  }, [fetchProducts]);

  useEffect(() => {
    fetchStockMovements(searchParams.toString());
  }, [searchParams, fetchStockMovements]);
  const handleFilter = () => {
    const newSearchParams: any = {};

    if (productId) newSearchParams.productId = productId;
    if (fromDate) newSearchParams.fromDate = fromDate;
    if (toDate) newSearchParams.toDate = toDate;

    setSearchParams(newSearchParams);
  };

  const handleDelete = async () => {
    if (selectedStockMovement) {
      await deleteStockMovement(selectedStockMovement._id);
      fetchStockMovements();
      setIsDeleteModalOpen(false);
    }
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: t("stockMovements.type"),
      accessor: "type",
      render: (row) => <p className="uppercase">{row?.type}</p>,
    },
    {
      title: t("stockMovements.product"),
      accessor: "product",
      render: (row) => <p>{row?.product.name}</p>,
    },
    {
      title: t("stockMovements.quantity"),
      accessor: "quantity",
      render: (row) => <p>{row?.quantity}</p>,
    },
    {
      title: t("categories.dateCreated"),
      accessor: "created_at",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },
    {
      title: t("stockMovements.actions"),
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setSelectedStockMovement(row);
              setIsUpdateModalOpen(true);
            }}
            className=""
          >
            <IconPencil className="text-primary" />
          </button>
          <button
            onClick={() => {
              setSelectedStockMovement(row);
              setIsDeleteModalOpen(true);
            }}
            className=""
          >
            <IconTrash className="text-danger" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">{t("stockMovements.title")}</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <IconPlus className="mr-2" />
          {t("stockMovements.addStockMovement")}
        </button>
      </div>
      <DataTableV2
        columns={columns}
        data={stockMovements?.list ?? []}
        isLoading={loading}
        currentPage={stockMovements?.currentPage ?? 0}
        total={stockMovements?.total}
        lastPage={stockMovements?.totalPages + 1}
        previousPage={stockMovements?.previousPage}
        nextPage={stockMovements?.nextPage}
        tableName={t("stockMovements.title")}
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

      
      {isAddModalOpen && (
        <AddStockMovementModal
          onClose={() => setIsAddModalOpen(false)}
          handleRefetch={fetchStockMovements}
          isOpen={isAddModalOpen}
        />
      )}

      {isUpdateModalOpen && (
        <UpdateStockMovementModal
          stockMovement={selectedStockMovement}
          onClose={() => setIsUpdateModalOpen(false)}
          handleRefetch={fetchStockMovements}
          isOpen={isUpdateModalOpen}
        />
      )}


      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          handleRefetch={fetchStockMovements}
          stock_movement={selectedStockMovement}
          title={t("common.confirmDeleteTitle")}
          description={t("stockMovements.confirmDeleteMessage")}
        />
      )}
    </div>
  );
};

export default StockMovementsList;
