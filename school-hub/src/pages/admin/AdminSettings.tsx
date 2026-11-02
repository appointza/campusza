import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  School,
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ImagePlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { ReferenceValue, ReferenceValueStatus } from "@/models/referencevalue.model";
import { 
  ReferenceValueCategory,
  getReferenceValueCategoryLabel, 
  getReferenceValueStatusColor,
  normalizeReferenceValueCategory,
  REFERENCE_MANAGED_SIDEBAR_ENTRIES,
  REFERENCE_MANAGED_SIDEBAR_ID,
  isManagedSidebarReferenceCategory,
  getManagedSidebarReferenceEntry,
  getReferenceSidebarCategoryLabel,
} from "@/models/referencevalue.model";
import { schoolRoomApi } from "@/services/school-room.service";
import { termService } from "@/services/term.service";
import { referenceValueService } from "@/services/reference-value.service";
import { pageService, getSessionEmail, mapReferenceValuesFromPage } from "@/services/page.service";
import { staffService } from "@/services/staff.service";
import { assetService } from "@/services/asset.service";
import {
  defaultOrganizationBranding,
  mapOrganizationBrandingFromApi,
  toSaveOrganizationBrandingReq,
  type OrganizationBranding,
} from "@/models/organization-branding.model";
import { writeCachedBrandColor } from "@/utils/brand-color";
import { admissionNumberService } from "@/services/admission-number.service";
import {
  type AdmissionNumberSettings,
  defaultAdmissionNumberSettings,
  formatAdmissionNumberPreview,
  mapAdmissionNumberFromApi,
} from "@/models/admission-number.model";
import {
  isSettingsReferencesLookupCategory,
  onboardingCategoryLabel,
  SETTINGS_REFERENCES_LOOKUP_CATEGORIES,
} from "@/models/onboarding.model";
import { Hash } from "lucide-react";
import { SettingsSchoolRoomsPanel } from "@/pages/admin/settings/SettingsSchoolRoomsPanel";
import { SettingsAcademicTermsPanel } from "@/pages/admin/settings/SettingsAcademicTermsPanel";
import { SettingsAcademicYearStructurePanel } from "@/pages/admin/settings/SettingsAcademicYearStructurePanel";
import { LogoBrandColorPicker } from "@/components/admin/LogoBrandColorPicker";

const DEFAULT_REF_FORM_CATEGORY = ReferenceValueCategory.ACADEMIC_YEAR;

