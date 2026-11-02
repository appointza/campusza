export interface AdmissionNumberSettings {
  prefix: string;
  suffix: string;
  nextNumber: number;
  padding: number;
  autoGenerate: boolean;
  preview: string;
}

export const defaultAdmissionNumberSettings = (): AdmissionNumberSettings => ({
  prefix: "",
  suffix: "",
  nextNumber: 1,
  padding: 4,
  autoGenerate: true,
  preview: "0001",
});

export function formatAdmissionNumberPreview(
  prefix: string,
  suffix: string,
  nextNumber: number,
  padding: number
): string {
  const pad = Math.min(12, Math.max(1, padding || 4));
  const num = Math.max(1, nextNumber || 1);
  return `${prefix}${String(num).padStart(pad, "0")}${suffix}`;
}

export function mapAdmissionNumberFromApi(data: Record<string, unknown> | null | undefined): AdmissionNumberSettings {
  const prefix = String(data?.prefix ?? "");
  const suffix = String(data?.suffix ?? "");
  const nextNumber = Number(data?.nextnumber ?? data?.nextNumber ?? 1);
  const padding = Number(data?.padding ?? 4);
  const autoGenerate = Boolean(data?.autogenerate ?? data?.autoGenerate ?? true);
  const preview = String(
    data?.preview ?? formatAdmissionNumberPreview(prefix, suffix, nextNumber, padding)
  );
  return { prefix, suffix, nextNumber, padding, autoGenerate, preview };
}
