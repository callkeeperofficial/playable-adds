import { STORAGE_KEY } from './config';

export function loadBankedTotal() {
  return Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
}

export function saveBankedTotal(value: number) {
  localStorage.setItem(STORAGE_KEY, String(value));
}
