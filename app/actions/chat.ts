'use server';
// Upload media chat (ảnh/audio/video) lên Supabase Storage.
// Nhận data-URL từ client, giải mã base64, upload bằng admin client (bỏ qua RLS),
// trả về public URL. Yêu cầu đã đăng nhập.
import { createClient, createAdminClient } from '@/lib/supabase/server';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg',
};

export async function uploadChatMedia(dataUrl: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return { error: 'Dữ liệu media không hợp lệ' };
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = EXT[mime] ?? mime.split('/')[1]?.split(';')[0] ?? 'bin';
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from('chat-media').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    console.error('uploadChatMedia:', error.message);
    return { error: 'Upload thất bại' };
  }
  const { data } = admin.storage.from('chat-media').getPublicUrl(path);
  return { url: data.publicUrl };
}
