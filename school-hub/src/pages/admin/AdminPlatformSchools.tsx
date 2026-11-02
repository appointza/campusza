import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdminPlatformOverview } from "@/components/admin/AdminPlatformOverview";
import { useToast } from "@/hooks/use-toast";
import {
  dashboardService,
  type PlatformDashboardPage,
  type PlatformStudentPricing,
} from "@/services/dashboard.service";
import { isSuperAdminFromStorage, readAuthSessionOrClear } from "@/utils/auth-session";

const emptyPlatform = (): PlatformDashboardPage => ({
  totalOrganizations: 0,
  totalSchools: 0,
  organizations: [],
});

const AdminPlatformSchools = () => {
  const { toast } = useToast();
  const session = readAuthSessionOrClear();
  const [platform, setPlatform] = useState<PlatformDashboardPage>(emptyPlatform);
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);

  useEffect(() => {
    if (!isSuperAdminFromStorage()) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getPlatformDashboardPage();
        setPlatform(data);
      } catch (error) {
        console.error("Failed to load platform schools:", error);
        toast({
          title: "Could not load schools",
          description: "Platform administrator access only.",
          variant: "destructive",
        });
        setPlatform(emptyPlatform());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast]);

  const handleSaveOrgPricing = async (organizationId: string, next: PlatformStudentPricing) => {
    setSavingPricing(true);
    try {
      const saved = await dashboardService.savePlatformStudentPricing(organizationId, next);
      setPlatform((prev) => ({
        ...prev,
        organizations: prev.organizations.map((org) =>
          org.id === organizationId ? { ...org, studentPricing: saved } : org,
        ),
      }));
      toast({
        title: "Pricing saved",
        description: "Platform fee updated for this organization.",
      });
    } catch (error) {
      console.error("Failed to save platform pricing:", error);
      toast({
        title: "Could not save pricing",
        description: "Platform administrator access only.",
        variant: "destructive",
      });
    } finally {
      setSavingPricing(false);
    }
  };

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  if (!isSuperAdminFromStorage()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <DashboardLayout role="admin" userName="Platform Admin">
      <AdminPlatformOverview
        platform={platform}
        loading={loading}
        savingPricing={savingPricing}
        onSaveOrgPricing={handleSaveOrgPricing}
      />
    </DashboardLayout>
  );
};

export default AdminPlatformSchools;
