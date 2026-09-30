import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DataTableV2, { TableColumnV2 } from "@/components/datatable";
import IconPlus from "@/components/Icon/IconPlus";
import IconEdit from "@/components/Icon/IconEdit";
import { toast } from "react-hot-toast";
import { useUsers } from "@/hooks/api/auth";
import AddUserModal from "./add_user";
import UpdateUserModal from "./update_user";
import ConfirmDeleteModal from "./delete";
import { useSearchParams } from "react-router-dom";
import IconTrash from "@/components/Icon/IconTrash";
import formatDateToLongForm from "@/utils/DateFormattter";

const Users = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { users, loading, refetch, deleteUser }: any = useUsers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>({});

  const queryString = searchParams.toString();

  useEffect(() => {
    refetch(queryString || undefined);
  }, [queryString, refetch]);

  const handleDelete = async () => {
    try {
      await deleteUser(selectedUser?._id);
      toast.success(t("users.deleteSuccess"));
    } catch (error) {
      toast.error(t("users.deleteError"));
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  const handleRefetch = () => {
    refetch();
  };

  const columns: TableColumnV2<any>[] = [
    {
      title: t("users.fullName"),
      accessor: "fullName",
      render: (row) => <p>{`${row?.firstName} ${row?.lastName}`}</p>,
    },
    {
      title: t("users.username"),
      accessor: "username",
      render: (row) => <p>{row?.username}</p>,
    },
    {
      title: t("users.email"),
      accessor: "email",
      render: (row) => <p>{row?.email}</p>,
    },
    {
      title: t("users.phone"),
      accessor: "phone",
      render: (row) => <p>{row?.phone}</p>,
    },
    {
      title: t("users.role"),
      accessor: "role",
      render: (row) => <p>{row?.role}</p>,
    },

    {
      title: t("categories.dateCreated"),
      accessor: "created_at",
      render: (row) => <p>{formatDateToLongForm(row?.createdAt)}</p>,
    },

    {
      title: t("users.actions"),
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsUpdateModalOpen(true);
            }}
          >
            <IconEdit className="text-primary" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsDeleteModalOpen(true);
            }}
          >
            <IconTrash className="text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <ol className="flex text-gray-500 font-semibold dark:text-white-dark">
        <li>
          <button className="hover:text-gray-500/70 dark:hover:text-white-dark/70">
            {t("users.home")}
          </button>
        </li>
        <li className="before:content-['/'] before:px-1.5">
          <button className="text-black dark:text-white-light hover:text-black/70 dark:hover:text-white-light/70">
            {t("users.users")}
          </button>
        </li>
      </ol>

      <div className="flex flex-row justify-end gap-2 mb-2">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary flex items-center gap-1"
        >
          <IconPlus />
          {t("users.addUser")}
        </button>
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        handleRefetch={handleRefetch}
      />
      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        user={selectedUser}
        handleRefetch={handleRefetch}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        user={selectedUser}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />

      <div className="w-full">
        <DataTableV2
          columns={columns}
          data={users?.list ?? []}
          isLoading={loading}
          currentPage={users?.currentPage ?? 0}
          total={users?.total}
          lastPage={users?.totalPages + 1}
          previousPage={users?.previousPage}
          nextPage={users?.nextPage}
          tableName={t("users.table")}
        />
      </div>
    </div>
  );
};

export default Users;
