// lib/commission.ts — Hoa hồng nền tảng (pure, dùng cả client & server).
export const PLATFORM_COMMISSION = 0.05; // 5%

// Số tiền người bán thực nhận từ một khoản doanh thu.
export function sellerEarning(revenue: number): number {
  return Math.round(revenue * (1 - PLATFORM_COMMISSION));
}

export function platformFee(revenue: number): number {
  return revenue - sellerEarning(revenue);
}
