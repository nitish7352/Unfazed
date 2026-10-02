import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getProfileAPI,
  updateProfileAPI,
  updateAvatarAPI,
} from "../../api/profile";
import { updatePasswordAPI } from "../../api/auth";
import {
  getAvailabilityAPI,
  updateAvailabilityAPI,
} from "../../api/availability";
import { useToast } from "../../components/common/Toast";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Avatar from "../../components/common/Avatar";
import Spinner from "../../components/common/Spinner";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TABS = ["Profile", "Security", "Availability", "Subscription"];

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState([]);
  const [savingHours, setSavingHours] = useState(false);
  const toast = useToast();

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { isSubmitting: savingProfile },
  } = useForm();

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { isSubmitting: savingPassword },
  } = useForm();

  useEffect(() => {
    Promise.all([getProfileAPI(), getAvailabilityAPI()])
      .then(([profileRes, availRes]) => {
        const p = profileRes.data.data.profile;
        resetProfile({
          firstName: p.user?.firstName || "",
          lastName: p.user?.lastName || "",
          phone: p.user?.phone || "",
          bio: p.bio || "",
          licenseNumber: p.licenseNumber || "",
          licenseType: p.licenseType || "",
          yearsExperience: p.yearsExperience || "",
          practiceName: p.practiceName || "",
          timezone: p.timezone || "Asia/Kolkata",
          currency: p.currency || "INR",
          defaultSessionDuration: p.defaultSessionDuration || 50,
          defaultSessionRate: p.defaultSessionRate || 0,
          specializations: (p.specializations || []).join(", "),
          languages: (p.languages || []).join(", "),
          website: p.website || "",
        });

        // Ensure all 7 days are present
        const wh = availRes.data.data.workingHours || [];
        const full = [0, 1, 2, 3, 4, 5, 6].map((day) => {
          const found = wh.find((h) => h.day === day);
          return found || { day, enabled: false, start: "09:00", end: "17:00" };
        });
        setWorkingHours(full);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const onSaveProfile = async (data) => {
    try {
      await updateProfileAPI({
        ...data,
        specializations: data.specializations
          ? data.specializations
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        languages: data.languages
          ? data.languages
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        yearsExperience: Number(data.yearsExperience) || 0,
        defaultSessionDuration: Number(data.defaultSessionDuration) || 50,
        defaultSessionRate: Number(data.defaultSessionRate) || 0,
      });
      await refreshUser();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    }
  };

  const onChangePassword = async (data) => {
    try {
      await updatePasswordAPI({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated");
      resetPassword();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarLoading(true);
    try {
      await updateAvatarAPI(formData);
      await refreshUser();
      toast.success("Avatar updated");
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to upload avatar");
    } finally {
      setAvatarLoading(false);
    }
  };

  const updateHour = (day, field, value) => {
    setWorkingHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h)),
    );
  };

  const saveAvailability = async () => {
    setSavingHours(true);
    try {
      await updateAvailabilityAPI({ workingHours });
      toast.success("Availability saved");
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to save availability");
    } finally {
      setSavingHours(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">
        Settings
      </h2>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border)] -mx-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap
              ${
                activeTab === tab
                  ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-300"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Profile tab ──────────────────────────────────────────────────── */}
      {activeTab === "Profile" && (
        <div className="space-y-5">
          {/* Avatar */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Profile photo
            </h3>
            <div className="flex items-center gap-5">
              <Avatar
                src={user?.avatar}
                name={`${user?.firstName} ${user?.lastName}`}
                size="xl"
              />
              <div>
                <label className="cursor-pointer">
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius)] border
                    border-[var(--border)] text-sm font-medium hover:bg-slate-50 transition-colors
                    ${avatarLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {avatarLoading && <Spinner size="sm" />}
                    {avatarLoading ? "Uploading…" : "Change photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={avatarLoading}
                  />
                </label>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  JPG, PNG or GIF · Max 5 MB
                </p>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
              Personal &amp; practice info
            </h3>
            <form
              onSubmit={handleProfile(onSaveProfile)}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="firstName"
                  label="First name"
                  {...regProfile("firstName", { required: true })}
                />
                <Input
                  id="lastName"
                  label="Last name"
                  {...regProfile("lastName", { required: true })}
                />
              </div>
              <Input id="phone" label="Phone" {...regProfile("phone")} />
              <Input
                id="practiceName"
                label="Practice name"
                {...regProfile("practiceName")}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Bio
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none bg-white"
                  {...regProfile("bio")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="licenseNumber"
                  label="License number"
                  {...regProfile("licenseNumber")}
                />
                <Input
                  id="licenseType"
                  label="License type"
                  {...regProfile("licenseType")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="yearsExperience"
                  label="Years of experience"
                  type="number"
                  {...regProfile("yearsExperience")}
                />
                <Input
                  id="defaultSessionDuration"
                  label="Default duration (min)"
                  type="number"
                  {...regProfile("defaultSessionDuration")}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="defaultSessionRate"
                  label="Default rate (₹)"
                  type="number"
                  {...regProfile("defaultSessionRate")}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Timezone
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm
                    focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white appearance-none"
                    {...regProfile("timezone")}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">
                      America/New_York (EST)
                    </option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Australia/Sydney">
                      Australia/Sydney (AEST)
                    </option>
                  </select>
                </div>
              </div>
              <Input
                id="specializations"
                label="Specializations (comma-separated)"
                placeholder="Anxiety, Depression, CBT"
                {...regProfile("specializations")}
              />
              <Input
                id="languages"
                label="Languages (comma-separated)"
                placeholder="English, Hindi"
                {...regProfile("languages")}
              />
              <Input
                id="website"
                label="Website"
                type="url"
                {...regProfile("website")}
              />

              <div className="flex justify-end">
                <Button type="submit" loading={savingProfile}>
                  Save profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Security tab ─────────────────────────────────────────────────── */}
      {activeTab === "Security" && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            Change password
          </h3>
          <form
            onSubmit={handlePassword(onChangePassword)}
            noValidate
            className="space-y-4"
          >
            <Input
              id="currentPassword"
              label="Current password"
              type="password"
              autoComplete="current-password"
              {...regPassword("currentPassword", { required: true })}
            />
            <Input
              id="newPassword"
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              {...regPassword("newPassword", { required: true, minLength: 6 })}
            />
            <Input
              id="confirmNewPassword"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              {...regPassword("confirmNewPassword", { required: true })}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={savingPassword}>
                Update password
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Availability tab ─────────────────────────────────────────────── */}
      {activeTab === "Availability" && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Working hours
            </h3>
            <Button size="sm" loading={savingHours} onClick={saveAvailability}>
              Save
            </Button>
          </div>
          <div className="space-y-3">
            {workingHours.map((h) => (
              <div key={h.day} className="flex items-center gap-4 flex-wrap">
                {/* Toggle */}
                <label className="flex items-center gap-2 cursor-pointer w-32 flex-shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={h.enabled}
                    onClick={() => updateHour(h.day, "enabled", !h.enabled)}
                    className={`relative inline-flex w-9 h-5 rounded-full transition-colors flex-shrink-0
                      ${h.enabled ? "bg-[var(--primary)]" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow
                      transition-transform ${h.enabled ? "translate-x-4" : ""}`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium ${h.enabled ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
                  >
                    {DAYS[h.day]}
                  </span>
                </label>

                {h.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.start}
                      onChange={(e) =>
                        updateHour(h.day, "start", e.target.value)
                      }
                      className="px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm
                        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                      aria-label={`${DAYS[h.day]} start time`}
                    />
                    <span className="text-[var(--text-muted)] text-sm">to</span>
                    <input
                      type="time"
                      value={h.end}
                      onChange={(e) => updateHour(h.day, "end", e.target.value)}
                      className="px-2 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-sm
                        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                      aria-label={`${DAYS[h.day]} end time`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-[var(--text-muted)] italic">
                    Unavailable
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Subscription tab ─────────────────────────────────────────────── */}
      {activeTab === "Subscription" && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            Manage your plan and billing
          </p>
          <Link to="/settings/subscription">
            <Button>View subscription plans</Button>
          </Link>
          <div className="mt-4 p-4 bg-[var(--primary-light)] rounded-[var(--radius)] text-sm text-[var(--primary)]">
            Current plan:{" "}
            <strong className="capitalize">
              {user?.subscription?.plan || "Free"}
            </strong>
            {" · "}
            <span className="capitalize">
              {user?.subscription?.status || "Trial"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
