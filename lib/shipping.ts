// lib/shipping.ts — Cấu hình vận chuyển. Pure (không deps server) → dùng được cả client & server.
// Phí ship được tính lại phía server trong createOrder (không tin số từ client).

export interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  icon: string;
  baseFee: number;
}

export const FREE_SHIP_THRESHOLD = 299000; // miễn phí giao tiêu chuẩn từ mức này

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', eta: '2-3 ngày', icon: '📦', baseFee: 30000 },
  { id: 'express',  label: 'Giao hàng nhanh',       eta: '1 ngày',   icon: '⚡', baseFee: 60000 },
  { id: 'same-day', label: 'Giao trong ngày',       eta: 'Hôm nay (trước 22h)', icon: '🚀', baseFee: 100000 },
];

export function getShippingMethod(id: string): ShippingMethod {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

// Phí ship cuối cùng theo phương thức + tổng tiền hàng.
export function computeShippingFee(methodId: string, subtotal: number): number {
  const m = getShippingMethod(methodId);
  if (m.id === 'standard' && subtotal >= FREE_SHIP_THRESHOLD) return 0; // freeship tiêu chuẩn
  return m.baseFee;
}
