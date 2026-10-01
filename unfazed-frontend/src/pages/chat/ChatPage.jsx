import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { getChatHistoryAPI, markRoomReadAPI } from '../../api/chat';
import { getClientsAPI } from '../../api/clients';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/common/Avatar';

/* ── Bubble ─────────────────────────────────────────────────────────────── */
const Bubble = ({ msg, isMine }) => (
  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
    <div
      className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm
        ${isMine
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
        }`}
    >
      <p className="leading-relaxed break-words">{msg.text}</p>
      <p className={`text-[10px] mt-0.5 text-right ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
        {format(new Date(msg.createdAt || msg.timestamp), 'h:mm a')}
        {isMine && (
          <span className="ml-1" title="Read status">
            {(msg.readBy?.length || 0) > 1 ? ' ✓✓' : ' ✓'}
          </span>
        )}
      </p>
    </div>
  </div>
);

/* ── Client list sidebar ─────────────────────────────────────────────────── */
const ClientSidebar = ({ clients, activeId, unread }) => (
  <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
    <div className="px-4 py-3 border-b border-slate-200">
      <h3 className="font-semibold text-slate-900 text-sm">Conversations</h3>
    </div>
    <div className="flex-1 overflow-y-auto">
      {clients.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-8 px-4">No clients yet.<br />Add a client first.</p>
      )}
      {clients.map((c) => {
        const count = unread[c._id] || 0;
        return (
          <Link
            key={c._id}
            to={`/chat/${c._id}`}
            className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors
              ${activeId === c._id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''}`}
          >
            <Avatar src={c.avatar} name={c.fullName || `${c.firstName} ${c.lastName}`} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {c.firstName} {c.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">{c.status}</p>
            </div>
            {count > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold flex-shrink-0">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  </aside>
);

/* ── Main ChatPage ───────────────────────────────────────────────────────── */
const ChatPage = () => {
  const { clientId } = useParams();
  const { user }     = useAuth();

  const [clients, setClients]   = useState([]);
  const [client, setClient]     = useState(null);
  const [unread, setUnread]     = useState({});
  const [text, setText]         = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const bottomRef = useRef(null);

  const {
    messages, connected, typingUser,
    sendMessage, sendTypingStart, sendTypingStop, markRead,
  } = useChat(user?._id, clientId, user?._id);

  // Load client list
  useEffect(() => {
    getClientsAPI({ limit: 200, status: 'active' })
      .then(({ data }) => setClients(data.data))
      .catch(() => {});
  }, []);

  // Resolve active client from list
  useEffect(() => {
    if (!clientId || clients.length === 0) return;
    const found = clients.find((c) => c._id === clientId);
    setClient(found || null);
  }, [clientId, clients]);

  // Load older history from REST when client changes
  useEffect(() => {
    if (!clientId) return;
    setLoadingHistory(true);
    getChatHistoryAPI(clientId, { limit: 50 })
      .then(() => {
        // Socket join_chat will deliver history via 'chat_history' event
        // This REST call just pre-warms the read state
        markRoomReadAPI(clientId).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [clientId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark visible messages as read
  useEffect(() => {
    if (!messages.length) return;
    const unreadMsgs = messages.filter(
      (m) => m.senderType !== 'therapist' && !(m.readBy || []).includes(user?._id)
    );
    unreadMsgs.forEach((m) => markRead(m._id));
  }, [messages, user?._id, markRead]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    sendTypingStop();
  }, [text, sendMessage, sendTypingStop]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Sidebar */}
      <ClientSidebar clients={clients} activeId={clientId} unread={unread} />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!clientId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-slate-500 font-medium">Select a client to start chatting</p>
              <p className="text-slate-400 text-sm mt-1">Messages are end-to-end private</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
              {client && (
                <Avatar
                  src={client.avatar}
                  name={`${client.firstName} ${client.lastName}`}
                  size="sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {client ? `${client.firstName} ${client.lastName}` : 'Loading…'}
                </p>
                <p className={`text-xs ${connected ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {connected ? 'Connected' : 'Connecting…'}
                </p>
              </div>
              <Link
                to={`/clients/${clientId}`}
                className="text-xs text-indigo-600 hover:underline px-2"
              >
                View profile →
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5">
              {loadingHistory ? (
                <div className="flex justify-center py-8"><Spinner size="md" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <p className="text-3xl mb-2">👋</p>
                  <p className="text-slate-500 font-medium text-sm">No messages yet</p>
                  <p className="text-slate-400 text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Bubble
                    key={msg._id || msg.id}
                    msg={msg}
                    isMine={msg.senderId === user?._id || msg.senderType === 'therapist'}
                  />
                ))
              )}

              {/* Typing indicator */}
              {typingUser && (
                <div className="flex justify-start mb-1">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-slate-400 shadow-sm">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-slate-200 flex-shrink-0">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value) sendTypingStart();
                  else sendTypingStop();
                }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type a message… (Enter to send)"
                aria-label="Chat message"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none
                  max-h-32 overflow-y-auto"
                style={{ fieldSizing: 'content' }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || !connected}
                aria-label="Send message"
                className="w-9 h-9 flex-shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-700
                  disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center
                  justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
