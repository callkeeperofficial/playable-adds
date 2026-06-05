import { STORAGE_KEY } from './config';

const HISTORY_STORAGE_KEY = `${STORAGE_KEY}-round-history`;

export function loadBankedTotal() {
  return Number(localStorage.getItem(STORAGE_KEY) ?? 0) || 0;
}

export function saveBankedTotal(value: number) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

export function loadRoundHistory(fallback: number[]) {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) ?? '[]') as unknown;
    if (!Array.isArray(stored)) return fallback;
    const values = stored.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    return values.length ? values : fallback;
  } catch {
    return fallback;
  }
}

export function saveRoundHistory(values: number[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(values));
}
