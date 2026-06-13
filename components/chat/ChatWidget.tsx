'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Send, Paperclip, Mic, MicOff,
  ArrowLeft, Image, Video, Pause, Play, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useChatStore, ChatMessage, WAVEFORM } from '@/lib/store/chat-store';
import { useUser } from '@/lib/supabase/use-user';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} giờ trước`;
  return new Date(ts).toLocaleDateString('vi-VN');
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Custom Audio Player ─────────────────────────────────────────────────────

function AudioPlayer({ src, duration, isBuyer }: { src: string; duration?: number; isBuyer: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const total = duration ?? 0;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', minWidth: '200px' }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
        onEnded={() => { setPlaying(false); setCurrent(0); }}
      />
      <button
        onClick={toggle}
        style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: isBuyer ? 'rgba(255,255,255,0.25)' : 'var(--primary)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
        }}>
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1 }}>
        {WAVEFORM.map((h, i) => {
          const progress = total > 0 ? current / total : 0;
          const isPast = i / WAVEFORM.length < progress;
          return (
            <div key={i} style={{
              width: '3px',
              height: `${6 + h * 14}px`,
              borderRadius: '2px',
              background: isPast
                ? (isBuyer ? 'rgba(255,255,255,0.9)' : 'var(--primary)')
                : (isBuyer ? 'rgba(255,255,255,0.4)' : 'var(--gray-300)'),
              transition: 'height 0.15s',
            }} />
          );
        })}
      </div>

      <span style={{ fontSize: '11px', fontWeight: 600, flexShrink: 0, color: isBuyer ? 'rgba(255,255,255,0.8)' : 'var(--gray-500)' }}>
        {playing ? fmtDuration(Math.floor(current)) : fmtDuration(total)}
      </span>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isBuyer = msg.sender === 'buyer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        justifyContent: isBuyer ? 'flex-end' : 'flex-start',
        marginBottom: '6px',
      }}
    >
      <div style={{
        maxWidth: '72%',
        background: isBuyer
          ? 'linear-gradient(135deg, var(--primary), #cc2200)'
          : 'var(--gray-100)',
        color: isBuyer ? 'white' : 'var(--black)',
        borderRadius: '18px',
        borderBottomRightRadius: isBuyer ? '4px' : '18px',
        borderBottomLeftRadius: isBuyer ? '18px' : '4px',
        overflow: 'hidden',
        boxShadow: isBuyer ? '0 2px 8px rgba(153,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Content */}
        {msg.type === 'text' && (
          <div style={{ padding: '10px 14px', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>
            {msg.content}
          </div>
        )}

        {msg.type === 'image' && (
          <div>
            <img
              src={msg.content}
              alt={msg.fileName || 'Image'}
              style={{ maxWidth: '220px', maxHeight: '220px', width: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
              onClick={() => window.open(msg.content, '_blank')}
            />
            {msg.fileName && (
              <div style={{ padding: '4px 10px', fontSize: '11px', opacity: 0.7 }}>{msg.fileName}</div>
            )}
          </div>
        )}

        {msg.type === 'video' && (
          <div>
            <video
              src={msg.content}
              controls
              style={{ maxWidth: '240px', maxHeight: '180px', width: '100%', display: 'block', borderRadius: '14px' }}
            />
            {msg.fileName && (
              <div style={{ padding: '4px 10px', fontSize: '11px', opacity: 0.7 }}>{msg.fileName}</div>
            )}
          </div>
        )}

        {msg.type === 'audio' && (
          <AudioPlayer src={msg.content} duration={msg.duration} isBuyer={isBuyer} />
        )}

        {/* Timestamp */}
        <div style={{
          padding: msg.type === 'text' ? '0 14px 6px' : '4px 10px',
          fontSize: '10px',
          opacity: 0.65,
          textAlign: 'right',
        }}>
          {fmtTime(msg.timestamp)}
          {isBuyer && <span style={{ marginLeft: '4px' }}>✓✓</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── TypingIndicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
      <div style={{ background: 'var(--gray-100)', borderRadius: '18px', borderBottomLeftRadius: '4px', padding: '12px 16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gray-400)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message View (active conversation) ──────────────────────────────────────

function MessageView({ conversationId }: { conversationId: string }) {
  const { conversations, messages, sendMessage, setActiveConversation, closeChat } = useChatStore();
  const conv = conversations[conversationId];
  const msgs = messages[conversationId] || [];

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [isTypingVisible, setIsTypingVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, isTypingVisible]);

  // Show typing indicator when shop is "replying"
  useEffect(() => {
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.sender === 'buyer') {
      setIsTypingVisible(true);
      const t = setTimeout(() => setIsTypingVisible(false), 1500 + Math.random() * 1500);
      return () => clearTimeout(t);
    }
  }, [msgs.length]);

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (mediaRecRef.current?.state !== 'inactive') {
        try { mediaRecRef.current?.stop(); } catch {}
      }
    };
  }, []);

  if (!conv) return null;

  const handleSendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(conversationId, 'text', trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const openFilePicker = (accept: string) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      sendMessage(conversationId, isVideo ? 'video' : 'image', content, { fileName: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);

      setIsRecording(true);
      setRecordSecs(0);
      recTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } catch {
      toast.error('Không thể truy cập microphone', { description: 'Kiểm tra quyền truy cập trong trình duyệt.' });
    }
  };

  const stopRecording = () => {
    if (!mediaRecRef.current) return;
    const duration = recordSecs;

    mediaRecRef.current.onstop = () => {
      const mimeType = chunksRef.current[0]?.type || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      mediaRecRef.current?.stream.getTracks().forEach(t => t.stop());
      // Đổi sang data-URL để upload lên Storage (blob-URL không gửi lên server được)
      const reader = new FileReader();
      reader.onload = ev => sendMessage(conversationId, 'audio', ev.target?.result as string, { duration });
      reader.readAsDataURL(blob);
    };

    mediaRecRef.current.stop();
    setIsRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
  };

  const cancelRecording = () => {
    mediaRecRef.current?.stream.getTracks().forEach(t => t.stop());
    try { mediaRecRef.current?.stop(); } catch {}
    setIsRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--gray-100)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'white', flexShrink: 0,
      }}>
        <button onClick={() => setActiveConversation(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', color: 'var(--gray-600)', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={conv.shopLogo} alt={conv.shopName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gray-100)' }} />
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '11px', height: '11px', borderRadius: '50%',
            background: conv.isOnline ? '#22c55e' : '#9ca3af',
            border: '2px solid white',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--black)' }} className="line-clamp-1">
            {conv.shopName}
          </div>
          <div style={{ fontSize: '11px', color: conv.isOnline ? '#16a34a' : 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{conv.isOnline ? '● Online' : '● Offline'}</span>
          </div>
        </div>

        <button onClick={closeChat}
          style={{ background: 'var(--gray-100)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p style={{ fontSize: '13px' }}>Bắt đầu cuộc trò chuyện với {conv.shopName}</p>
          </div>
        )}
        {msgs.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {isTypingVisible && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--gray-100)', background: 'white', flexShrink: 0 }}>
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {isRecording ? (
          /* Recording state */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', borderRadius: '12px', padding: '10px 14px', border: '2px solid #fecaca' }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }}
            />
            <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '14px', flex: 1 }}>
              🎙 {fmtDuration(recordSecs)}
            </span>
            <button onClick={cancelRecording}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '13px', fontWeight: 600 }}>
              Hủy
            </button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stopRecording}
              style={{ background: '#ef4444', border: 'none', borderRadius: '99px', padding: '8px 16px', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Send size={14} /> Gửi
            </motion.button>
          </div>
        ) : (
          /* Normal input state */
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            {/* Attachment buttons */}
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button onClick={() => openFilePicker('image/*')} title="Gửi ảnh"
                style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(153,0,0,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-500)'; }}>
                <Image size={15} />
              </button>
              <button onClick={() => openFilePicker('video/*')} title="Gửi video"
                style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(153,0,0,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--gray-50)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-200)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-500)'; }}>
                <Video size={15} />
              </button>
            </div>

            {/* Text input */}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              style={{
                flex: 1, padding: '9px 14px', border: '1.5px solid var(--gray-200)',
                borderRadius: '20px', fontSize: '14px', fontFamily: 'Inter', outline: 'none',
                resize: 'none', lineHeight: 1.4, maxHeight: '96px', overflowY: 'auto',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')}
            />

            {/* Send / Mic button */}
            {text.trim() ? (
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={handleSendText}
                style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #cc2200)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Send size={16} />
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={startRecording}
                title="Giữ để ghi âm"
                style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gray-50)', border: '1.5px solid var(--gray-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', flexShrink: 0 }}>
                <Mic size={17} />
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConversationListView() {
  const { conversations, setActiveConversation, closeChat } = useChatStore();
  const list = Object.values(conversations).sort((a, b) => b.lastTime - a.lastTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'Playfair Display', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={22} style={{ color: 'var(--primary)' }} />
          Tin Nhắn
        </h2>
        <button onClick={closeChat}
          style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gray-100)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-600)' }}>
          <X size={16} />
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--gray-400)' }}>
            <MessageCircle size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, marginBottom: '6px', fontSize: '15px' }}>Chưa có cuộc trò chuyện</p>
            <p style={{ fontSize: '13px' }}>Vào trang shop và nhấn "Chat ngay" để bắt đầu</p>
          </div>
        ) : (
          list.map(conv => (
            <motion.button
              key={conv.id}
              whileHover={{ background: 'var(--gray-50)' }}
              onClick={() => setActiveConversation(conv.id)}
              style={{
                width: '100%', padding: '14px 20px', border: 'none',
                background: 'white', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '14px',
                borderBottom: '1px solid var(--gray-50)', transition: 'background 0.15s',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={conv.shopLogo} alt={conv.shopName}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gray-100)' }} />
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: conv.isOnline ? '#22c55e' : '#9ca3af',
                  border: '2px solid white',
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--black)' }} className="line-clamp-1">
                    {conv.shopName}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--gray-400)', flexShrink: 0 }}>
                    {fmtRelative(conv.lastTime)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="line-clamp-1" style={{ fontSize: '13px', color: conv.unreadCount > 0 ? 'var(--black)' : 'var(--gray-400)', fontWeight: conv.unreadCount > 0 ? 600 : 400 }}>
                    {conv.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                  </span>
                  {conv.unreadCount > 0 && (
                    <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '99px', fontSize: '11px', fontWeight: 700, padding: '1px 7px', minWidth: '20px', textAlign: 'center', flexShrink: 0, marginLeft: '8px' }}>
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--gray-300)', flexShrink: 0 }} />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main ChatWidget ──────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { isOpen, activeConversationId, toggleChat, getTotalUnread, conversations,
    loadConversations, subscribe, reset } = useChatStore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Tải danh sách hội thoại + lắng nghe realtime khi đã đăng nhập; reset khi đăng xuất.
  useEffect(() => {
    if (user) {
      loadConversations();
      subscribe();
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!mounted) return null;

  const totalUnread = getTotalUnread();
  const hasConversations = Object.keys(conversations).length > 0;

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleChat}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 57 }}
          />
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '380px', maxWidth: '92vw',
              background: 'white', zIndex: 58,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-16px 0 48px rgba(0,0,0,0.16)',
            }}
          >
            {activeConversationId
              ? <MessageView conversationId={activeConversationId} />
              : <ConversationListView />
            }
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating button — visible when conversations exist OR chat open */}
      {(hasConversations || isOpen) && (
        <motion.button
          whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
          onClick={toggleChat}
          style={{
            position: 'fixed', bottom: '90px', right: '24px',
            width: '54px', height: '54px', borderRadius: '50%',
            background: isOpen ? 'var(--gray-700)' : 'linear-gradient(135deg, var(--primary), #cc2200)',
            border: 'none', cursor: 'pointer', zIndex: 56,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 6px 20px rgba(153,0,0,0.4)',
            transition: 'background 0.25s',
          }}
        >
          {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
          {!isOpen && totalUnread > 0 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                position: 'absolute', top: 1, right: 1,
                background: '#ef4444', color: 'white', borderRadius: '50%',
                width: '20px', height: '20px', fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white',
              }}
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </motion.div>
          )}
        </motion.button>
      )}
    </>
  );
}
