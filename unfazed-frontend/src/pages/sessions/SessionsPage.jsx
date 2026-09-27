import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getSessionsAPI, cancelSessionAPI } from '../../api/sessions';
import { useToast } from '../../components/common/Toast';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import SessionForm from '../../components/sessions/SessionForm';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');
  const toast = useToast();

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (clientIdFilter) params.clientId = clientIdFilter;
      const { data } = await getSessionsAPI(params);
      setSessions(data.data);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [clientIdFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleCancel = async (id) => {
    const reason = window.prompt('Reason for cancellation (optional):');
    if (reason === null) return; // user pressed Cancel on prompt
    try {
      await cancelSessionAPI(id, { reason, cancelledBy: 'therapist' });
      toast.success('Session cancelled');
      fetchSessions();
    } catch { toast.error('Failed to cancel session'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sessions</h2>
          <p className="text-sm text-slate-500">{sessions.length} total</p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Schedule session</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center h-48 items-center"><Spinner size="lg" /></div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400">No sessions found.</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Schedule first session</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date & time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link to={`/sessions/${s._id}`} className="flex items-center gap-3 hover:text-indigo-600">
                        <Avatar src={s.client?.avatar} name={`${s.client?.firstName} ${s.client?.lastName}`} size="sm" />
                        <span className="text-sm font-medium text-slate-900">
                          {s.client?.firstName} {s.client?.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {format(new Date(s.startTime), 'MMM d, yyyy')}
                      <br />
                      <span className="text-xs text-slate-400">
                        {format(new Date(s.startTime), 'h:mm a')} · {s.duration} min
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.type} / {s.modality}</td>
                    <td className="px-6 py-4">
                      <Badge label={s.status} color={statusColor(s.status)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">₹{s.rate?.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link to={`/sessions/${s._id}`}>
                          <Button size="sm" variant="ghost">View</Button>
                        </Link>
                        {['scheduled', 'confirmed'].includes(s.status) && (
                          <Button size="sm" variant="ghost" onClick={() => handleCancel(s._id)}
                            className="text-red-500 hover:text-red-700">
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Schedule session" size="md">
        <SessionForm
          onSuccess={() => { setShowForm(false); fetchSessions(); }}
          onCancel={() => setShowForm(false)}
          defaultClientId={clientIdFilter}
        />
      </Modal>
    </div>
  );
};

export default SessionsPage;
