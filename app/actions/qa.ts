'use server';
// Hỏi đáp sản phẩm: buyer hỏi, chủ shop trả lời.
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notify';

export async function askQuestion(productId: string, question: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để đặt câu hỏi' };
  const q = question.trim();
  if (!q) return { error: 'Vui lòng nhập câu hỏi' };

  const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const askerName = prof?.full_name || user.email?.split('@')[0] || 'Khách';

  const { error } = await supabase.from('product_questions').insert({
    product_id: productId, user_id: user.id, asker_name: askerName, question: q.slice(0, 500),
  });
  if (error) { console.error('askQuestion:', error.message); return { error: 'Gửi câu hỏi thất bại' }; }

  // Thông báo chủ shop
  try {
    const admin = createAdminClient();
    const { data: p } = await admin.from('products').select('shop_id, name').eq('id', productId).maybeSingle();
    if (p) {
      const { data: shop } = await admin.from('shops').select('owner_id').eq('id', p.shop_id).maybeSingle();
      if (shop?.owner_id) {
        await createNotification(admin, {
          userId: shop.owner_id, type: 'info', title: 'Có câu hỏi mới về sản phẩm',
          message: `"${q.slice(0, 80)}" — ${p.name}`, link: `/products/${productId}`,
        });
      }
    }
  } catch (e) { console.error('askQuestion (notif):', e); }
  return { ok: true };
}

export async function answerQuestion(questionId: string, answer: string): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập' };
  const a = answer.trim();
  if (!a) return { error: 'Vui lòng nhập câu trả lời' };

  const admin = createAdminClient();
  const { data: q } = await admin.from('product_questions').select('id, product_id, user_id').eq('id', questionId).maybeSingle();
  if (!q) return { error: 'Không tìm thấy câu hỏi' };
  // Xác minh người trả lời là chủ shop của sản phẩm
  const { data: p } = await admin.from('products').select('shop_id').eq('id', q.product_id).maybeSingle();
  const { data: shop } = p ? await admin.from('shops').select('owner_id').eq('id', p.shop_id).maybeSingle() : { data: null };
  if (!shop || shop.owner_id !== user.id) return { error: 'Chỉ chủ shop được trả lời' };

  const { error } = await admin.from('product_questions').update({ answer: a.slice(0, 1000), answered_at: new Date().toISOString() }).eq('id', questionId);
  if (error) { console.error('answerQuestion:', error.message); return { error: 'Trả lời thất bại' }; }

  // Báo người hỏi
  if (q.user_id) {
    await createNotification(admin, {
      userId: q.user_id, type: 'info', title: 'Shop đã trả lời câu hỏi của bạn',
      message: a.slice(0, 80), link: `/products/${q.product_id}`,
    });
  }
  return { ok: true };
}
