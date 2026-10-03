import { useEffect, useState, useCallback } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { getSessionsAPI, cancelSessionAPI } from "../../api/sessions";
import { useToast } from "../../components/common/Toast";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import SessionForm from "../../components/sessions/SessionForm";

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get("clientId");
  const toast = useToast();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (clientIdFilter) params.clientId = clientIdFilter;
      const { data } = await getSessionsAPI(params);
      setSessions(data.data);
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [clientIdFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCancel = async (id) => {
    const reason = window.prompt("Reason for cancellation (optional):");
    if (reason === null) return; // user pressed Cancel on prompt
    try {
      await cancelSessionAPI(id, { reason, cancelledBy: "therapist" });
      toast.success("Session cancelled");
      fetchSessions();
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to cancel session");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Sessions
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {sessions.length} total
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Schedule session</Button>
      </div>

      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <Spinner size="lg" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 text-[var(--text-muted)] mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No sessions scheduled yet
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">
              Schedule your first session to get started.
            </p>
            <Button className="mt-5" onClick={() => setShowForm(true)}>
              Schedule first session
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Date &amp; time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sessions.map((s) => (
                  <tr
                    key={s._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/sessions/${s._id}`}
                        className="flex items-center gap-3 hover:text-[var(--primary)]"
                      >
                        <Avatar
                          src={s.client?.avatar}
                          name={`${s.client?.firstName} ${s.client?.lastName}`}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {s.client?.firstName} {s.client?.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {format(new Date(s.startTime), "MMM d, yyyy")}
                      <br />
                      <span className="text-xs text-[var(--text-muted)]">
                        {format(new Date(s.startTime), "h:mm a")} · {s.duration}{" "}
                        min
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] capitalize">
                      {s.type} / {s.modality}
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={s.status} color={statusColor(s.status)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      ₹{s.rate?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <Link to={`/sessions/${s._id}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                        {/* Live Session button — always visible for active sessions */}
                        {["scheduled", "confirmed", "in_progress"].includes(
                          s.status,
                        ) &&
                          s.roomId && (
                            <Link to={`/session/room/${s.roomId}`}>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                              >
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                                </span>
                                Join Live
                              </Button>
                            </Link>
                          )}
                        {["scheduled", "confirmed"].includes(s.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancel(s._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Schedule session"
        size="md"
      >
        <SessionForm
          onSuccess={() => {
            setShowForm(false);
            fetchSessions();
          }}
          onCancel={() => setShowForm(false)}
          defaultClientId={clientIdFilter}
        />
      </Modal>
    </div>
  );
};

export default SessionsPage;
