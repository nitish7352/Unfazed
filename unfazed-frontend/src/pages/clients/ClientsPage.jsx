import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getClientsAPI, deleteClientAPI } from '../../api/clients';
import { useToast } from '../../components/common/Toast';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import ClientForm from '../../components/clients/ClientForm';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getClientsAPI({ search, status: statusFilter, limit: 100 });
      setClients(data.data);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this client?')) return;
    try {
      await deleteClientAPI(id);
      toast.success('Client archived');
      fetchClients();
    } catch { toast.error('Failed to archive client'); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-500">{clients.length} total</p>
        </div>
        <Button onClick={() => { setEditClient(null); setShowForm(true); }}>
          + Add client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          aria-label="Search clients"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="lg" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No clients found.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Add your first client</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200" role="table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/clients/${client._id}`} className="flex items-center gap-3 hover:text-indigo-600">
                        <Avatar src={client.avatar} name={client.fullName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{client.fullName}</p>
                          <p className="text-xs text-slate-400">
                            Added {new Date(client.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{client.email || '—'}</p>
                      <p className="text-xs text-slate-400">{client.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge label={client.status} color={statusColor(client.status)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{client.totalSessions}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditClient(client); setShowForm(true); }}
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
        onClose={() => { setShowForm(false); setEditClient(null); }}
        title={editClient ? 'Edit client' : 'Add new client'}
        size="lg"
      >
        <ClientForm
          client={editClient}
          onSuccess={() => { setShowForm(false); setEditClient(null); fetchClients(); }}
          onCancel={() => { setShowForm(false); setEditClient(null); }}
        />
      </Modal>
    </div>
  );
};

export default ClientsPage;
