import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VideoRoomPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef      = useRef(null);
  const pcRef          = useRef(null);
  const localStreamRef = useRef(null);

  const [connected,    setConnected]    = useState(false);
  const [peerJoined,   setPeerJoined]   = useState(false);
  const [audioMuted,   setAudioMuted]   = useState(false);
  const [videoOff,     setVideoOff]     = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [peerName,     setPeerName]     = useState('');

  const sendMediaState = useCallback((audio, video) => {
    socketRef.current?.emit('media-state', { roomId, audio, video });
  }, [roomId]);

  const toggleAudio = () => {
    const newMuted = !audioMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !newMuted; });
    setAudioMuted(newMuted);
    sendMediaState(!newMuted, !videoOff);
  };

  const toggleVideo = () => {
    const newOff = !videoOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !newOff; });
    setVideoOff(newOff);
    sendMediaState(!audioMuted, !newOff);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit('room-message', { roomId, message: chatInput.trim() });
    setChatMessages((m) => [...m, { self: true, text: chatInput.trim(), name: 'You' }]);
    setChatInput('');
  };

  const endCall = useCallback(() => {
    socketRef.current?.emit('leave-room');
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        socket.emit('join-room', {
          roomId,
          userId:   user?._id,
          userName: `${user?.firstName} ${user?.lastName}`,
        });
        setConnected(true);

        // When another peer is already in room
        socket.on('room-participants', (participants) => {
          if (participants.length > 0) {
            setPeerJoined(true);
            setPeerName(participants[0].userName);
            createOffer(participants[0].socketId);
          }
        });

        socket.on('user-joined', ({ socketId, userName }) => {
          setPeerJoined(true);
          setPeerName(userName);
          createOffer(socketId);
        });

        socket.on('user-left', () => {
          setPeerJoined(false);
          setPeerName('');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        socket.on('offer', async ({ from, offer }) => {
          await setupPC(stream);
          await pcRef.current.setRemoteDescription(offer);
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit('answer', { to: from, answer });
        });

        socket.on('answer', async ({ answer }) => {
          await pcRef.current?.setRemoteDescription(answer);
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          try { await pcRef.current?.addIceCandidate(candidate); } catch { /* ignore */ }
        });

        socket.on('room-message', ({ userName, message }) => {
          setChatMessages((m) => [...m, { self: false, text: message, name: userName }]);
        });

      } catch (err) {
        console.error('Media error:', err);
      }
    };

    const setupPC = async (stream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { to: null, candidate: e.candidate });
      };
      return pc;
    };

    const createOffer = async (to) => {
      const pc = await setupPC(localStreamRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to, offer });
    };

    initMedia();

    return () => {
      socket.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, [roomId, user]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-800">
        <div>
          <span className="text-white font-medium">Unfazed Session</span>
          {peerName && <span className="text-slate-400 text-sm ml-2">with {peerName}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} aria-hidden="true" />
          <span className="text-slate-400 text-xs">{connected ? 'Connected' : 'Connecting…'}</span>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative flex items-center justify-center p-4 gap-4">
        {/* Remote video */}
        <div className="relative w-full max-w-2xl aspect-video bg-slate-800 rounded-xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            aria-label="Remote participant video"
          />
          {!peerJoined && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-400">Waiting for the other participant to join…</p>
            </div>
          )}
        </div>

        {/* Local video (PiP) */}
        <div className="absolute bottom-8 right-8 w-40 aspect-video bg-slate-700 rounded-lg overflow-hidden shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            aria-label="Your video"
          />
          {videoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
              <span className="text-2xl">📷</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 bg-slate-800">
        <button
          onClick={toggleAudio}
          aria-label={audioMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${audioMuted ? 'bg-red-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
        >
          {audioMuted ? '🔇' : '🎤'}
        </button>
        <button
          onClick={toggleVideo}
          aria-label={videoOff ? 'Turn on camera' : 'Turn off camera'}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${videoOff ? 'bg-red-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
        >
          {videoOff ? '📷' : '🎥'}
        </button>
        <button
          onClick={endCall}
          aria-label="End call"
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl transition-colors"
        >
          📵
        </button>
      </div>

      {/* Chat panel */}
      <div className="fixed right-4 top-16 bottom-20 w-72 bg-slate-800 rounded-xl flex flex-col shadow-xl hidden lg:flex">
        <div className="px-4 py-3 border-b border-slate-700">
          <span className="text-white text-sm font-medium">Session chat</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite" aria-label="Chat messages">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.self ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-400 mb-0.5">{msg.name}</span>
              <span className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] ${msg.self ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Type a message…"
            aria-label="Chat message"
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm border border-slate-600 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
          />
          <button
            onClick={sendChat}
            aria-label="Send message"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRoomPage;
