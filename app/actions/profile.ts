'use server';
// Upload ảnh đại diện lên Storage (bucket chat-media, thư mục avatars/).
import { createClient, createAdminClient } from '@/lib/supabase/server';

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

export async function uploadAvatar(dataUrl: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };

  const match = /^data:(image\/[^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return { error: 'Ảnh không hợp lệ' };
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = EXT[mime] ?? 'png';
  const path = `avatars/${user.id}/${Date.now()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from('chat-media').upload(path, buffer, { contentType: mime, upsert: true });
  if (error) {
    console.error('uploadAvatar:', error.message);
    return { error: 'Upload ảnh thất bại' };
  }
  const { data } = admin.storage.from('chat-media').getPublicUrl(path);
  return { url: data.publicUrl };
}
