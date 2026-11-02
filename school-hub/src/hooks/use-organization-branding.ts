import { useEffect, useLayoutEffect, useState } from "react";
import { mapOrganizationBrandingFromApi } from "@/models/organization-branding.model";
import { assetService } from "@/services/asset.service";
import { pageService } from "@/services/page.service";
import { staffService } from "@/services/staff.service";
import {
  applyOrganizationBrandTheme,
  clearOrganizationBrandTheme,
  readCachedBrandColor,
  writeCachedBrandColor,
} from "@/utils/brand-color";

/** Loads org name, logo, and brand color for student shell branding + theme. */
export function useOrganizationBranding(enabled: boolean) {
  const [schoolName, setSchoolName] = useState("");
  const [logoSrc, setLogoSrc] = useState("");
  const [brandPrimaryColor, setBrandPrimaryColor] = useState("");

  useLayoutEffect(() => {
    if (!enabled) return;
    const cached = readCachedBrandColor(staffService.getOrganizationId());
    if (cached) {
      setBrandPrimaryColor(cached);
      applyOrganizationBrandTheme(cached);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const orgId = staffService.getOrganizationId();
    pageService
      .getOrganizationBranding()
      .then((raw) => {
        if (cancelled) return;
        const branding = mapOrganizationBrandingFromApi(raw);
        setSchoolName(branding.name.trim());
        const color = branding.brandPrimaryColor.trim();
        setBrandPrimaryColor(color);
        writeCachedBrandColor(orgId, color);
        if (branding.logoAssetId) {
          setLogoSrc(assetService.getDownloadUrl(branding.logoAssetId));
        } else if (branding.logoUrl.trim()) {
          setLogoSrc(branding.logoUrl.trim());
        } else {
          setLogoSrc("");
        }
      })
      .catch(() => {
        /* keep cache / Campusza fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      clearOrganizationBrandTheme();
      return;
    }
    applyOrganizationBrandTheme(brandPrimaryColor || null);
    return () => {
      clearOrganizationBrandTheme();
    };
  }, [enabled, brandPrimaryColor]);

  return {
    schoolName,
    logoSrc,
    brandPrimaryColor,
    showSchoolBrand: enabled && Boolean(schoolName),
  };
}
