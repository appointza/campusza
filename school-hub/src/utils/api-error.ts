import axios from "axios";

export function describeApiError(error: unknown, fallback = "Please try again."): string {
  if (!axios.isAxiosError(error)) return fallback;
  const raw = error.response?.data;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as { message?: string };
      return parsed.message?.trim() || raw;
    } catch {
      return raw;
    }
  }
  if (raw && typeof raw === "object" && "message" in raw) {
    const message = (raw as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
