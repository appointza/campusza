import { useState } from "react";
import { Link } from "react-router-dom";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Pencil, School, TrendingUp } from "lucide-react";
import type { PlatformDashboardPage, PlatformOrganizationRow, PlatformStudentPricing } from "@/services/dashboard.service";
import {
  describePlatformRate,
  estimatePlatformFeeForStudents,
  formatMoney,
} from "@/components/admin/PlatformStudentPricingCard";
import { OrganizationPlatformPricingDialog } from "@/components/admin/OrganizationPlatformPricingDialog";

type Props = {
  platform: PlatformDashboardPage;
  loading: boolean;
  savingPricing: boolean;
  onSaveOrgPricing: (organizationId: string, next: PlatformStudentPricing) => void | Promise<void>;
};

export function AdminPlatformOverview({ platform, loading, savingPricing, onSaveOrgPricing }: Props) {
  const [pricingOrg, setPricingOrg] = useState<PlatformOrganizationRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Registered schools</h1>
          <p className="text-muted-foreground mt-1">Platform overview — configure fee per student for each organization</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/register">Registration page</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Schools registered"
          value={loading ? "—" : String(platform.totalSchools)}
          icon={<School className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="Active organizations"
          value={loading ? "—" : String(platform.totalOrganizations)}
          icon={<Building2 className="w-6 h-6" />}
          color="secondary"
        />
        <StatCard
          title="On this list"
          value={loading ? "—" : String(platform.organizations.length)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="accent"
        />
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="font-display">All schools</CardTitle>
          <CardDescription>
            Set platform licensing per organization (per year or per term). Use Edit pricing on each row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : platform.organizations.length === 0 ? (
            <p className="text-muted-foreground">No organizations registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">School</th>
                    <th className="pb-3 pr-4 font-medium">Admin</th>
                    <th className="pb-3 pr-4 font-medium">Mobile</th>
                    <th className="pb-3 pr-4 font-medium">Slug</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium text-right">Students</th>
                    <th className="pb-3 pr-4 font-medium text-right">Staff</th>
                    <th className="pb-3 pr-4 font-medium">Rate</th>
                    <th className="pb-3 pr-4 font-medium text-right">Est. platform fee</th>
                    <th className="pb-3 pr-4 font-medium">Registered</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {platform.organizations.map((org) => {
                    const pricing = org.studentPricing;
                    return (
                      <tr key={org.id} className="border-b border-border/40 last:border-0">
                        <td className="py-3 pr-4 font-medium text-foreground">{org.name || "—"}</td>
                        <td className="py-3 pr-4 text-foreground">{org.adminName || "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground tabular-nums whitespace-nowrap">
                          {org.adminMobile || "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{org.slug || "—"}</td>
                        <td className="py-3 pr-4 capitalize text-muted-foreground">
                          {org.type?.replace(/_/g, " ") || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="capitalize">
                            {org.status || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{org.studentCount}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">{org.staffCount}</td>
                        <td className="py-3 pr-4 text-muted-foreground max-w-[200px]">
                          {describePlatformRate(pricing)}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {formatMoney(
                            pricing.currencyCode,
                            estimatePlatformFeeForStudents(pricing, org.studentCount),
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{org.createdAt || "—"}</td>
                        <td className="py-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setPricingOrg(org)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit pricing
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <OrganizationPlatformPricingDialog
        organization={pricingOrg}
        open={pricingOrg !== null}
        saving={savingPricing}
        onOpenChange={(open) => {
          if (!open) setPricingOrg(null);
        }}
        onSave={onSaveOrgPricing}
      />
    </div>
  );
}
