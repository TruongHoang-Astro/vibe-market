// lib/store/chat-store.ts
// Chat buyer↔shop, lưu DB Supabase + realtime. Phía buyer là user thật;
// phía shop là auto-reply (vẫn lưu DB + đẩy qua realtime). Media lên Storage.
import { create } from 'zustand';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { uploadChatMedia } from '@/app/actions/chat';

export type MessageType = 'text' | 'image' | 'audio' | 'video';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'buyer' | 'shop';
  type: MessageType;
  content: string;      // text | public URL (media)
  fileName?: string;
  duration?: number;    // audio seconds
  timestamp: number;
  status: 'sent' | 'read';
}

export interface Conversation {
  id: string;
  shopId: string;
  shopName: string;
  shopLogo: string;
  lastMessage: string;
  lastTime: number;
  unreadCount: number;
  isOnline: boolean;
}

// Waveform seed cho audio bubble (tránh random re-render)
export const WAVEFORM = [0.4, 0.7, 0.5, 0.9, 0.6, 1.0, 0.7, 0.5, 0.8, 0.4,
  0.9, 0.6, 0.3, 0.8, 0.5, 0.7, 0.4, 0.9, 0.6, 0.5];

const shopReplies: Record<MessageType, string[]> = {
  text: [
    'Xin chào! Cảm ơn bạn đã liên hệ 😊',
    'Dạ, shop hiểu rồi. Bạn cho biết thêm thông tin nhé!',
    'Cảm ơn bạn! Shop sẽ xử lý ngay.',
    'Bạn cần tư vấn thêm về sản phẩm nào không ạ?',
    'Shop đã nhận được tin nhắn, sẽ phản hồi trong 30 phút!',
    'Vâng, shop sẽ kiểm tra và báo lại cho bạn ngay nhé!',
  ],
  image: ['Cảm ơn bạn đã gửi hình ảnh! Shop đang xem 📸'],
  audio: ['Shop đã nghe tin nhắn thoại của bạn! 🎵 Sẽ phản hồi ngay.'],
  video: ['Cảm ơn bạn đã gửi video! Shop đang xem 🎥'],
};

// Singleton client + realtime channel (module scope)
let _supa: ReturnType<typeof createClient> | null = null;
const db = () => (_supa ??= createClient());
let channel: RealtimeChannel | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMsgRow(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    type: row.type,
    content: row.content,
    fileName: row.file_name ?? undefined,
    duration: row.duration ?? undefined,
    timestamp: new Date(row.created_at).getTime(),
    status: row.status === 'read' ? 'read' : 'sent',
  };
}

const previewOf = (type: MessageType, content: string) =>
  type === 'text' ? content
    : type === 'image' ? '📷 Hình ảnh'
      : type === 'audio' ? '🎵 Tin nhắn thoại'
        : '🎥 Video';

interface ChatStore {
  conversations: Record<string, Conversation>;
  messages: Record<string, ChatMessage[]>;
  activeConversationId: string | null;
  isOpen: boolean;

  openChat: (shopId: string, shopName: string, shopLogo: string) => Promise<void>;
  closeChat: () => void;
  toggleChat: () => void;
  setActiveConversation: (id: string | null) => void;

  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  subscribe: () => void;
  unsubscribe: () => void;
  reset: () => void;

  sendMessage: (
    conversationId: string,
    type: MessageType,
    content: string,
    extra?: { fileName?: string; duration?: number },
  ) => Promise<void>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addIncoming: (row: any) => void;

  markAsRead: (conversationId: string) => void;
  getTotalUnread: () => number;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: {},
  messages: {},
  activeConversationId: null,
  isOpen: false,

  openChat: async (shopId, shopName, shopLogo) => {
    const supa = db();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      toast.error('Đăng nhập để chat với shop nhé!');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return;
    }

    // Tìm hoặc tạo conversation
    let convId: string;
    const { data: existing } = await supa
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('shop_id', shopId)
      .maybeSingle();

    if (existing) {
      convId = existing.id;
    } else {
      const { data: created, error } = await supa
        .from('conversations')
        .insert({ buyer_id: user.id, shop_id: shopId, last_message: '' })
        .select('id')
        .single();
      if (error || !created) {
        toast.error('Không mở được cuộc trò chuyện');
        return;
      }
      convId = created.id;
    }

    set(state => ({
      isOpen: true,
      activeConversationId: convId,
      conversations: {
        ...state.conversations,
        [convId]: {
          id: convId, shopId, shopName, shopLogo,
          lastMessage: state.conversations[convId]?.lastMessage ?? '',
          lastTime: state.conversations[convId]?.lastTime ?? Date.now(),
          unreadCount: 0,
          isOnline: true,
        },
      },
    }));

    get().subscribe();
    await get().loadMessages(convId);
    get().markAsRead(convId);

