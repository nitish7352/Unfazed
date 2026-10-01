import { useEffect, useState, useCallback } from 'react';
import { isSessionExpired } from '../../utils/apiError';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { getNotesAPI } from '../../api/notes';
import { useToast } from '../../components/common/Toast';
import Avatar from '../../components/common/Avatar';
import Badge, { statusColor } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get('clientId');
  const toast = useToast();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (clientIdFilter) params.clientId = clientIdFilter;
      if (search) params.search = search;
      const { data } = await getNotesAPI(params);
      setNotes(data.data);
    } catch (err) { if (!isSessionExpired(err)) toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  }, [clientIdFilter, search]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Session Notes</h2>
          <p className="text-sm text-slate-500">{notes.length} notes</p>
        </div>
      </div>

      <input
        type="search"
        placeholder="Search notes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        aria-label="Search notes"
      />

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center h-48 items-center"><Spinner size="lg" /></div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 text-center py-16">
            <p className="text-slate-400">No session notes yet.</p>
            <p className="text-sm text-slate-400 mt-1">Notes are created from within a session.</p>
            <Link to="/sessions" className="text-indigo-600 text-sm font-medium mt-2 inline-block hover:underline">
              Go to sessions →
            </Link>
          </div>
        ) : (
          notes.map((note) => (
            <Link
              key={note._id}
              to={`/notes/${note._id}`}
              className="block bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={note.client?.avatar}
                  name={`${note.client?.firstName} ${note.client?.lastName}`}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">
                      {note.client?.firstName} {note.client?.lastName}
                    </span>
                    {note.isSigned && (
                      <Badge label="Signed" color="green" />
                    )}
                    <Badge label={note.format.toUpperCase()} color="purple" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {note.session
                      ? format(new Date(note.session.startTime), 'MMM d, yyyy · h:mm a')
                      : format(new Date(note.createdAt), 'MMM d, yyyy')}
                    {' · '}{note.session?.type} · {note.session?.modality}
                  </p>
                  {note.subjective && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{note.subjective}</p>
                  )}
                  {!note.subjective && note.content && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: note.content.slice(0, 200) }} />
                  )}
                </div>
                {note.clientMood && (
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-xs text-slate-400">Mood</span>
                    <span className="text-lg font-bold text-indigo-600">{note.clientMood}/10</span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPage;
