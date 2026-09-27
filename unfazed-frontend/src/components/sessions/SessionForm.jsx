import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { createSessionAPI } from "../../api/sessions";
import { getClientsAPI } from "../../api/clients";
import { useToast } from "../common/Toast";
import Button from "../common/Button";
import Input from "../common/Input";

const SessionForm = ({
  onSuccess,
  onCancel,
  defaultClientId,
  defaultStartTime,
}) => {
  const defaultStart = defaultStartTime
    ? format(new Date(defaultStartTime), "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'HH:mm");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      clientId: defaultClientId || "",
      startTime: defaultStart,
      duration: 50,
      type: "individual",
      modality: "video",
    },
  });
  const [clients, setClients] = useState([]);
  const toast = useToast();

  useEffect(() => {
    getClientsAPI({ status: "active", limit: 200 })
      .then(({ data }) => setClients(data.data))
      .catch(() => {});
  }, []);

  const onSubmit = async (formData) => {
    try {
      await createSessionAPI({
        clientId: formData.clientId,
        startTime: formData.startTime,
        duration: Number(formData.duration),
        type: formData.type,
        modality: formData.modality,
        rate: formData.rate ? Number(formData.rate) : undefined,
      });
      toast.success("Session scheduled");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule session");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="clientId"
          className="text-sm font-medium text-slate-700"
        >
          Client <span className="text-red-500">*</span>
        </label>
        <select
          id="clientId"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("clientId", { required: "Client is required" })}
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        {errors.clientId && (
          <p className="text-xs text-red-500">{errors.clientId.message}</p>
        )}
      </div>

      <Input
        id="startTime"
        label="Date & time"
        type="datetime-local"
        required
        error={errors.startTime?.message}
        {...register("startTime", { required: "Date and time is required" })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="duration"
          label="Duration (minutes)"
          type="number"
          min="15"
          max="240"
          error={errors.duration?.message}
          {...register("duration", { required: true, min: 15 })}
        />
        <Input
          id="rate"
          label="Rate (₹) — optional"
          type="number"
          min="0"
          placeholder="Profile default"
          {...register("rate")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="type" className="text-sm font-medium text-slate-700">
            Session type
          </label>
          <select
            id="type"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("type")}
          >
            <option value="individual">Individual</option>
            <option value="couples">Couples</option>
            <option value="family">Family</option>
            <option value="group">Group</option>
            <option value="initial">Initial consultation</option>
            <option value="crisis">Crisis</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="modality"
            className="text-sm font-medium text-slate-700"
          >
            Modality
          </label>
          <select
            id="modality"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("modality")}
          >
            <option value="video">Video</option>
            <option value="in_person">In-person</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Schedule
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;
