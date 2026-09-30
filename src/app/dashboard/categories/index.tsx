import { useCategories } from "@/hooks/api/categories";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ConfirmDeleteModal from "./delete";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import formatDateToLongForm from "@/utils/DateFormattter";
import IconPlus from "@/components/Icon/IconPlus";
import IconHome from "@/components/Icon/IconHome";
import IconTrash from "@/components/Icon/IconTrash";
import IconPencil from "@/components/Icon/IconPencil";
import { isLoggedIn } from "@/hooks/api/auth";
import UpdateCategoryModal from "./update";
import AddCategoryModal from "./add";
import { useSearchParams } from "react-router-dom";

const CategoriesList = () => {
  const { t } = useTranslation();

  const [searchParams]: any = useSearchParams();
  const { categories, loading, fetchCategories } = useCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const user = isLoggedIn();

  useEffect(() => {
    fetchCategories(searchParams);
  }, [searchParams, fetchCategories]);

  const columns: TableColumnV2<any>[] = useMemo(() => {
    const baseColumns: TableColumnV2<any>[] = [
      {
        title: t("categories.name"),
        accessor: "name",
        render: (row) => <p className="capitalize">{row?.name}</p>,
      },
      {
        title: t("categories.parentName"),
        accessor: "parent.name",
        render: (row) => <p className="capitalize">{row?.parent?.name}</p>,
      },
      {
        title: t("categories.dateCreated"),
        accessor: "created_at",
        render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
      },
    ];

    if (user?.role === "ADMIN") {
      baseColumns.push({
        title: t("categories.actions"),
        accessor: "actions",
        render: (row) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setSelectedCategory(row);
                setIsUpdateModalOpen(true);
              }}
              className="btn-icon"
            >
              <IconPencil />
            </button>
            <button
              onClick={() => {
                setSelectedCategory(row);
                setIsDeleteModalOpen(true);
              }}
              className="btn-icon"
            >
              <IconTrash />
            </button>
          </div>
        ),
      });
    }

    return baseColumns;
  }, [user, t]);

  return (
    <div>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
        <li>
          <button className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            <IconHome />
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <button className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70">
            {t("categories.breadcrumb")}
          </button>
        </li>
      </ol>

      {user?.role === "ADMIN" && (
        <div className="flex flex-row justify-end gap-2 mb-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
          >
            <IconPlus />
            {t("categories.addCategory")}
          </button>
        </div>
      )}

      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleRefetch={fetchCategories}
      />

      <UpdateCategoryModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        category={selectedCategory}
        handleRefetch={fetchCategories}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        category={selectedCategory}
        handleRefetch={fetchCategories}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={categories?.list ?? []}
          isLoading={loading}
          currentPage={categories?.currentPage ?? 0}
          total={categories?.total}
        
          tableName={t("categories.tableName")}
          lastPage={categories?.totalPages + 1}
          previousPage={categories?.previousPage}
          nextPage={categories
            ?.nextPage}
           
        />
      </div>
    </div>
  );
};

export default CategoriesList;
