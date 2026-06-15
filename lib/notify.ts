// lib/notify.ts — Gửi thông báo: in-app (bảng notifications) + email (Resend) + SMS (Twilio).
// Best-effort: nếu CHƯA cấu hình env tương ứng thì bỏ qua kênh đó (no-op), không ném lỗi.
// CHỈ import từ phía server (Server Actions / Route Handlers) vì cần service-role client.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase/types';

type Admin = SupabaseClient<Database>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vibemarket.beauty';

// ---------- Email (Resend HTTP API — không cần thêm package) ----------
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  if (!key || !from || !to) return false; // chưa cấu hình → bỏ qua
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) { console.error('sendEmail:', res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.error('sendEmail:', e); return false; }
}

// ---------- SMS (Twilio HTTP API) ----------
export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to) return false; // chưa cấu hình → bỏ qua
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    if (!res.ok) { console.error('sendSms:', res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.error('sendSms:', e); return false; }
}

export interface NotifyInput {
  userId: string;
  type: string;            // order | message | promo | info
  title: string;
  message?: string;
  link?: string;
  channels?: { email?: boolean; sms?: boolean }; // mặc định: email bật, sms tắt
}

// Tạo thông báo in-app + (best-effort) gửi email/SMS theo kênh.
export async function createNotification(admin: Admin, n: NotifyInput): Promise<void> {
  // 1) In-app — luôn lưu (đây là nguồn cho chuông + trang /notifications)
  try {
    await admin.from('notifications').insert({
      user_id: n.userId, type: n.type, title: n.title, message: n.message ?? '', link: n.link ?? null,
    });
  } catch (e) { console.error('createNotification (insert):', e); }

  const wantEmail = n.channels?.email !== false; // mặc định bật
  const wantSms = n.channels?.sms === true;       // mặc định tắt
  if (!wantEmail && !wantSms) return;

  // 2) Email/SMS — chỉ thực sự gửi nếu có cấu hình env (sendEmail/sendSms tự kiểm tra)
  try {
    let email: string | undefined;
    if (wantEmail) {
      const { data } = await admin.auth.admin.getUserById(n.userId);
      email = data.user?.email ?? undefined;
    }
    let phone: string | undefined;
    if (wantSms) {
      const { data: prof } = await admin.from('profiles').select('phone').eq('id', n.userId).maybeSingle();
      phone = prof?.phone ?? undefined;
    }
    const link = n.link ? `${SITE_URL}${n.link}` : undefined;
    const html = renderEmail(n.title, n.message ?? '', link);
    await Promise.all([
      wantEmail && email ? sendEmail(email, n.title, html) : Promise.resolve(false),
      wantSms && phone ? sendSms(phone, `${n.title}${n.message ? ' — ' + n.message : ''}`) : Promise.resolve(false),
    ]);
  } catch (e) { console.error('createNotification (dispatch):', e); }
}

function renderEmail(title: string, message: string, link?: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <div style="font-size:20px;font-weight:800;color:#EF4444">Vibe Market</div>
    <h2 style="font-size:18px;margin:16px 0 8px;color:#111">${escapeHtml(title)}</h2>
    <p style="color:#444;line-height:1.6">${escapeHtml(message)}</p>
    ${link ? `<a href="${link}" style="display:inline-block;margin-top:16px;background:#EF4444;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">Xem chi tiết</a>` : ''}
    <p style="color:#999;font-size:12px;margin-top:24px">Email tự động từ Vibe Market — bạn nhận được vì có tài khoản trên hệ thống.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
