import axios from 'axios';
import apiClient, { ActionReq, ActionRes } from '@/services/api.service';
import type {
  OrganizationAsset,
  OrganizationAssetDeleteReq,
  OrganizationAssetKind,
  OrganizationAssetSelectReq,
} from '@/models/asset.model';
import { getApiBaseUrl } from '@/utils/environment.util';
import { readAuthSession } from '@/utils/auth-session';

function mapAsset(data: Record<string, unknown>): OrganizationAsset {
  return {
    id: String(data.id ?? ''),
    organizationId: String(data.organizationid ?? data.organization_id ?? ''),
    storageProvider: String(data.storageprovider ?? data.storage_provider ?? 'local'),
    storageKey: String(data.storagekey ?? data.storage_key ?? ''),
    originalFileName: String(data.originalfilename ?? data.original_file_name ?? ''),
    contentType: String(data.contenttype ?? data.content_type ?? ''),
    fileSizeBytes: Number(data.filesizebytes ?? data.file_size_bytes ?? 0),
    kind: String(data.kind ?? 'generic'),
    checksumSha256: data.checksumsha256 != null ? String(data.checksumsha256) : undefined,
    uploadedBy: data.uploadedby != null ? String(data.uploadedby) : undefined,
    isActive: data.isactive != null ? Boolean(data.isactive) : undefined,
    createdAt: data.createdat != null ? String(data.createdat) : undefined,
    updatedAt: data.updatedat != null ? String(data.updatedat) : undefined,
  };
}

function sessionOrgAndEmail(): { organizationId: string; email: string } {
  const session = readAuthSession();
  return {
    organizationId: session?.organizationId ?? '',
    email: session?.email ?? '',
  };
}

class AssetService {
  private static instance: AssetService;
  private readonly endpoint = '/campusza/OrganizationAsset';

  static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService();
    }
    return AssetService.instance;
  }

  /** Upload a file; returns metadata including `id` to store on staff/student/org/document rows. */
  async upload(
    file: File,
    kind: OrganizationAssetKind | string = 'generic',
    organizationId?: string,
    email?: string,
  ): Promise<OrganizationAsset> {
    const ctx = sessionOrgAndEmail();
    const org = (organizationId ?? ctx.organizationId).trim();
    const userEmail = (email ?? ctx.email).trim();
    if (!org) {
      throw new Error('Organization is required to upload a file.');
    }

    const form = new FormData();
    form.append('file', file);
    form.append('organizationid', org);
    form.append('email', userEmail);
    form.append('kind', kind);

    const response = await axios.post<ActionRes<Record<string, unknown>>>(
      `${getApiBaseUrl()}${this.endpoint}/Upload`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return mapAsset(response.data.item ?? {});
  }

  async select(req: OrganizationAssetSelectReq): Promise<OrganizationAsset[]> {
    const ctx = sessionOrgAndEmail();
    const payload: OrganizationAssetSelectReq = {
      ...req,
      organizationid: req.organizationid || ctx.organizationId,
      email: req.email ?? ctx.email,
    };

    const response = await apiClient.post<ActionRes<Record<string, unknown>[]>>(
      `${this.endpoint}/Select`,
      { item: payload } satisfies ActionReq<OrganizationAssetSelectReq>,
    );

    const list = response.data.item ?? [];
    return Array.isArray(list) ? list.map((row) => mapAsset(row as Record<string, unknown>)) : [];
  }

  async delete(req: OrganizationAssetDeleteReq): Promise<void> {
    const ctx = sessionOrgAndEmail();
    await apiClient.post(`${this.endpoint}/Delete`, {
      item: {
        ...req,
        organizationid: req.organizationid || ctx.organizationId,
        email: req.email ?? ctx.email,
      },
    } satisfies ActionReq<OrganizationAssetDeleteReq>);
  }

  /** URL to stream file bytes (use in img src when org + email query params are allowed). */
  getDownloadUrl(assetId: string, organizationId?: string, email?: string): string {
    if (!assetId) return '';
    const ctx = sessionOrgAndEmail();
    const org = (organizationId ?? ctx.organizationId).trim();
    const userEmail = (email ?? ctx.email).trim();
    const params = new URLSearchParams({ organizationid: org });
    if (userEmail) params.set('email', userEmail);
    return `${getApiBaseUrl()}${this.endpoint}/Download/${encodeURIComponent(assetId)}?${params.toString()}`;
  }
}

export const assetService = AssetService.getInstance();
