// lib/payments/vnpay.ts — Tích hợp cổng thanh toán VNPay (chuẩn 2.1.0, HMAC-SHA512).
// CHỈ dùng phía server (cần crypto + secret). No-op nếu chưa cấu hình env → fallback cổng giả lập.
import crypto from 'crypto';

export function isVnpayConfigured(): boolean {
  return !!(process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET && process.env.VNPAY_URL);
}

// Chuỗi ký: keys sắp xếp tăng dần, value urlencode (space → '+'), nối bằng '&'.
function buildSignData(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
}

export interface VnpayOptions {
  orderId: string;
  amount: number;     // VND
  orderInfo: string;
  ipAddr: string;
  returnUrl: string;
}

export function buildVnpayUrl(opts: VnpayOptions): string {
  const tmnCode = process.env.VNPAY_TMN_CODE!;
  const secret = process.env.VNPAY_HASH_SECRET!;
  const vnpUrl = process.env.VNPAY_URL!; // vd sandbox: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const createDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const params: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(opts.amount) * 100), // VNPay tính theo đơn vị x100
    vnp_CurrCode: 'VND',
    vnp_TxnRef: opts.orderId,
    vnp_OrderInfo: opts.orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: opts.returnUrl,
    vnp_IpAddr: opts.ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  const signData = buildSignData(params);
  const signed = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
}

export interface VnpayResult {
  valid: boolean;   // chữ ký hợp lệ?
  orderId: string;
  success: boolean; // giao dịch thành công?
}

export function verifyVnpayReturn(query: Record<string, string>): VnpayResult {
  const secret = process.env.VNPAY_HASH_SECRET;
  if (!secret) return { valid: false, orderId: query['vnp_TxnRef'] ?? '', success: false };

  const received = query['vnp_SecureHash'] ?? '';
  const params = { ...query };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];

  const signData = buildSignData(params);
  const signed = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');

  return {
    valid: signed === received,
    orderId: query['vnp_TxnRef'] ?? '',
    success: query['vnp_ResponseCode'] === '00' && query['vnp_TransactionStatus'] === '00',
  };
}
