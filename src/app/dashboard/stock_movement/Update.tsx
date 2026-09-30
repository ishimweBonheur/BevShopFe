import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InputField } from "@/components/input";
import { useStockMovements } from "@/hooks/api/stock_movement";
import { useProducts } from "@/hooks/api/products";
import { useTranslation } from "react-i18next";
import * as z from "zod";
import AppSelect from "@/components/select/SelectField";

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

const stockMovementSchema = z
  .object({
    type: z.enum(["entry", "exit"], { message: "Type is required" }),
    product: z.string().min(1, "Product is required"),
    quantity: z.string().nonempty("Quantity is required"),
    reason: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "exit" && !data.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason is required for exit movements",
        path: ["reason"],
      });
    }
  });

const UpdateStockMovementModal = ({ isOpen, onClose, stockMovement, handleRefetch }: any) => {
    console.log(stockMovement)
  const { t } = useTranslation();
  const { updateStockMovement, loading, error } = useStockMovements();
  const { products, fetchProducts } = useProducts();

  useEffect(() => {

    fetchProducts("pageSize=1000000");
  }, [fetchProducts]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type: stockMovement?.type || "entry",
      product: stockMovement?.product?._id || "",
      quantity: stockMovement?.quantity.toString() || "",
      reason: stockMovement?.reason || "",
      notes: stockMovement?.notes || "",
    },
  });

  useEffect(() => {
    if (stockMovement) {
      reset({
        type: stockMovement.type,
        product: stockMovement.product?._id,
        quantity: stockMovement.quantity.toString(),
        reason: stockMovement.reason,
        notes: stockMovement.notes,
      });
    }
  }, [stockMovement, reset]);

  const watchType = watch("type") || "entry";

  const onSubmit = async (data: StockMovementFormData) => {
    try {
      const payload = {
        type: data.type,
        productId: data.product,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
        notes: data.notes || undefined,
      };

      await updateStockMovement(stockMovement._id, payload);
      handleRefetch();
      onClose();
      reset();
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
                <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                  <div className="font-bold text-lg">{t("stockMovements.updateStockMovement")}</div>
                </div>
                <div className="p-5">
                  {error && <div className="text-red-500">{error}</div>}

                  <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("stockMovements.type")}
                      </label>
                      <select
                        {...register("type")}
                        disabled={true}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none"
                      >
                        <option value="entry">{t("stockMovements.entry")}</option>
                        <option value="exit">{t("stockMovements.exit")}</option>
                      </select>
                      {errors.type && (
                        <p className="text-red-500 text-xs mt-1">{String(errors.type.message)}</p>
                      )}
                    </div>


                    <div className="mb-4">
                      <InputField
                        type="number"
                        label={t("stockMovements.quantity")}
                        placeholder={t("stockMovements.enterQuantity")}
                        registration={register("quantity")}
                        error={errors.quantity?.message}
                        name="quantity"
                      />
                    </div>


                    <div className="flex justify-end items-center mt-8">
                      <button type="button" onClick={onClose} className="btn btn-outline-danger">
                        {t("common.discard")}
                      </button>
                      <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={loading}>
                        {loading ? t("common.saving") : t("common.save")}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UpdateStockMovementModal;
