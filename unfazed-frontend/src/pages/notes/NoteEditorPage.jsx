import { useEffect, useState, useCallback } from "react";
import { isSessionExpired } from "../../utils/apiError";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { format } from "date-fns";
import {
  getNoteBySessionAPI,
  getNoteAPI,
  updateNoteAPI,
  signNoteAPI,
  toggleVisibilityAPI,
} from "../../api/notes";
import { useToast } from "../../components/common/Toast";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";

const MenuBar = ({ editor }) => {
  if (!editor) return null;
  const btn = (action, label, active = false) => (
    <button
      type="button"
      onClick={action}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm transition-all ${active ? "bg-white text-[var(--text-primary)] shadow-sm" : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border)] bg-slate-50 rounded-t-[var(--radius)]">
      {btn(
        () => editor.chain().focus().toggleBold().run(),
        "B",
        editor.isActive("bold"),
      )}
      {btn(
        () => editor.chain().focus().toggleItalic().run(),
        "I",
        editor.isActive("italic"),
      )}
      {btn(
        () => editor.chain().focus().toggleBulletList().run(),
        "• List",
        editor.isActive("bulletList"),
      )}
      {btn(
        () => editor.chain().focus().toggleOrderedList().run(),
        "1. List",
        editor.isActive("orderedList"),
      )}
      {btn(
        () => editor.chain().focus().toggleBlockquote().run(),
        '" Quote',
        editor.isActive("blockquote"),
      )}
    </div>
  );
};

const NoteEditorPage = () => {
  const { id, sessionId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [format_, setFormat_] = useState("soap");
  const [fields, setFields] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    homework: "",
    followUp: "",
  });
  const [clientMood, setClientMood] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [visibility, setVisibility] = useState("private");
  const navigate = useNavigate();
  const toast = useToast();

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap px-4 py-3 min-h-[200px] focus:outline-none text-sm",
      },
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = sessionId
          ? await getNoteBySessionAPI(sessionId)
          : await getNoteAPI(id);
        const n = data.data.note;
        setNote(n);
        setFormat_(n.format || "soap");
        setFields({
          subjective: n.subjective || "",
          objective: n.objective || "",
          assessment: n.assessment || "",
          plan: n.plan || "",
          homework: n.homework || "",
          followUp: n.followUp || "",
        });
        setClientMood(n.clientMood || "");
        setRiskLevel(n.riskLevel || "");
        setVisibility(n.visibility || "private");
        if (editor && n.content) editor.commands.setContent(n.content);
      } catch (err) {
        if (!isSessionExpired(err)) toast.error("Failed to load note");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, sessionId, editor]);

  const handleSave = useCallback(async () => {
    if (!note) return;
    setSaving(true);
    try {
      const payload = {
        format: format_,
        ...fields,
        content: format_ === "free" ? editor?.getHTML() || "" : "",
        clientMood: clientMood ? Number(clientMood) : null,
        riskLevel: riskLevel || null,
      };
      const { data } = await updateNoteAPI(note._id, payload);
      setNote(data.data.note);
      toast.success("Note saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [note, format_, fields, clientMood, riskLevel, editor]);

  const handleSign = async () => {
    if (!window.confirm("Sign and lock this note? This cannot be undone."))
      return;
    try {
      await signNoteAPI(note._id);
      toast.success("Note signed and locked");
      navigate("/notes");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sign note");
    }
  };

  const handleToggleVisibility = async () => {
    if (note.isLocked) return;
    setTogglingVisibility(true);
    try {
      const { data } = await toggleVisibilityAPI(note._id);
      const newVis = data.data.note.visibility;
      setVisibility(newVis);
      setNote((prev) => ({ ...prev, visibility: newVis }));
      toast.success(
        newVis === "shared" ? "Note shared with client" : "Note set to private",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Spinner size="lg" />
      </div>
    );
  if (!note)
    return (
      <div className="text-center py-16 text-[var(--text-muted)]">
        Note not found.
      </div>
    );

  const field = (key, label, rows = 3) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <textarea
        rows={rows}
        value={fields[key]}
        onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
        disabled={note.isLocked}
        className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] resize-none disabled:bg-slate-50 disabled:text-[var(--text-muted)] bg-white"
        placeholder={`${label}…`}
      />
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <nav
        className="text-sm text-[var(--text-secondary)]"
        aria-label="Breadcrumb"
      >
        <Link
          to="/notes"
          className="hover:text-[var(--primary)] transition-colors"
        >
          Notes
        </Link>
        <span className="mx-2 text-[var(--text-muted)]">/</span>
        <span className="text-[var(--text-primary)]">
          {note.client?.firstName} {note.client?.lastName}
          {note.session &&
            ` — ${format(new Date(note.session.startTime), "MMM d, yyyy")}`}
        </span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          {note.isSigned && (
            <span className="text-xs bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 px-2.5 py-0.5 rounded-full font-medium mr-2">
              ✓ Signed{" "}
              {note.signedAt && format(new Date(note.signedAt), "MMM d, yyyy")}
            </span>
          )}
          {note.isLocked && (
            <span className="text-xs bg-slate-100 text-[var(--text-muted)] px-2.5 py-0.5 rounded-full font-medium">
              🔒 Locked
            </span>
          )}
          {/* Visibility badge */}
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ml-1 ${
              visibility === "shared"
                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {visibility === "shared" ? "🔗 Shared with client" : "🔒 Private"}
          </span>
        </div>
        <div className="flex gap-2">
          {!note.isLocked && (
            <>
              {/* Visibility toggle — Module 5 */}
              <Button
                size="sm"
                variant={visibility === "shared" ? "secondary" : "outline"}
                onClick={handleToggleVisibility}
                loading={togglingVisibility}
                title={
                  visibility === "shared"
                    ? "Click to make private"
                    : "Click to share with client"
                }
              >
                {visibility === "shared" ? "🔗 Shared" : "🔒 Private"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                loading={saving}
              >
                Save draft
              </Button>
              <Button size="sm" onClick={handleSign}>
                Sign & lock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Format selector */}
      {!note.isLocked && (
        <div className="flex gap-2">
          {["soap", "dap", "free", "progress"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat_(f)}
              className={`px-3.5 py-1.5 rounded-[var(--radius)] text-xs font-semibold uppercase tracking-wide transition-all ${format_ === f ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-[var(--text-secondary)] hover:bg-slate-200"}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 space-y-5">
        {/* SOAP / DAP fields */}
        {format_ === "soap" && (
          <>
            {field("subjective", "Subjective (client's report)")}
            {field("objective", "Objective (therapist observations)")}
            {field("assessment", "Assessment")}
            {field("plan", "Plan")}
          </>
        )}
        {format_ === "dap" && (
          <>
            {field("data", "Data (client's report & observations)")}
            {field("assessment", "Assessment")}
            {field("plan", "Plan")}
          </>
        )}
        {(format_ === "free" || format_ === "progress") && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[var(--text-primary)]">
              {format_ === "progress" ? "Progress note" : "Session notes"}
            </label>
            <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-4 grid grid-cols-2 gap-4">
          {field("homework", "Homework / tasks for client", 2)}
          {field("followUp", "Follow-up plan", 2)}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Client mood (1–10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={clientMood}
              onChange={(e) => setClientMood(e.target.value)}
              disabled={note.isLocked}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:bg-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Risk level
            </label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              disabled={note.isLocked}
              className="w-full px-3.5 py-2.5 rounded-[var(--radius)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] disabled:bg-slate-50 bg-white appearance-none"
            >
              <option value="">Not assessed</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="crisis">Crisis</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditorPage;
