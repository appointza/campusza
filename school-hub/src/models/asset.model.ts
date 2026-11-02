export type OrganizationAssetKind =
  | 'generic'
  | 'profile_photo'
  | 'logo'
  | 'document';

export interface OrganizationAsset {
  id: string;
  organizationId: string;
  storageProvider: string;
  storageKey: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  kind: OrganizationAssetKind | string;
  checksumSha256?: string;
  uploadedBy?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationAssetSelectReq {
  id?: string;
  organizationid: string;
  email?: string;
  kind?: string;
}

export interface OrganizationAssetDeleteReq {
  id: string;
  organizationid: string;
  email?: string;
}