const AdminSettings = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsTab = searchParams.get("tab") || "general";
  const refQuery = searchParams.get("ref");
  
  // Reference Values state
  const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
  const [refValuesLoading, setRefValuesLoading] = useState(false);
  const [isAddRefValueDialogOpen, setIsAddRefValueDialogOpen] = useState(false);
  const [isEditRefValueDialogOpen, setIsEditRefValueDialogOpen] = useState(false);
  const [isDeleteRefValueDialogOpen, setIsDeleteRefValueDialogOpen] = useState(false);
  const [selectedRefValue, setSelectedRefValue] = useState<ReferenceValue | null>(null);
  const [refValueFormData, setRefValueFormData] = useState<Partial<ReferenceValue>>({
    category: DEFAULT_REF_FORM_CATEGORY,
    code: "",
    name: "",
    description: "",
    displayOrder: 0,
    status: "active",
    isSystem: false,
    isDefault: false,
    isActive: true,
  });
  const [refValueSearchTerm, setRefValueSearchTerm] = useState("");
  const [categorySidebarSearch, setCategorySidebarSearch] = useState("");
  const [selectedRefCategory, setSelectedRefCategory] = useState<string | null>(null);
  const [admissionSettings, setAdmissionSettings] = useState<AdmissionNumberSettings>(defaultAdmissionNumberSettings());
  const [admissionSaving, setAdmissionSaving] = useState(false);
  const [orgBranding, setOrgBranding] = useState<OrganizationBranding>(defaultOrganizationBranding);
  const [orgSaving, setOrgSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoCacheKey, setLogoCacheKey] = useState(0);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [managedRecordCounts, setManagedRecordCounts] = useState({ rooms: 0, terms: 0 });
  const [managedCountsLoading, setManagedCountsLoading] = useState(false);

  const selectedManagedEntry = useMemo(
    () => getManagedSidebarReferenceEntry(selectedRefCategory),
    [selectedRefCategory]
  );
  const isManagedCategorySelected = Boolean(selectedManagedEntry);

  const admissionPreview = useMemo(
    () =>
      formatAdmissionNumberPreview(
        admissionSettings.prefix,
        admissionSettings.suffix,
        admissionSettings.nextNumber,
        admissionSettings.padding
      ),
    [admissionSettings]
  );

  const logoPreviewSrc = useMemo(() => {
    if (orgBranding.logoAssetId) {
      const base = assetService.getDownloadUrl(orgBranding.logoAssetId);
      return logoCacheKey ? `${base}${base.includes("?") ? "&" : "?"}v=${logoCacheKey}` : base;
    }
    if (orgBranding.logoUrl?.trim()) return orgBranding.logoUrl.trim();
    return "";
  }, [orgBranding.logoAssetId, orgBranding.logoUrl, logoCacheKey]);

  useEffect(() => {
    let cancelled = false;
    const loadReferenceValues = async () => {
      setRefValuesLoading(true);
      try {
        const page = await pageService.getAdminSettingsPage();
        if (cancelled) return;
        setReferenceValues(mapReferenceValuesFromPage(Array.isArray(page.referencevalues) ? page.referencevalues : []) as ReferenceValue[]);
        if (page.admissionnumber) {
          setAdmissionSettings(mapAdmissionNumberFromApi(page.admissionnumber as Record<string, unknown>));
        }
        const orgRaw = page.organization as Record<string, unknown> | undefined;
        if (orgRaw) {
          setOrgBranding(mapOrganizationBrandingFromApi(orgRaw));
        }
      } catch {
        if (!cancelled) {
          toast({
            title: "Failed to load reference values",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setRefValuesLoading(false);
      }
    };

    void loadReferenceValues();
    return () => {
      cancelled = true;
    };
    // Load once on mount; avoid re-fetch when toast identity changes (prevents References flicker).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistOrganizationBranding = useCallback(
    async (next: OrganizationBranding, successTitle: string) => {
      setOrgSaving(true);
      try {
        const saved = await pageService.saveOrganizationBranding(
          toSaveOrganizationBrandingReq(next, staffService.getOrganizationId(), getSessionEmail())
        );
        setOrgBranding(mapOrganizationBrandingFromApi(saved as Record<string, unknown>));
        writeCachedBrandColor(
          staffService.getOrganizationId(),
          mapOrganizationBrandingFromApi(saved as Record<string, unknown>).brandPrimaryColor,
        );
        toast({ title: successTitle });
      } catch {
        toast({
          title: "Save failed",
          description: "Could not save school information.",
          variant: "destructive",
        });
      } finally {
        setOrgSaving(false);
      }
    },
    [toast]
  );

  const handleSaveOrganizationBranding = () => {
    if (!orgBranding.name.trim()) {
      toast({
        title: "School name required",
        description: "Enter the school name before saving.",
        variant: "destructive",
      });
      return;
    }
    void persistOrganizationBranding(orgBranding, "School information saved");
  };

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Choose a PNG, JPG, or other image file.",
        variant: "destructive",
      });
      return;
    }
    setLogoUploading(true);
    try {
      const asset = await assetService.upload(file, "logo");
      const next = { ...orgBranding, logoAssetId: asset.id };
      setOrgBranding(next);
      setLogoCacheKey(Date.now());
      await persistOrganizationBranding(next, "School logo updated");
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload the logo. Try again.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    const next = { ...orgBranding, logoAssetId: "" };
    setOrgBranding(next);
    setLogoCacheKey(Date.now());
    void persistOrganizationBranding(next, "School logo removed");
  };

  useEffect(() => {
    if (settingsTab !== "references") return;
    let cancelled = false;
    const loadManagedCounts = async () => {
      setManagedCountsLoading(true);
      try {
        const [rooms, terms] = await Promise.all([
          schoolRoomApi.select(true),
          termService.getAll(),
        ]);
        if (!cancelled) {
          setManagedRecordCounts({
            rooms: rooms.filter((r) => r.isActive !== false).length,
            terms: terms.length,
          });
        }
      } catch {
        if (!cancelled) setManagedRecordCounts({ rooms: 0, terms: 0 });
      } finally {
        if (!cancelled) setManagedCountsLoading(false);
      }
    };
    void loadManagedCounts();
    return () => {
      cancelled = true;
    };
  }, [settingsTab]);

  useEffect(() => {
    if (refQuery === "rooms") {
      setSelectedRefCategory(REFERENCE_MANAGED_SIDEBAR_ID.SCHOOL_ROOMS);
    } else if (refQuery === "terms") {
      setSelectedRefCategory(REFERENCE_MANAGED_SIDEBAR_ID.ACADEMIC_TERMS);
    }
  }, [refQuery]);

  const structureYearId = searchParams.get("year") ?? "";

  const handleStructureYearChange = useCallback(
    (yearId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", "academic-structure");
        if (yearId) next.set("year", yearId);
        else next.delete("year");
        return next;
      });
    },
    [setSearchParams]
  );

  const handleSettingsTabChange = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "general") {
        next.delete("tab");
        next.delete("ref");
        next.delete("year");
      } else {
        next.set("tab", value);
        if (value !== "references") next.delete("ref");
        if (value !== "academic-structure") next.delete("year");
      }
      return next;
    });
  };

  const handleManagedCountChange = useCallback((kind: "rooms" | "terms", count: number) => {
    setManagedRecordCounts((prev) =>
      kind === "rooms" ? { ...prev, rooms: count } : { ...prev, terms: count }
    );
  }, []);

  const handleSaveAdmissionSettings = async () => {
    setAdmissionSaving(true);
    try {
      const saved = await admissionNumberService.saveSettings(admissionSettings);
      setAdmissionSettings(saved);
      toast({
        title: "Admission number series saved",
        description: `Next number will be ${saved.preview}.`,
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save admission number settings.",
        variant: "destructive",
      });
    } finally {
      setAdmissionSaving(false);
    }
  };

  // Reference Values handlers
  const handleAddRefValue = () => {
    const category =
      selectedRefCategory && !isManagedSidebarReferenceCategory(selectedRefCategory)
        ? selectedRefCategory
        : DEFAULT_REF_FORM_CATEGORY;
    setRefValueFormData({
      category,
      code: "",
      name: "",
      description: "",
      displayOrder: 0,
      status: "active",
      isSystem: false,
      isDefault: false,
      isActive: true,
    });
    setIsAddRefValueDialogOpen(true);
  };

  const handleEditRefValue = (refValue: ReferenceValue) => {
    if (refValue.isSystem) {
      toast({
        title: "Cannot edit",
        description: "System reference values cannot be changed.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRefValue(refValue);
    setRefValueFormData({ ...refValue });
    setIsEditRefValueDialogOpen(true);
  };

  const handleSaveRefValue = async () => {
    if (!refValueFormData.category || !refValueFormData.code || !refValueFormData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (isAddRefValueDialogOpen) {
      try {
        const created = await referenceValueService.create(refValueFormData);
        setReferenceValues(prev => [...prev, created]);
        toast({
          title: "Reference Value Created",
          description: `${created.name} has been added successfully.`,
        });
        setIsAddRefValueDialogOpen(false);
      } catch (error) {
        toast({
          title: "Create failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    } else if (isEditRefValueDialogOpen && selectedRefValue) {
      if (selectedRefValue.isSystem) {
        toast({
          title: "Cannot edit",
          description: "System reference values cannot be changed.",
          variant: "destructive",
        });
        return;
      }
      try {
        const updated = await referenceValueService.update({
          ...selectedRefValue,
          ...refValueFormData,
        });
        setReferenceValues(prev => prev.map(rv =>
          rv.id === selectedRefValue.id ? updated : rv
        ));
        toast({
          title: "Reference Value Updated",
          description: `${updated.name} has been updated successfully.`,
        });
        setIsEditRefValueDialogOpen(false);
        setSelectedRefValue(null);
      } catch (error) {
        toast({
          title: "Update failed",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }
    }
    setRefValueFormData({
      category: DEFAULT_REF_FORM_CATEGORY,
      code: "",
      name: "",
      description: "",
      displayOrder: 0,
      status: "active",
      isSystem: false,
      isDefault: false,
      isActive: true,
    });
  };

  const handleDeleteRefValue = (refValue: ReferenceValue) => {
    setSelectedRefValue(refValue);
    setIsDeleteRefValueDialogOpen(true);
  };

  const confirmDeleteRefValue = async () => {
    if (selectedRefValue) {
      if (selectedRefValue.isSystem) {
        toast({
          title: "Cannot Delete",
          description: "System-defined reference values cannot be deleted.",
          variant: "destructive",
        });
        setIsDeleteRefValueDialogOpen(false);
        setSelectedRefValue(null);
        return;
      }
      try {
        await referenceValueService.delete(selectedRefValue.id);
        setReferenceValues(prev => prev.filter(rv => rv.id !== selectedRefValue.id));
        setIsDeleteRefValueDialogOpen(false);
        setSelectedRefValue(null);
        toast({
          title: "Reference Value Removed",
          description: `${selectedRefValue.name} has been removed.`,
          variant: "destructive",
        });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const rv of referenceValues) {
      const k = normalizeReferenceValueCategory(rv.category);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [referenceValues]);

  const sortedCategories = useMemo(() => {
    return SETTINGS_REFERENCES_LOOKUP_CATEGORIES.map((c) => normalizeReferenceValueCategory(c)).filter(
      Boolean
    );
  }, []);

  const sidebarCategories = useMemo(() => {
    const managedIds = REFERENCE_MANAGED_SIDEBAR_ENTRIES.map((e) => e.id);
    return [...managedIds, ...sortedCategories];
  }, [sortedCategories]);

  const managedSidebarCount = useCallback(
    (categoryId: string) => {
      if (categoryId === REFERENCE_MANAGED_SIDEBAR_ID.SCHOOL_ROOMS) return managedRecordCounts.rooms;
      if (categoryId === REFERENCE_MANAGED_SIDEBAR_ID.ACADEMIC_TERMS) return managedRecordCounts.terms;
      return 0;
    },
    [managedRecordCounts]
  );

  const filteredSidebarCategories = useMemo(() => {
    const q = categorySidebarSearch.trim().toLowerCase();
    if (!q) return sidebarCategories;
    return sidebarCategories.filter((c) =>
      getReferenceSidebarCategoryLabel(c).toLowerCase().includes(q)
    );
  }, [sidebarCategories, categorySidebarSearch]);

  useEffect(() => {
    if (sidebarCategories.length === 0) return;
    setSelectedRefCategory((prev) => {
      if (prev && sidebarCategories.includes(prev)) return prev;
      return sidebarCategories[0];
    });
  }, [sidebarCategories]);

  const filteredRefValues = useMemo(() => {
    if (!selectedRefCategory || isManagedSidebarReferenceCategory(selectedRefCategory)) return [];
    const q = refValueSearchTerm.toLowerCase();
    const selNorm = normalizeReferenceValueCategory(selectedRefCategory);
    if (!isSettingsReferencesLookupCategory(selNorm)) return [];
    return referenceValues.filter((rv) => {
      if (normalizeReferenceValueCategory(rv.category) !== selNorm) return false;
      if (!q) return true;
      return (
        rv.name.toLowerCase().includes(q) ||
        rv.code.toLowerCase().includes(q) ||
        (rv.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [referenceValues, selectedRefCategory, refValueSearchTerm]);

  return (
    <DashboardLayout role="admin" userName="Admin User">
      <div className="flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] flex-col overflow-hidden lg:h-[calc(100dvh-2.5rem)] lg:max-h-[calc(100dvh-2.5rem)]">
        <Tabs
          value={settingsTab}
          onValueChange={handleSettingsTabChange}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
        >
          <TabsList className="w-full shrink-0 bg-muted/50 sm:w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="academic-structure">Academic structure</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="references">References</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-6 data-[state=inactive]:hidden">
            {/* School Information */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <School className="w-5 h-5 text-primary" />
                  School Information
                </CardTitle>
                <CardDescription>Basic information about your school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                    {logoPreviewSrc ? (
                      <img
                        src={logoPreviewSrc}
                        alt="School logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <School className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label>School logo</Label>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG, up to 25 MB. Shown on reports and branding where configured.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleLogoFileChange(e)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={logoUploading || orgSaving}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {logoUploading ? "Uploading…" : "Upload logo"}
                      </Button>
                      {orgBranding.logoAssetId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={logoUploading || orgSaving}
                          onClick={handleRemoveLogo}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <LogoBrandColorPicker
                  imageUrl={logoPreviewSrc || null}
                  value={orgBranding.brandPrimaryColor}
                  disabled={orgSaving || logoUploading}
                  onChange={(hex) => setOrgBranding({ ...orgBranding, brandPrimaryColor: hex })}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School name</Label>
                    <Input
                      id="schoolName"
                      value={orgBranding.name}
                      onChange={(e) => setOrgBranding({ ...orgBranding, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolSlug">URL slug</Label>
                    <Input id="schoolSlug" value={orgBranding.slug} readOnly className="bg-muted/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Street address</Label>
                  <Input
                    id="address"
                    value={orgBranding.addressStreet}
                    onChange={(e) => setOrgBranding({ ...orgBranding, addressStreet: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={orgBranding.addressCity}
                      onChange={(e) => setOrgBranding({ ...orgBranding, addressCity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={orgBranding.addressState}
                      onChange={(e) => setOrgBranding({ ...orgBranding, addressState: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={orgBranding.addressCountry}
                      onChange={(e) => setOrgBranding({ ...orgBranding, addressCountry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={orgBranding.email}
                      onChange={(e) => setOrgBranding({ ...orgBranding, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={orgBranding.phone}
                      onChange={(e) => setOrgBranding({ ...orgBranding, phone: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  variant="hero"
                  onClick={handleSaveOrganizationBranding}
                  disabled={orgSaving || logoUploading}
                >
                  {orgSaving ? "Saving…" : "Save school information"}
                </Button>
              </CardContent>
            </Card>

            {/* Admission number series */}
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Hash className="w-5 h-5 text-secondary" />
                  Admission Number Series
                </CardTitle>
                <CardDescription>
                  Configure prefix, numeric series, and suffix for new student admission numbers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adm-prefix">Prefix</Label>
                    <Input
                      id="adm-prefix"
                      placeholder="e.g. ADM-"
                      value={admissionSettings.prefix}
                      onChange={(e) =>
                        setAdmissionSettings({ ...admissionSettings, prefix: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adm-next">Next series number</Label>
                    <Input
                      id="adm-next"
                      type="number"
                      min={1}
                      value={admissionSettings.nextNumber}
                      onChange={(e) =>
                        setAdmissionSettings({
                          ...admissionSettings,
                          nextNumber: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adm-suffix">Suffix</Label>
                    <Input
                      id="adm-suffix"
                      placeholder="e.g. /26"
                      value={admissionSettings.suffix}
                      onChange={(e) =>
                        setAdmissionSettings({ ...admissionSettings, suffix: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adm-padding">Number padding (digits)</Label>
                    <Input
                      id="adm-padding"
                      type="number"
                      min={1}
                      max={12}
                      value={admissionSettings.padding}
                      onChange={(e) =>
                        setAdmissionSettings({
                          ...admissionSettings,
                          padding: Math.min(12, Math.max(1, Number(e.target.value) || 4)),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <div>
                      <Label className="text-sm font-medium">Auto-generate on add</Label>
                      <p className="text-xs text-muted-foreground">
                        Assign the next number when admission no is left blank
                      </p>
                    </div>
                    <Switch
                      checked={admissionSettings.autoGenerate}
                      onCheckedChange={(checked) =>
                        setAdmissionSettings({ ...admissionSettings, autoGenerate: checked })
                      }
                    />
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/40 px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1">Preview (next student)</p>
                  <p className="font-mono text-lg font-semibold text-foreground">{admissionPreview}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: prefix + zero-padded series + suffix
                  </p>
                </div>
                <Button variant="hero" onClick={handleSaveAdmissionSettings} disabled={admissionSaving}>
                  {admissionSaving ? "Saving…" : "Save admission series"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academic-structure" className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-6 data-[state=inactive]:hidden" forceMount={false}>
            {settingsTab === "academic-structure" ? (
              <SettingsAcademicYearStructurePanel
                active
                referenceValues={referenceValues}
                referenceValuesLoading={refValuesLoading}
                selectedYearId={structureYearId}
                onYearChange={handleStructureYearChange}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="notifications" className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-6 data-[state=inactive]:hidden">
            <Card className="shadow-lg border-border/50">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive updates via email</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Attendance Alerts</div>
                    <div className="text-sm text-muted-foreground">Get notified about low attendance</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">New Enrollment Alerts</div>
                    <div className="text-sm text-muted-foreground">Notify when new students enroll</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Report Reminders</div>
                    <div className="text-sm text-muted-foreground">Monthly report generation reminders</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="references" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
            <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-border/50 shadow-lg">
              <CardContent className="flex h-full min-h-0 flex-1 flex-col p-0">
                <div className="flex h-full min-h-0 flex-1 overflow-hidden">
                  <aside className="flex h-full min-h-0 w-full max-w-[280px] shrink-0 flex-col overflow-hidden border-r border-border bg-muted/30">
                    <div className="shrink-0 border-b border-border/80 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-foreground">Categories</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search category..."
                          value={categorySidebarSearch}
                          onChange={(e) => setCategorySidebarSearch(e.target.value)}
                          className="h-9 bg-background pl-9"
                        />
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      {refValuesLoading ? (
                        <p className="p-4 text-sm text-muted-foreground">Loading categories…</p>
                      ) : sidebarCategories.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No categories yet.</p>
                      ) : filteredSidebarCategories.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No matching categories.</p>
                      ) : (
                        <ul className="space-y-0.5 p-2">
                          {filteredSidebarCategories.map((cat) => {
                            const count = isManagedSidebarReferenceCategory(cat)
                              ? managedSidebarCount(cat)
                              : countByCategory.get(cat) ?? 0;
                            const label = isManagedSidebarReferenceCategory(cat)
                              ? getReferenceSidebarCategoryLabel(cat)
                              : onboardingCategoryLabel(cat as ReferenceValueCategory) ||
                                getReferenceSidebarCategoryLabel(cat);
                            const selected = selectedRefCategory === cat;
                            return (
                              <li key={cat}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedRefCategory(cat)}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                                    selected
                                      ? "bg-primary/10 font-medium text-primary"
                                      : "text-foreground hover:bg-muted/80"
                                  )}
                                >
                                  <span className="truncate">{label}</span>
                                  <span
                                    className={cn(
                                      "shrink-0 tabular-nums text-xs",
                                      selected ? "text-primary" : "text-muted-foreground"
                                    )}
                                  >
                                    {count}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </aside>

                  <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
                    <div className="flex shrink-0 flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold font-display text-foreground">
                          {selectedRefCategory
                            ? getReferenceSidebarCategoryLabel(selectedRefCategory)
                            : "Select a category"}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isManagedCategorySelected
                            ? managedCountsLoading
                              ? "Loading…"
                              : `${managedSidebarCount(selectedRefCategory!)} record${managedSidebarCount(selectedRefCategory!) === 1 ? "" : "s"}`
                            : `${filteredRefValues.length} record${filteredRefValues.length === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      {!isManagedCategorySelected ? (
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {normalizeReferenceValueCategory(selectedRefCategory) ===
                            ReferenceValueCategory.ACADEMIC_YEAR && (
                            <Button variant="outline" size="sm" asChild>
                              <Link to="/admin/settings?tab=academic-structure">
                                Terms &amp; classes by year
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={handleAddRefValue}
                            disabled={!selectedRefCategory}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add record
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {!isManagedCategorySelected ? (
                    <div className="shrink-0 border-b border-border/80 p-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={
                            selectedRefCategory && !isManagedCategorySelected
                              ? `Search ${getReferenceSidebarCategoryLabel(selectedRefCategory)}...`
                              : "Search..."
                          }
                          value={refValueSearchTerm}
                          onChange={(e) => setRefValueSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={!selectedRefCategory}
                        />
                      </div>
                    </div>
                    ) : null}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 pt-4">
                      {!selectedRefCategory ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          Select a category to view records.
                        </p>
                      ) : selectedRefCategory === REFERENCE_MANAGED_SIDEBAR_ID.SCHOOL_ROOMS ? (
                        <SettingsSchoolRoomsPanel
                          onCountChange={(n) => handleManagedCountChange("rooms", n)}
                        />
                      ) : selectedRefCategory === REFERENCE_MANAGED_SIDEBAR_ID.ACADEMIC_TERMS ? (
                        refValuesLoading ? (
                          <p className="py-12 text-center text-sm text-muted-foreground">
                            Loading reference values…
                          </p>
                        ) : (
                          <SettingsAcademicTermsPanel
                            referenceValues={referenceValues}
                            onCountChange={(n) => handleManagedCountChange("terms", n)}
                          />
                        )
                      ) : refValuesLoading ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          Loading reference values…
                        </p>
                      ) : filteredRefValues.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                          No records match your search.
                        </p>
                      ) : (
                        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
                        {filteredRefValues.map((refValue) => (
                          <div
                            key={refValue.id}
                            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/25"
                          >
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-foreground">{refValue.name}</span>
                                <Badge className={cn("text-xs", getReferenceValueStatusColor(refValue.status))}>
                                  {refValue.status}
                                </Badge>
                                {refValue.isSystem ? (
                                  <Badge variant="secondary" className="text-xs">
                                    System
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Custom
                                  </Badge>
                                )}
                                {refValue.isDefault ? (
                                  <Badge className="bg-amber-100 text-xs text-amber-900">
                                    Default
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 font-mono text-sm text-muted-foreground">{refValue.code}</p>
                              {refValue.description ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {refValue.description}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-muted-foreground">
                                Order: {refValue.displayOrder}
                                {refValue.organizationId != null && refValue.organizationId !== ""
                                  ? ` · Org: ${refValue.organizationId}`
                                  : " · Org: global"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Created by: {refValue.createdBy || "—"}
                                {refValue.createdAt
                                  ? ` · ${new Date(refValue.createdAt).toLocaleString()}`
                                  : ""}
                              </p>
                              {refValue.updatedBy ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  Updated by: {refValue.updatedBy}
                                  {refValue.updatedAt
                                    ? ` · ${new Date(refValue.updatedAt).toLocaleString()}`
                                    : ""}
                                </p>
                              ) : null}
                            </div>
                            {refValue.isSystem ? (
                              <span className="shrink-0 px-2 text-xs text-muted-foreground">Locked</span>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditRefValue(refValue)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteRefValue(refValue)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>

            {/* Add Reference Value Dialog */}
            <Dialog open={isAddRefValueDialogOpen} onOpenChange={setIsAddRefValueDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Reference Value</DialogTitle>
                  <DialogDescription>
                    Create a new reference value for use in dropdowns and forms.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ref-category">Category *</Label>
                    <Select
                      value={refValueFormData.category}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, category: value as ReferenceValueCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SETTINGS_REFERENCES_LOOKUP_CATEGORIES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {onboardingCategoryLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ref-code">Code *</Label>
                      <Input
                        id="ref-code"
                        placeholder="e.g., ACTIVE"
                        value={refValueFormData.code}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref-displayOrder">Display Order</Label>
                      <Input
                        id="ref-displayOrder"
                        type="number"
                        value={refValueFormData.displayOrder}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, displayOrder: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-name">Name *</Label>
                    <Input
                      id="ref-name"
                      placeholder="e.g., Active"
                      value={refValueFormData.name}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-shortName">Short Name (Optional)</Label>
                    <Input
                      id="ref-shortName"
                      placeholder="e.g., Act"
                      value={refValueFormData.shortName || ""}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, shortName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-description">Description (Optional)</Label>
                    <Textarea
                      id="ref-description"
                      placeholder="Add a description..."
                      value={refValueFormData.description || ""}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ref-status">Status</Label>
                    <Select
                      value={refValueFormData.status}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, status: value as ReferenceValueStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <div>
                      <Label htmlFor="ref-is-default" className="text-sm font-medium">
                        Default for category
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mark as the default option when none is chosen
                      </p>
                    </div>
                    <Switch
                      id="ref-is-default"
                      checked={refValueFormData.isDefault ?? false}
                      onCheckedChange={(checked) =>
                        setRefValueFormData({ ...refValueFormData, isDefault: checked })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddRefValueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="hero" onClick={handleSaveRefValue}>
                    Create Reference Value
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Reference Value Dialog */}
            <Dialog open={isEditRefValueDialogOpen} onOpenChange={setIsEditRefValueDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Reference Value</DialogTitle>
                  <DialogDescription>
                    {selectedRefValue?.isSystem
                      ? "System reference values cannot be edited."
                      : "Update the reference value information."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-category">Category</Label>
                    <Select
                      value={refValueFormData.category}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, category: value as ReferenceValueCategory })}
                      disabled={selectedRefValue?.isSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SETTINGS_REFERENCES_LOOKUP_CATEGORIES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {onboardingCategoryLabel(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-ref-code">Code</Label>
                      <Input
                        id="edit-ref-code"
                        value={refValueFormData.code}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, code: e.target.value.toUpperCase() })}
                        disabled={selectedRefValue?.isSystem}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-ref-displayOrder">Display Order</Label>
                      <Input
                        id="edit-ref-displayOrder"
                        type="number"
                        value={refValueFormData.displayOrder}
                        onChange={(e) => setRefValueFormData({ ...refValueFormData, displayOrder: parseInt(e.target.value) || 0 })}
                        disabled={selectedRefValue?.isSystem}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-name">Name</Label>
                    <Input
                      id="edit-ref-name"
                      value={refValueFormData.name}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, name: e.target.value })}
                      disabled={selectedRefValue?.isSystem}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-shortName">Short Name</Label>
                    <Input
                      id="edit-ref-shortName"
                      value={refValueFormData.shortName || ""}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, shortName: e.target.value })}
                      disabled={selectedRefValue?.isSystem}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-description">Description</Label>
                    <Textarea
                      id="edit-ref-description"
                      value={refValueFormData.description || ""}
                      onChange={(e) => setRefValueFormData({ ...refValueFormData, description: e.target.value })}
                      rows={3}
                      disabled={selectedRefValue?.isSystem}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-ref-status">Status</Label>
                    <Select
                      value={refValueFormData.status}
                      onValueChange={(value) => setRefValueFormData({ ...refValueFormData, status: value as ReferenceValueStatus })}
                      disabled={selectedRefValue?.isSystem}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                    <div>
                      <Label htmlFor="edit-ref-is-default" className="text-sm font-medium">
                        Default for category
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mark as the default option when none is chosen
                      </p>
                    </div>
                    <Switch
                      id="edit-ref-is-default"
                      checked={refValueFormData.isDefault ?? false}
                      onCheckedChange={(checked) =>
                        setRefValueFormData({ ...refValueFormData, isDefault: checked })
                      }
                      disabled={selectedRefValue?.isSystem}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditRefValueDialogOpen(false)}>
                    {selectedRefValue?.isSystem ? "Close" : "Cancel"}
                  </Button>
                  {!selectedRefValue?.isSystem && (
                    <Button variant="hero" onClick={handleSaveRefValue}>
                      Save Changes
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Reference Value Dialog */}
            <AlertDialog open={isDeleteRefValueDialogOpen} onOpenChange={setIsDeleteRefValueDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove{" "}
                    <span className="font-semibold">{selectedRefValue?.name}</span> from the reference values.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteRefValue}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
