import { useEffect, useState } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { getClientAPI } from "../../api/clients";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Spinner from "../../components/common/Spinner";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import ClientForm from "../../components/clients/ClientForm";
import { useToast } from "../../components/common/Toast";

const InfoRow = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-sm text-[var(--text-muted)] w-40 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-[var(--text-primary)]">{value || "—"}</span>
  </div>
);

const ClientDetailPage = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const toast = useToast();

  const fetchClient = async () => {
    setLoading(true);
    try {
      const { data } = await getClientAPI(id);
      setClient(data.data.client);
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to load client");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Spinner size="lg" />
      </div>
    );
  if (!client)
    return (
      <div className="text-[var(--text-secondary)] text-center py-16">
        Client not found.
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav
        className="text-sm text-[var(--text-secondary)]"
        aria-label="Breadcrumb"
      >
        <Link
          to="/clients"
          className="hover:text-[var(--primary)] transition-colors"
        >
          Clients
        </Link>
        <span className="mx-2 text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)]">{client.fullName}</span>
      </nav>

      {/* Profile header */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 flex items-start gap-5">
        <Avatar src={client.avatar} name={client.fullName} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {client.fullName}
            </h2>
            <Badge label={client.status} color={statusColor(client.status)} />
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {client.email && (
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {client.phone}
              </span>
            )}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="text-sm text-[var(--text-secondary)]">
              {client.totalSessions} sessions
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              ₹{client.totalAmountPaid?.toLocaleString("en-IN") || 0} paid
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          Edit
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Personal details
          </h3>
          <div className="space-y-2">
            <InfoRow
              label="Date of birth"
              value={
                client.dateOfBirth
                  ? format(new Date(client.dateOfBirth), "MMM d, yyyy")
                  : null
              }
            />
            <InfoRow label="Gender" value={client.gender} />
            <InfoRow label="Timezone" value={client.timezone} />
            <InfoRow
              label="Added on"
              value={format(new Date(client.createdAt), "MMM d, yyyy")}
            />
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Session settings
          </h3>
          <div className="space-y-2">
            <InfoRow
              label="Session rate"
              value={
                client.sessionRate
                  ? `₹${client.sessionRate}`
                  : "Profile default"
              }
            />
            <InfoRow
              label="Duration"
              value={
                client.sessionDuration
                  ? `${client.sessionDuration} min`
                  : "Profile default"
              }
            />
          </div>
        </div>
      </div>

      {/* Intake form summary */}
      {client.intakeForm?.completedAt && (
        <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Intake form
          </h3>
          <div className="space-y-2">
            <InfoRow
              label="Presenting concerns"
              value={client.intakeForm.presentingConcerns}
            />
            <InfoRow label="Goals" value={client.intakeForm.goals} />
            <InfoRow
              label="Previous therapy"
              value={client.intakeForm.previousTherapy ? "Yes" : "No"}
            />
          </div>
        </div>
      )}

      {/* Internal notes */}
      {client.notes && (
        <div className="bg-[var(--warning-light)] border border-amber-200 rounded-[var(--radius-lg)] p-5">
          <h3 className="font-semibold text-amber-900 mb-2">Internal notes</h3>
          <p className="text-sm text-amber-800 whitespace-pre-wrap">
            {client.notes}
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Link to={`/sessions?clientId=${client._id}`}>
          <Button variant="outline" size="sm">
            View sessions
          </Button>
        </Link>
        <Link to={`/notes?clientId=${client._id}`}>
          <Button variant="outline" size="sm">
            View notes
          </Button>
        </Link>
        <Link to={`/billing?clientId=${client._id}`}>
          <Button variant="outline" size="sm">
            View invoices
          </Button>
        </Link>
      </div>

      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit client"
        size="lg"
      >
        <ClientForm
          client={client}
          onSuccess={() => {
            setShowEdit(false);
            fetchClient();
          }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
};

export default ClientDetailPage;
