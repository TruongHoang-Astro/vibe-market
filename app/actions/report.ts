'use server';
// Người dùng báo cáo nội dung vi phạm (sản phẩm / đánh giá / gian hàng).
// Báo cáo vào hàng đợi kiểm duyệt của admin (bảng reports — cần admin.sql).
import { createClient, createAdminClient } from '@/lib/supabase/server';

export interface ReportInput {
  targetType: 'product' | 'review' | 'shop';
  targetId: string;
  targetLabel?: string;
  reason: string;
}

export async function reportContent(input: ReportInput): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Bạn cần đăng nhập để báo cáo' };
  if (!input.reason?.trim()) return { error: 'Vui lòng nhập lý do báo cáo' };

  const admin = createAdminClient();
  const { error } = await admin.from('reports').insert({
    reporter_id: user.id,
    target_type: input.targetType,
    target_id: input.targetId,
    target_label: (input.targetLabel ?? '').slice(0, 200),
    reason: input.reason.trim().slice(0, 500),
    status: 'open',
  });
  if (error) { console.error('reportContent:', error.message); return { error: 'Gửi báo cáo thất bại (admin chưa bật tính năng?)' }; }
  return { ok: true };
}
