import { useEffect, useState, useCallback } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { getNotesAPI } from "../../api/notes";
import { useToast } from "../../components/common/Toast";
import Avatar from "../../components/common/Avatar";
import Badge, { statusColor } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const clientIdFilter = searchParams.get("clientId");
  const toast = useToast();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (clientIdFilter) params.clientId = clientIdFilter;
      if (search) params.search = search;
      const { data } = await getNotesAPI(params);
      setNotes(data.data);
    } catch (err) {
      if (!isSessionExpired(err)) toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [clientIdFilter, search]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Session Notes
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {notes.length} notes
          </p>
        </div>
      </div>

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
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] w-64 bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
          aria-label="Search notes"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center h-48 items-center">
            <Spinner size="lg" />
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col items-center justify-center py-16 text-center">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              No session notes yet
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">
              Notes are created from within a session.
            </p>
            <Link to="/sessions" className="mt-4">
              <Button variant="outline" size="sm">
                Go to sessions
              </Button>
            </Link>
          </div>
        ) : (
          notes.map((note) => (
            <Link
              key={note._id}
              to={`/notes/${note._id}`}
              className="block bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-5 hover:shadow-[var(--shadow-md)] hover:border-[var(--primary)]/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <Avatar
                  src={note.client?.avatar}
                  name={`${note.client?.firstName} ${note.client?.lastName}`}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[var(--text-primary)]">
                      {note.client?.firstName} {note.client?.lastName}
                    </span>
                    {note.isSigned && <Badge label="Signed" color="green" />}
                    <Badge label={note.format.toUpperCase()} color="purple" />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {note.session
                      ? format(
                          new Date(note.session.startTime),
                          "MMM d, yyyy · h:mm a",
                        )
                      : format(new Date(note.createdAt), "MMM d, yyyy")}
                    {" · "}
                    {note.session?.type} · {note.session?.modality}
                  </p>
                  {note.subjective && (
                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                      {note.subjective}
                    </p>
                  )}
                  {!note.subjective && note.content && (
                    <p
                      className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: note.content.slice(0, 200),
                      }}
                    />
                  )}
                </div>
                {note.clientMood && (
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-xs text-[var(--text-muted)]">
                      Mood
                    </span>
                    <span className="text-lg font-bold text-[var(--primary)]">
                      {note.clientMood}/10
                    </span>
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