    // Lời chào nếu hội thoại chưa có tin nhắn nào
    if ((get().messages[convId] || []).length === 0) {
      void insertMessage(get, set, convId, 'shop', 'text',
        `Xin chào! Đây là ${shopName}. Chúng tôi có thể giúp gì cho bạn? 😊`);
    }
  },

  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set(s => ({ isOpen: !s.isOpen })),

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) {
      if (!get().messages[id]) void get().loadMessages(id);
      get().markAsRead(id);
    }
  },

  loadConversations: async () => {
    const supa = db();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return;
    const { data, error } = await supa
      .from('conversations')
      .select('id, shop_id, last_message, last_time, unread_count, shops(name, logo)')
      .order('last_time', { ascending: false });
    if (error) {
      console.error('loadConversations:', error.message);
      return;
    }
    const convs: Record<string, Conversation> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((data ?? []) as any[]).forEach((c) => {
      convs[c.id] = {
        id: c.id,
        shopId: c.shop_id,
        shopName: c.shops?.name ?? 'Shop',
        shopLogo: c.shops?.logo ?? '',
        lastMessage: c.last_message ?? '',
        lastTime: new Date(c.last_time).getTime(),
        unreadCount: c.unread_count ?? 0,
        isOnline: true,
      };
    });
    set({ conversations: convs });
  },

  loadMessages: async (conversationId) => {
    const supa = db();
    const { data, error } = await supa
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('loadMessages:', error.message);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = ((data ?? []) as any[]).map(mapMsgRow);
    set(state => ({ messages: { ...state.messages, [conversationId]: list } }));
  },

  subscribe: () => {
    if (channel) return;
    const supa = db();
    channel = supa
      .channel('chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => get().addIncoming(payload.new))
      .subscribe();
  },

  unsubscribe: () => {
    if (channel) { db().removeChannel(channel); channel = null; }
  },

  reset: () => {
    get().unsubscribe();
    set({ conversations: {}, messages: {}, activeConversationId: null, isOpen: false });
  },

  sendMessage: async (conversationId, type, content, extra = {}) => {
    let finalContent = content;
    if (type !== 'text' && content.startsWith('data:')) {
      const { url, error } = await uploadChatMedia(content);
      if (error || !url) {
        toast.error('Gửi media thất bại' + (error ? `: ${error}` : ''));
        return;
      }
      finalContent = url;
    }

    await insertMessage(get, set, conversationId, 'buyer', type, finalContent, extra);

    // Auto-reply phía shop (lưu DB + đẩy realtime)
    const delay = 1200 + Math.random() * 1800;
    setTimeout(() => {
      const pool = shopReplies[type];
      const reply = pool[Math.floor(Math.random() * pool.length)];
      void insertMessage(get, set, conversationId, 'shop', 'text', reply);
    }, delay);
  },

  addIncoming: (row) => {
    const msg = mapMsgRow(row);
    set(state => {
      const list = state.messages[msg.conversationId] || [];
      if (list.some(m => m.id === msg.id)) return {}; // dedup (optimistic + realtime)
      const isVisible = state.isOpen && state.activeConversationId === msg.conversationId;
      const conv = state.conversations[msg.conversationId];
      return {
        messages: { ...state.messages, [msg.conversationId]: [...list, msg] },
        conversations: conv ? {
          ...state.conversations,
          [msg.conversationId]: {
            ...conv,
            lastMessage: previewOf(msg.type, msg.content),
            lastTime: msg.timestamp,
            unreadCount: (msg.sender === 'shop' && !isVisible) ? conv.unreadCount + 1 : conv.unreadCount,
          },
        } : state.conversations,
      };
    });
  },

  markAsRead: (conversationId) => {
    set(state => {
      const conv = state.conversations[conversationId];
      if (!conv) return {};
      return { conversations: { ...state.conversations, [conversationId]: { ...conv, unreadCount: 0 } } };
    });
  },

  getTotalUnread: () =>
    Object.values(get().conversations).reduce((sum, c) => sum + c.unreadCount, 0),
}));

// Helper dùng chung: insert 1 message vào DB → optimistic add → cập nhật preview hội thoại.
async function insertMessage(
  get: () => ChatStore,
  set: (partial: Partial<ChatStore>) => void,
  conversationId: string,
  sender: 'buyer' | 'shop',
  type: MessageType,
  content: string,
  extra: { fileName?: string; duration?: number } = {},
) {
  const supa = db();
  const { data: row, error } = await supa
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender,
      type,
      content,
      file_name: extra.fileName ?? null,
      duration: extra.duration ?? null,
      status: 'sent',
    })
    .select('*')
    .single();
  if (error || !row) {
    console.error('insertMessage:', error?.message);
    if (sender === 'buyer') toast.error('Gửi tin nhắn thất bại');
    return;
  }
  get().addIncoming(row);
  // Cập nhật preview hội thoại trong DB (để danh sách hội thoại sắp xếp đúng khi tải lại)
  await supa
    .from('conversations')
    .update({ last_message: previewOf(type, content), last_time: new Date().toISOString() })
    .eq('id', conversationId);
}
