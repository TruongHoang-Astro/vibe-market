'use server';
// Số dư & rút tiền người bán + duyệt rút tiền (admin).
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notify';
import { sellerEarning, PLATFORM_COMMISSION } from '@/lib/commission';

export interface Withdrawal {
  id: string; amount: number; bankName: string; bankAccount: string; accountName: string; status: string; date: string;
}
export interface SellerFinance {
  earnings: number;      // tiền nhận (đã trừ hoa hồng) từ đơn đã giao
  commissionRate: number;
  withdrawn: number;     // tổng đã/đang rút (pending + approved)
  balance: number;       // khả dụng
  withdrawals: Withdrawal[];
  error?: string;
}

async function sellerCtx() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' as const };
  const { data: shop } = await supabase.from('shops').select('id').eq('owner_id', user.id).maybeSingle();
  if (!shop) return { error: 'noshop' as const };
  return { userId: user.id, shopId: shop.id };
}

export async function getSellerFinance(): Promise<SellerFinance> {
  const empty: SellerFinance = { earnings: 0, commissionRate: PLATFORM_COMMISSION, withdrawn: 0, balance: 0, withdrawals: [] };
  const c = await sellerCtx();
  if ('error' in c) return { ...empty, error: c.error };
  const admin = createAdminClient();

  // Doanh thu đơn ĐÃ GIAO của shop
  const { data: prods } = await admin.from('products').select('id').eq('shop_id', c.shopId);
  const ids = (prods ?? []).map((p) => p.id);
  let earnings = 0;
  if (ids.length) {
    const { data: rows } = await admin
      .from('order_items').select('price, qty, orders(status)').in('product_id', ids);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const it of (rows ?? []) as any[]) {
      if (it.orders?.status === 'delivered') earnings += sellerEarning(Number(it.price) * it.qty);
    }
  }

  // Lịch sử rút (resilient nếu chưa chạy payout.sql)
  let withdrawals: Withdrawal[] = [];
  let withdrawn = 0;
  const { data: ws } = await admin.from('withdrawals').select('*').eq('shop_id', c.shopId).order('created_at', { ascending: false });
  if (ws) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withdrawals = (ws as any[]).map((w) => ({ id: w.id, amount: Number(w.amount), bankName: w.bank_name, bankAccount: w.bank_account, accountName: w.account_name, status: w.status, date: w.created_at }));
    withdrawn = withdrawals.filter((w) => w.status !== 'rejected').reduce((s, w) => s + w.amount, 0);
  }

  const balance = Math.max(0, earnings - withdrawn);
  return { earnings, commissionRate: PLATFORM_COMMISSION, withdrawn, balance, withdrawals };
}

export interface WithdrawInput { amount: number; bankName: string; bankAccount: string; accountName: string; }
export async function requestWithdrawal(input: WithdrawInput): Promise<{ ok?: true; error?: string }> {
  const c = await sellerCtx();
  if ('error' in c) return { error: 'Bạn chưa có gian hàng' };
  const amount = Math.round(input.amount || 0);
  if (amount <= 0) return { error: 'Số tiền không hợp lệ' };
  if (!input.bankName.trim() || !input.bankAccount.trim() || !input.accountName.trim()) return { error: 'Vui lòng nhập đủ thông tin ngân hàng' };

  const fin = await getSellerFinance();
  if (amount > fin.balance) return { error: 'Số tiền vượt quá số dư khả dụng' };

  const admin = createAdminClient();
  const { error } = await admin.from('withdrawals').insert({
    shop_id: c.shopId, amount, bank_name: input.bankName.trim(), bank_account: input.bankAccount.trim(), account_name: input.accountName.trim(),
  });
  if (error) { console.error('requestWithdrawal:', error.message); return { error: 'Gửi yêu cầu thất bại' }; }
  return { ok: true };
}

// ---------- Admin ----------
export interface AdminWithdrawal extends Withdrawal { shopId: string; shopName: string; }
export async function getAdminWithdrawals(): Promise<{ items: AdminWithdrawal[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { items: [], error: 'unauth' };
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (prof?.role !== 'admin') return { items: [], error: 'forbidden' };

  const admin = createAdminClient();
  const { data, error } = await admin.from('withdrawals').select('*, shops(name)').order('created_at', { ascending: false });
  if (error) { console.error('getAdminWithdrawals:', error.message); return { items: [] }; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: AdminWithdrawal[] = ((data ?? []) as any[]).map((w) => ({
    id: w.id, amount: Number(w.amount), bankName: w.bank_name, bankAccount: w.bank_account, accountName: w.account_name,
    status: w.status, date: w.created_at, shopId: w.shop_id, shopName: w.shops?.name ?? w.shop_id,
  }));
  return { items };
}

export async function resolveWithdrawal(id: string, status: 'approved' | 'rejected'): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauth' };
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (prof?.role !== 'admin') return { error: 'Không có quyền' };

  const admin = createAdminClient();
  const { data: w, error } = await admin.from('withdrawals').update({ status }).eq('id', id).select('shop_id, amount').maybeSingle();
  if (error) { console.error('resolveWithdrawal:', error.message); return { error: 'Cập nhật thất bại' }; }
  // Thông báo chủ shop
  if (w) {
    const { data: shop } = await admin.from('shops').select('owner_id').eq('id', w.shop_id).maybeSingle();
    if (shop?.owner_id) {
      await createNotification(admin, {
        userId: shop.owner_id, type: 'info',
        title: status === 'approved' ? 'Yêu cầu rút tiền được duyệt ✅' : 'Yêu cầu rút tiền bị từ chối',
        message: `Số tiền ${Number(w.amount).toLocaleString('vi-VN')}đ — ${status === 'approved' ? 'đã được chuyển khoản' : 'bị từ chối'}.`,
        link: '/seller/dashboard',
      });
    }
  }
  return { ok: true };
}
