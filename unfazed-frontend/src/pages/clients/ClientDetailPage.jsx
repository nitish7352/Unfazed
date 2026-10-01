import { useEffect, useState } from 'react';
import { isSessionExpired } from '../../utils/apiError';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getClientAPI } from '../../api/clients';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ClientForm from '../../components/clients/ClientForm';
import { useToast } from '../../components/common/Toast';

const InfoRow = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-sm text-slate-500 w-36 flex-shrink-0">{label}</span>
    <span className="text-sm text-slate-900">{value || '—'}</span>
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
    } catch (err) { if (!isSessionExpired(err)) toast.error('Failed to load client'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClient(); }, [id]);

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" /></div>;
  if (!client) return <div className="text-slate-500 text-center py-16">Client not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link to="/clients" className="hover:text-indigo-600">Clients</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{client.fullName}</span>
      </nav>

      {/* Profile header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-start gap-5">
        <Avatar src={client.avatar} name={client.fullName} size="xl" />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-900">{client.fullName}</h2>
            <Badge label={client.status} color={statusColor(client.status)} />
          </div>
          <div className="flex flex-wrap gap-4 mt-2">
            {client.email && <span className="text-sm text-slate-500">✉ {client.email}</span>}
            {client.phone && <span className="text-sm text-slate-500">📞 {client.phone}</span>}
          </div>
          <div className="flex gap-4 mt-3">
            <span className="text-sm text-slate-500">{client.totalSessions} sessions</span>
            <span className="text-sm text-slate-500">
              ₹{client.totalAmountPaid?.toLocaleString('en-IN') || 0} paid
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>Edit</Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Personal details</h3>
          <div className="space-y-2">
            <InfoRow label="Date of birth"
              value={client.dateOfBirth ? format(new Date(client.dateOfBirth), 'MMM d, yyyy') : null} />
            <InfoRow label="Gender" value={client.gender} />
            <InfoRow label="Timezone" value={client.timezone} />
            <InfoRow label="Added on"
              value={format(new Date(client.createdAt), 'MMM d, yyyy')} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Session settings</h3>
          <div className="space-y-2">
            <InfoRow label="Session rate"
              value={client.sessionRate ? `₹${client.sessionRate}` : 'Profile default'} />
            <InfoRow label="Duration"
              value={client.sessionDuration ? `${client.sessionDuration} min` : 'Profile default'} />
          </div>
        </div>
      </div>

      {/* Intake form summary */}
      {client.intakeForm?.completedAt && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Intake form</h3>
          <div className="space-y-2">
            <InfoRow label="Presenting concerns" value={client.intakeForm.presentingConcerns} />
            <InfoRow label="Goals" value={client.intakeForm.goals} />
            <InfoRow label="Previous therapy" value={client.intakeForm.previousTherapy ? 'Yes' : 'No'} />
          </div>
        </div>
      )}

      {/* Internal notes */}
      {client.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="font-semibold text-amber-900 mb-2">Internal notes</h3>
          <p className="text-sm text-amber-800 whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <Link to={`/sessions?clientId=${client._id}`}>
          <Button variant="outline" size="sm">View sessions</Button>
        </Link>
        <Link to={`/notes?clientId=${client._id}`}>
          <Button variant="outline" size="sm">View notes</Button>
        </Link>
        <Link to={`/billing?clientId=${client._id}`}>
          <Button variant="outline" size="sm">View invoices</Button>
        </Link>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit client" size="lg">
        <ClientForm
          client={client}
          onSuccess={() => { setShowEdit(false); fetchClient(); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
};

export default ClientDetailPage;
