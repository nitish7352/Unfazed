import { useEffect, useState } from 'react';
import { isSessionExpired } from '../../utils/apiError';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getSessionAPI, cancelSessionAPI, completeSessionAPI } from '../../api/sessions';
import { useToast } from '../../components/common/Toast';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const SessionDetailPage = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    getSessionAPI(id)
      .then(({ data }) => setSession(data.data.session))
      .catch(() => toast.error('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    const reason = window.prompt('Reason for cancellation:');
    if (reason === null) return;
    try {
      await cancelSessionAPI(id, { reason, cancelledBy: 'therapist' });
      toast.success('Session cancelled');
      setSession((s) => ({ ...s, status: 'cancelled' }));
    } catch (err) { if (!isSessionExpired(err)) toast.error('Failed to cancel'); }
  };

  const handleComplete = async () => {
    try {
      await completeSessionAPI(id);
      toast.success('Session marked complete');
      setSession((s) => ({ ...s, status: 'completed' }));
    } catch (err) { if (!isSessionExpired(err)) toast.error('Failed to update session'); }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><Spinner size="lg" /></div>;
  if (!session) return <div className="text-slate-500 text-center py-16">Session not found.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="text-sm text-slate-500">
        <Link to="/sessions" className="hover:text-indigo-600">Sessions</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Session detail</span>
      </nav>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={session.client?.avatar}
              name={`${session.client?.firstName} ${session.client?.lastName}`}
              size="lg"
            />
            <div>
              <Link to={`/clients/${session.client?._id}`} className="text-xl font-bold text-slate-900 hover:text-indigo-600">
                {session.client?.firstName} {session.client?.lastName}
              </Link>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(session.startTime), 'EEEE, MMMM d, yyyy · h:mm a')}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge label={session.status} color={statusColor(session.status)} />
                <Badge label={session.paymentStatus} color={statusColor(session.paymentStatus)} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {session.status === 'scheduled' && (
              <Button variant="primary" size="sm" onClick={() => navigate(`/session/room/${session.roomId}`)}>
                🎥 Start session
              </Button>
            )}
            {['scheduled', 'confirmed'].includes(session.status) && (
              <>
                <Button variant="outline" size="sm" onClick={handleComplete}>Mark complete</Button>
                <Button variant="ghost" size="sm" className="text-red-500" onClick={handleCancel}>Cancel</Button>
              </>
            )}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Type',     value: session.type },
            { label: 'Modality', value: session.modality },
            { label: 'Duration', value: `${session.duration} min` },
            { label: 'Rate',     value: `₹${session.rate?.toLocaleString('en-IN')}` },
            { label: 'Payment',  value: session.paymentStatus },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-slate-500 uppercase tracking-wider">{label}</dt>
              <dd className="text-sm font-medium text-slate-900 mt-0.5 capitalize">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Session notes link */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Session notes</h3>
          <Link to={`/notes/session/${session._id}`}>
            <Button size="sm" variant={session.noteId ? 'outline' : 'primary'}>
              {session.noteId ? 'View / edit notes' : 'Write notes'}
            </Button>
          </Link>
        </div>
        {!session.noteId && (
          <p className="text-sm text-slate-400 mt-2">No notes written yet for this session.</p>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage;
