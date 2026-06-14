'use client';
// Chat phía seller: xem & trả lời hội thoại khách gửi đến shop. Realtime.
import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Conv { id: string; buyerId: string; lastMessage: string; lastTime: number }
interface Msg { id: string; sender: 'buyer' | 'shop'; type: string; content: string; createdAt: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMsg(m: any): Msg {
  return { id: m.id, sender: m.sender, type: m.type, content: m.content, createdAt: new Date(m.created_at).getTime() };
}
const buyerLabel = (id: string) => 'Khách #' + (id ? id.slice(0, 4).toUpperCase() : '----');
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export default function SellerChat({ shopId }: { shopId: string }) {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const supaRef = useRef(createClient());
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const loadConvs = async () => {
    const { data } = await supaRef.current
      .from('conversations').select('id, buyer_id, last_message, last_time')
      .eq('shop_id', shopId).order('last_time', { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setConvs(((data ?? []) as any[]).map((c) => ({ id: c.id, buyerId: c.buyer_id, lastMessage: c.last_message ?? '', lastTime: new Date(c.last_time).getTime() })));
  };

  useEffect(() => { loadConvs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [shopId]);

  // Realtime: tin nhắn mới → cập nhật thread đang mở + danh sách
  useEffect(() => {
    const supa = supaRef.current;
    const channel = supa.channel('seller-chat-' + shopId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const m = payload.new;
        if (m.conversation_id === activeIdRef.current) {
          setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, mapMsg(m)]);
        }
        loadConvs();
      })
      .subscribe();
    return () => { supa.removeChannel(channel); };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [shopId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const openConv = async (id: string) => {
    setActiveId(id);
    const { data } = await supaRef.current.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(((data ?? []) as any[]).map(mapMsg));
  };

  const send = async () => {
    const t = text.trim();
    if (!t || !activeId) return;
    setSending(true);
    const supa = supaRef.current;
    const { data, error } = await supa.from('messages')
      .insert({ conversation_id: activeId, sender: 'shop', type: 'text', content: t, status: 'sent' })
      .select('*').single();
    if (!error && data) {
      setMessages(prev => prev.some(x => x.id === data.id) ? prev : [...prev, mapMsg(data)]);
      await supa.from('conversations').update({ last_message: t, last_time: new Date().toISOString() }).eq('id', activeId);
    }
    setText(''); setSending(false);
    loadConvs();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', background: 'white', borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {/* Danh sách hội thoại */}
      <div style={{ width: '300px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={18} style={{ color: '#990000' }} /> Hội thoại ({convs.length})
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convs.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              Chưa có khách nhắn tin cho shop của bạn.
            </div>
          ) : convs.map(c => (
            <button key={c.id} onClick={() => openConv(c.id)}
              style={{ width: '100%', textAlign: 'left', padding: '14px 18px', border: 'none', borderBottom: '1px solid #f9fafb', background: activeId === c.id ? '#fff0f0' : 'white', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#990000,#FF0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={18} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '13px', color: '#111' }}>{buyerLabel(c.buyerId)}</div>
                <div className="line-clamp-1" style={{ fontSize: '12px', color: '#9ca3af' }}>{c.lastMessage || 'Bắt đầu trò chuyện...'}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Khung chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!activeId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            <MessageCircle size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ fontSize: '14px' }}>Chọn một hội thoại để trả lời khách hàng</p>
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: '14px' }}>
              {buyerLabel(convs.find(c => c.id === activeId)?.buyerId ?? '')}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafafa' }}>
              {messages.map(m => {
                const isShop = m.sender === 'shop';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isShop ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', background: isShop ? 'linear-gradient(135deg,#990000,#cc2200)' : 'white', color: isShop ? 'white' : '#111', borderRadius: '14px', border: isShop ? 'none' : '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      {m.type === 'text' && <div style={{ padding: '9px 13px', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' }}>{m.content}</div>}
                      {m.type === 'image' && <img src={m.content} alt="" style={{ maxWidth: '220px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(m.content, '_blank')} />}
                      {m.type === 'video' && <video src={m.content} controls style={{ maxWidth: '240px', display: 'block' }} />}
                      {m.type === 'audio' && <audio src={m.content} controls style={{ maxWidth: '240px', padding: '6px' }} />}
                      <div style={{ padding: '0 13px 6px', fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>{fmtTime(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Nhập tin nhắn trả lời khách..." style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: '20px', fontSize: '14px', fontFamily: 'Inter', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#990000')} onBlur={e => (e.target.style.borderColor = '#e5e7eb')} />
              <button onClick={send} disabled={sending || !text.trim()}
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: text.trim() ? 'linear-gradient(135deg,#990000,#cc2200)' : '#e5e7eb', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
