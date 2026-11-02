/** Normalize user input to #RRGGBB or null if invalid/empty. */
export function normalizeHexColor(input: string | null | undefined): string | null {
  if (input == null) return null;
  let v = input.trim();
  if (!v) return null;
  if (!v.startsWith("#")) v = `#${v}`;
  if (v.length === 4) {
    const r = v[1];
    const g = v[2];
    const b = v[3];
    v = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return null;
  return v.toUpperCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHexColor(hex);
  if (!n) return null;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return { r, g, b };
}

/** HSL components for Tailwind `hsl(var(--primary))` format: "H S% L%". */
export function hexToHslTriplet(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function hexToForegroundHslTriplet(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "0 0% 100%";
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.45 ? "220 20% 15%" : "0 0% 100%";
}

export function adjustHslTriplet(triplet: string, lightnessDelta: number, saturationDelta = 0): string {
  const match = /^(\d+)\s+(\d+)%\s+(\d+)%$/.exec(triplet.trim());
  if (!match) return triplet;
  const h = match[1];
  const s = Math.max(0, Math.min(100, parseInt(match[2], 10) + saturationDelta));
  const l = Math.max(0, Math.min(100, parseInt(match[3], 10) + lightnessDelta));
  return `${h} ${s}% ${l}%`;
}

const BRAND_HSL_KEYS = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--accent",
  "--accent-foreground",
  "--secondary",
  "--secondary-foreground",
  "--orange",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--sidebar-nav-active-foreground",
] as const;

const BRAND_FULL_VALUE_KEYS = ["--gradient-primary", "--shadow-primary"] as const;

export function brandColorStorageKey(organizationId: string): string {
  return `campusza_brand_color_${organizationId.trim()}`;
}

export function readCachedBrandColor(organizationId: string): string {
  if (!organizationId.trim()) return "";
  try {
    return sessionStorage.getItem(brandColorStorageKey(organizationId)) ?? "";
  } catch {
    return "";
  }
}

export function writeCachedBrandColor(organizationId: string, hex: string): void {
  if (!organizationId.trim()) return;
  try {
    const key = brandColorStorageKey(organizationId);
    if (!hex.trim()) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, normalizeHexColor(hex) ?? hex);
  } catch {
    /* ignore */
  }
}

/** Applies org brand color to global CSS variables (student portal uses Tailwind primary/accent tokens). */
export function applyOrganizationBrandTheme(hex: string | null | undefined): void {
  const root = document.documentElement;
  const normalized = normalizeHexColor(hex ?? "");
  if (!normalized) {
    for (const key of BRAND_HSL_KEYS) {
      root.style.removeProperty(key);
    }
    for (const key of BRAND_FULL_VALUE_KEYS) {
      root.style.removeProperty(key);
    }
    root.removeAttribute("data-student-brand");
    return;
  }

  const primary = hexToHslTriplet(normalized);
  if (!primary) return;

  const fg = hexToForegroundHslTriplet(normalized);
  const primaryLight = adjustHslTriplet(primary, 14);
  const accent = adjustHslTriplet(primary, 6);
  const secondary = adjustHslTriplet(primary, -6, -12);

  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-foreground", fg);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-foreground", fg);
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty("--secondary-foreground", fg);
  root.style.setProperty("--orange", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-primary-foreground", fg);
  root.style.setProperty("--sidebar-ring", primary);
  root.style.setProperty("--sidebar-nav-active-foreground", primary);
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, hsl(${primary}), hsl(${primaryLight}))`,
  );
  root.style.setProperty("--shadow-primary", `0 10px 30px -10px hsl(${primary} / 0.42)`);
  root.setAttribute("data-student-brand", normalized);
}

export function clearOrganizationBrandTheme(): void {
  applyOrganizationBrandTheme(null);
}
