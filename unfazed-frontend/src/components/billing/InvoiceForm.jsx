import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { createInvoiceAPI } from "../../api/invoices";
import { getClientsAPI } from "../../api/clients";
import { useToast } from "../common/Toast";
import Button from "../common/Button";
import Input from "../common/Input";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-[var(--text-primary)] appearance-none";
const labelCls = "text-sm font-medium text-[var(--text-primary)]";

const InvoiceForm = ({ defaultClientId, onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      clientId: defaultClientId || "",
      lineItems: [
        {
          description: "Therapy session",
          quantity: 1,
          unitPrice: "",
          total: "",
        },
      ],
      tax: 0,
      discount: 0,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });
  const [clients, setClients] = useState([]);
  const toast = useToast();

  useEffect(() => {
    getClientsAPI({ limit: 200 })
      .then(({ data }) => setClients(data.data))
      .catch(() => {});
  }, []);

  const lineItems = watch("lineItems");
  const tax = Number(watch("tax")) || 0;
  const discount = Number(watch("discount")) || 0;
  const subtotal = lineItems.reduce(
    (s, item) => s + (Number(item.quantity) * Number(item.unitPrice) || 0),
    0,
  );
  const total = subtotal + tax - discount;

  const onSubmit = async (data) => {
    try {
      const items = data.lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.quantity) * Number(item.unitPrice),
      }));
      await createInvoiceAPI({
        clientId: data.clientId,
        lineItems: items,
        tax: Number(data.tax) || 0,
        discount: Number(data.discount) || 0,
        notes: data.notes,
      });
      toast.success("Invoice created");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className={labelCls}>
          Client <span className="text-[var(--error)]">*</span>
        </label>
        <select
          className={selectCls}
          {...register("clientId", { required: true })}
        >
          <option value="">Select client…</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls}>Line items</label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              append({ description: "", quantity: 1, unitPrice: "", total: "" })
            }
          >
            + Add line
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <input
                  placeholder="Description"
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
                  {...register(`lineItems.${i}.description`, {
                    required: true,
                  })}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
                  {...register(`lineItems.${i}.quantity`, {
                    required: true,
                    min: 1,
                  })}
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Unit price (₹)"
                  className="w-full px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white"
                  {...register(`lineItems.${i}.unitPrice`, { required: true })}
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <span className="text-sm text-[var(--text-secondary)]">
                  ₹
                  {(
                    (Number(lineItems[i]?.quantity) || 0) *
                    (Number(lineItems[i]?.unitPrice) || 0)
                  ).toLocaleString("en-IN")}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="ml-2 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors text-xs"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="tax"
          label="Tax (₹)"
          type="number"
          min="0"
          {...register("tax")}
        />
        <Input
          id="discount"
          label="Discount (₹)"
          type="number"
          min="0"
          {...register("discount")}
        />
      </div>

      <div className="bg-slate-50 rounded-[var(--radius)] p-4 text-sm space-y-1.5">
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Tax</span>
            <span>+ ₹{tax.toLocaleString("en-IN")}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Discount</span>
            <span>- ₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[var(--text-primary)] border-t border-[var(--border)] pt-2 mt-1">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelCls}>Notes</label>
        <textarea
          rows={2}
          placeholder="Payment terms, notes…"
          className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none bg-white"
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create invoice
        </Button>
      </div>
    </form>
  );
};

export default InvoiceForm;
