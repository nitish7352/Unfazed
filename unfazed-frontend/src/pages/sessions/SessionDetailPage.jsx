import { useEffect, useState } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  getSessionAPI,
  cancelSessionAPI,
  completeSessionAPI,
} from "../../api/sessions";
import { useToast } from "../../components/common/Toast";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";

const SessionDetailPage = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    getSessionAPI(id)
      .then(({ data }) => setSession(data.data.session))
      .catch(() => toast.error("Session not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    const reason = window.prompt("Reason for cancellation:");
    if (reason === null) return;
    try {
      await cancelSessionAPI(id, { reason, cancelledBy: "therapist" });
      toast.success("Session cancelled");
      setSession((s) => ({ ...s, status: "cancelled" }));
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to cancel");
    }
  };

  const handleComplete = async () => {
    try {
      await completeSessionAPI(id);
      toast.success("Session marked complete");
      setSession((s) => ({ ...s, status: "completed" }));
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to update session");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Spinner size="lg" />
      </div>
    );
  if (!session)
    return (
      <div className="text-[var(--text-secondary)] text-center py-16">
        Session not found.
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl">
      <nav
        className="text-sm text-[var(--text-secondary)]"
        aria-label="Breadcrumb"
      >
        <Link
          to="/sessions"
          className="hover:text-[var(--primary)] transition-colors"
        >
          Sessions
        </Link>
        <span className="mx-2 text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)]">Session detail</span>
      </nav>

      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={session.client?.avatar}
              name={`${session.client?.firstName} ${session.client?.lastName}`}
              size="lg"
            />
            <div>
              <Link
                to={`/clients/${session.client?._id}`}
                className="text-xl font-bold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
              >
                {session.client?.firstName} {session.client?.lastName}
              </Link>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {format(
                  new Date(session.startTime),
                  "EEEE, MMMM d, yyyy · h:mm a",
                )}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge
                  label={session.status}
                  color={statusColor(session.status)}
                />
                <Badge
                  label={session.paymentStatus}
                  color={statusColor(session.paymentStatus)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Live session button — visible for all active sessions */}
            {["scheduled", "confirmed", "in_progress"].includes(
              session.status,
            ) &&
              session.roomId && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                  onClick={() => navigate(`/session/room/${session.roomId}`)}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  Join Live Session
                </Button>
              )}
            {["scheduled", "confirmed"].includes(session.status) && (
              <>
                <Button variant="outline" size="sm" onClick={handleComplete}>
                  Mark complete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <hr className="border-[var(--border)] my-5" />

        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Type", value: session.type },
            { label: "Modality", value: session.modality },
            { label: "Duration", value: `${session.duration} min` },
            {
              label: "Rate",
              value: `₹${session.rate?.toLocaleString("en-IN")}`,
            },
            { label: "Payment", value: session.paymentStatus },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {label}
              </dt>
              <dd className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 capitalize">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Session notes link */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Session notes
          </h3>
          <Link to={`/notes/session/${session._id}`}>
            <Button size="sm" variant={session.noteId ? "outline" : "primary"}>
              {session.noteId ? "View / edit notes" : "Write notes"}
            </Button>
          </Link>
        </div>
        {!session.noteId && (
          <p className="text-sm text-[var(--text-muted)] mt-2">
            No notes written yet for this session.
          </p>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage;
