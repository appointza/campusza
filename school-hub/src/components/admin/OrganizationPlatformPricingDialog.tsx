import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformStudentPricingCard } from "@/components/admin/PlatformStudentPricingCard";
import type { PlatformOrganizationRow, PlatformStudentPricing } from "@/services/dashboard.service";
import { defaultPlatformStudentPricing } from "@/services/dashboard.service";

type Props = {
  organization: PlatformOrganizationRow | null;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (organizationId: string, pricing: PlatformStudentPricing) => void | Promise<void>;
};

export function OrganizationPlatformPricingDialog({
  organization,
  open,
  saving,
  onOpenChange,
  onSave,
}: Props) {
  const pricing = organization?.studentPricing ?? defaultPlatformStudentPricing();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Platform fee — {organization?.name ?? "School"}</DialogTitle>
        </DialogHeader>
        {organization ? (
          <PlatformStudentPricingCard
            key={organization.id}
            pricing={pricing}
            saving={saving}
            organizationName={organization.name}
            onSave={async (next) => {
              await onSave(organization.id, next);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
