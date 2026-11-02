export interface OrganizationBranding {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZipCode: string;
  addressCountry: string;
  website: string;
  logoUrl: string;
  logoAssetId: string;
  brandPrimaryColor: string;
}

export interface SaveOrganizationBrandingReq {
  organizationid: string;
  email: string;
  name: string;
  organizationemail: string;
  phone: string;
  addressstreet: string;
  addresscity: string;
  addressstate: string;
  addresszipcode: string;
  addresscountry: string;
  website: string;
  logoassetid: string;
  brandprimarycolor: string;
}

export function defaultOrganizationBranding(): OrganizationBranding {
  return {
    id: "",
    name: "",
    slug: "",
    email: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZipCode: "",
    addressCountry: "",
    website: "",
    logoUrl: "",
    logoAssetId: "",
    brandPrimaryColor: "",
  };
}

export function mapOrganizationBrandingFromApi(raw: Record<string, unknown> | undefined): OrganizationBranding {
  if (!raw) return defaultOrganizationBranding();
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    addressStreet: String(raw.addressstreet ?? raw.address_street ?? ""),
    addressCity: String(raw.addresscity ?? raw.address_city ?? ""),
    addressState: String(raw.addressstate ?? raw.address_state ?? ""),
    addressZipCode: String(raw.addresszipcode ?? raw.address_zip_code ?? ""),
    addressCountry: String(raw.addresscountry ?? raw.address_country ?? ""),
    website: String(raw.website ?? ""),
    logoUrl: String(raw.logourl ?? raw.logo_url ?? ""),
    logoAssetId: String(raw.logoassetid ?? raw.logo_asset_id ?? ""),
    brandPrimaryColor: String(
      raw.brandprimarycolor ?? raw.brand_primary_color ?? raw.brandPrimaryColor ?? "",
    ),
  };
}

export function toSaveOrganizationBrandingReq(
  branding: OrganizationBranding,
  organizationId: string,
  email: string
): SaveOrganizationBrandingReq {
  return {
    organizationid: organizationId,
    email,
    name: branding.name,
    organizationemail: branding.email,
    phone: branding.phone,
    addressstreet: branding.addressStreet,
    addresscity: branding.addressCity,
    addressstate: branding.addressState,
    addresszipcode: branding.addressZipCode,
    addresscountry: branding.addressCountry,
    website: branding.website,
    logoassetid: branding.logoAssetId,
    brandprimarycolor: branding.brandPrimaryColor,
  };
}
