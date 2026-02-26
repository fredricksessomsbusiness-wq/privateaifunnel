export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

const STORAGE_KEY = "funnel_utms";

export function captureUtmsFromUrl(searchParams: URLSearchParams): UtmParams {
  const utms: UtmParams = {};

  UTM_KEYS.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      utms[key] = value;
    }
  });

  return utms;
}

export function storeUtms(utms: UtmParams): void {
  if (typeof window === "undefined") return;
  if (Object.keys(utms).length === 0) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
}

export function readStoredUtms(): UtmParams {
  if (typeof window === "undefined") return {};
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as UtmParams;
    return parsed;
  } catch {
    return {};
  }
}
