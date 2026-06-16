// lib/recently-viewed.ts — Lưu sản phẩm đã xem gần đây ở localStorage (client).
const KEY = 'vibe-recent';
const MAX = 12;

export function addRecentlyViewed(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    const arr = getRecentlyViewed().filter((x) => x !== id);
    arr.unshift(id);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch { /* bỏ qua */ }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch { return []; }
}
