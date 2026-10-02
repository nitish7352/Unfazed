import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { createClientAPI, updateClientAPI } from "../../api/clients";
import { useToast } from "../common/Toast";
import Button from "../common/Button";
import Input from "../common/Input";

const selectCls =
  "w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-[var(--text-primary)] appearance-none";
const labelCls = "text-sm font-medium text-[var(--text-primary)]";
const textareaCls =
  "w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none bg-white";

const ClientForm = ({ client, onSuccess, onCancel }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const toast = useToast();

  useEffect(() => {
    if (client) {
      reset({
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        gender: client.gender || "prefer_not_to_say",
        status: client.status || "active",
        sessionRate: client.sessionRate || "",
        sessionDuration: client.sessionDuration || "",
        notes: client.notes || "",
      });
    } else {
      reset({ gender: "prefer_not_to_say", status: "active" });
    }
  }, [client, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        sessionRate: formData.sessionRate ? Number(formData.sessionRate) : null,
        sessionDuration: formData.sessionDuration
          ? Number(formData.sessionDuration)
          : null,
      };

      if (client) {
        await updateClientAPI(client._id, payload);
        toast.success("Client updated");
      } else {
        await createClientAPI(payload);
        toast.success("Client added");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save client");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="firstName"
          label="First name"
          required
          error={errors.firstName?.message}
          {...register("firstName", { required: "First name is required" })}
        />
        <Input
          id="lastName"
          label="Last name"
          required
          error={errors.lastName?.message}
          {...register("lastName", { required: "Last name is required" })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="email"
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register("email", {
            pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
          })}
        />
        <Input id="phone" label="Phone" {...register("phone")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="gender" className={labelCls}>
            Gender
          </label>
          <select id="gender" className={selectCls} {...register("gender")}>
            <option value="prefer_not_to_say">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className={labelCls}>
            Status
          </label>
          <select id="status" className={selectCls} {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="waitlist">Waitlist</option>
            <option value="on_hold">On hold</option>
            <option value="discharged">Discharged</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="sessionRate"
          label="Session rate (₹)"
          type="number"
          min="0"
          placeholder="Leave blank for profile default"
          {...register("sessionRate")}
        />
        <Input
          id="sessionDuration"
          label="Session duration (min)"
          type="number"
          min="1"
          placeholder="Leave blank for profile default"
          {...register("sessionDuration")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelCls}>
          Internal notes
        </label>
        <textarea
          id="notes"
          rows={3}
          className={textareaCls}
          placeholder="Private notes visible only to you…"
          {...register("notes")}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {client ? "Save changes" : "Add client"}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
