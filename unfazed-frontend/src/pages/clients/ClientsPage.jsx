import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getClientsAPI, deleteClientAPI } from "../../api/clients";
import { useToast } from "../../components/common/Toast";
import { isSessionExpired } from "../../utils/apiError";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import Modal from "../../components/common/Modal";
import ClientForm from "../../components/clients/ClientForm";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClientsAPI({
        search,
        status: statusFilter,
        limit: 100,
      });
      setClients(data.data);
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this client?")) return;
    try {
      await deleteClientAPI(id);
      toast.success("Client archived");
      fetchClients();
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to archive client");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Clients
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {clients.length} total
          </p>
        </div>
        <Button
          onClick={() => {
            setEditClient(null);
            setShowForm(true);
          }}
        >
          + Add client
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3 flex-wrap p-4 bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)]">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-64 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
            aria-label="Search clients"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44 px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] bg-white text-[var(--text-primary)] appearance-none"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discharged">Discharged</option>
          <option value="waitlist">Waitlist</option>
          <option value="on_hold">On hold</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : clients.length === 0 ? (
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
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No clients yet
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">
              Add your first client to get started.
            </p>
            <Button className="mt-5" onClick={() => setShowForm(true)}>
              Add client
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full" role="table">
              <thead className="bg-slate-50 border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {clients.map((client) => (
                  <tr
                    key={client._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        to={`/clients/${client._id}`}
                        className="flex items-center gap-3 hover:text-[var(--primary)]"
                      >
                        <Avatar
                          src={client.avatar}
                          name={client.fullName}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {client.fullName}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Added{" "}
                            {new Date(client.createdAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-[var(--text-secondary)]">
                        {client.email || "—"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {client.phone || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={client.status}
                        color={statusColor(client.status)}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                      {client.totalSessions}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditClient(client);
                            setShowForm(true);
                          }}
                          aria-label={`Edit ${client.fullName}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(client._id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Archive ${client.fullName}`}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditClient(null);
        }}
        title={editClient ? "Edit client" : "Add new client"}
        size="lg"
      >
        <ClientForm
          client={editClient}
          onSuccess={() => {
            setShowForm(false);
            setEditClient(null);
            fetchClients();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditClient(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default ClientsPage;
