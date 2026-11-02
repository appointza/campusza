import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, IndianRupee } from "lucide-react";
import type { PlatformStudentPricing, PlatformStudentPricingTerm } from "@/services/dashboard.service";

type Props = {
  pricing: PlatformStudentPricing;
  saving: boolean;
  organizationName?: string;
  onSave: (next: PlatformStudentPricing) => void | Promise<void>;
};

function clonePricing(p: PlatformStudentPricing): PlatformStudentPricing {
  return {
    billingPeriod: p.billingPeriod,
    currencyCode: p.currencyCode,
    amountPerStudentYearly: p.amountPerStudentYearly,
    termAmounts: p.termAmounts.map((t) => ({ ...t })),
  };
}

export function PlatformStudentPricingCard({ pricing, saving, organizationName, onSave }: Props) {
  const [draft, setDraft] = useState(() => clonePricing(pricing));

  useEffect(() => {
    setDraft(clonePricing(pricing));
  }, [pricing]);

  const termTotalPerStudent = useMemo(
    () => draft.termAmounts.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [draft.termAmounts],
  );

  const updateTerm = (index: number, patch: Partial<PlatformStudentPricingTerm>) => {
    setDraft((prev) => ({
      ...prev,
      termAmounts: prev.termAmounts.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };

  const addTerm = () => {
    setDraft((prev) => ({
      ...prev,
      termAmounts: [
        ...prev.termAmounts,
        { label: `${prev.termAmounts.length + 1}${ordinalSuffix(prev.termAmounts.length + 1)} Term`, amount: 0 },
      ],
    }));
  };

  const removeTerm = (index: number) => {
    setDraft((prev) => {
      if (prev.termAmounts.length <= 1) return prev;
      return { ...prev, termAmounts: prev.termAmounts.filter((_, i) => i !== index) };
    });
  };

  return (
    <Card className="shadow-lg border-border/50">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-primary" />
          Platform fee per student
        </CardTitle>
        <CardDescription>
          {organizationName
            ? `Fee per active student for ${organizationName}.`
            : "Set how much each school pays Campusza per active student — once per academic year or separately for each term."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Billing basis</Label>
          <RadioGroup
            value={draft.billingPeriod}
            onValueChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                billingPeriod: value === "per_term" ? "per_term" : "per_year",
              }))
            }
            className="flex flex-col sm:flex-row gap-4"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="per_year" id="billing-per-year" />
              <span>Per academic year (one amount per student)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="per_term" id="billing-per-term" />
              <span>Per term (1st term, 2nd term, …)</span>
            </label>
          </RadioGroup>
        </div>

        {draft.billingPeriod === "per_year" ? (
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="yearly-amount">Amount per student / year ({draft.currencyCode})</Label>
              <Input
                id="yearly-amount"
                type="number"
                min={0}
                step="0.01"
                value={draft.amountPerStudentYearly}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    amountPerStudentYearly: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Term amounts (per student, each term)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTerm}>
                <Plus className="w-4 h-4 mr-1" />
                Add term
              </Button>
            </div>
            <div className="space-y-2">
              {draft.termAmounts.map((term, index) => (
                <div key={`${term.label}-${index}`} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className="text-xs text-muted-foreground">Term name</Label>
                    <Input
                      value={term.label}
                      onChange={(e) => updateTerm(index, { label: e.target.value })}
                      placeholder="e.g. 1st Term"
                    />
                  </div>
                  <div className="w-36 space-y-1">
                    <Label className="text-xs text-muted-foreground">Amount ({draft.currencyCode})</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={term.amount}
                      onChange={(e) => updateTerm(index, { amount: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={draft.termAmounts.length <= 1}
                    onClick={() => removeTerm(index)}
                    aria-label="Remove term"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Total per student across all terms:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(draft.currencyCode, termTotalPerStudent)}
              </span>
            </p>
          </div>
        )}

        <Button
          variant="hero"
          disabled={saving}
          onClick={() => void onSave(clonePricing(draft))}
        >
          {saving ? "Saving…" : "Save pricing"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function formatMoney(currencyCode: string, amount: number): string {
  const code = currencyCode || "INR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function estimatePlatformFeeForStudents(
  pricing: PlatformStudentPricing,
  studentCount: number,
): number {
  const count = Math.max(0, studentCount);
  if (pricing.billingPeriod === "per_year") {
    return count * (Number(pricing.amountPerStudentYearly) || 0);
  }
  const perStudent = pricing.termAmounts.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  return count * perStudent;
}

export function describePlatformRate(pricing: PlatformStudentPricing): string {
  if (pricing.billingPeriod === "per_year") {
    return `${formatMoney(pricing.currencyCode, pricing.amountPerStudentYearly)} / student / year`;
  }
  const parts = pricing.termAmounts
    .filter((t) => t.label.trim())
    .map((t) => `${t.label.trim()}: ${formatMoney(pricing.currencyCode, t.amount)}`);
  return parts.length ? parts.join(" · ") : "—";
}
