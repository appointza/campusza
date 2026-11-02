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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  errors: string[];
  confirmLabel?: string;
  onConfirm: () => void;
  destructive?: boolean;
  requireReason?: boolean;
  reason?: string;
  onReasonChange?: (value: string) => void;
};

/** Validation summary or confirm-before-action dialog for exam lifecycle. */
export function ExamValidationSummaryDialog({
  open,
  onOpenChange,
  title,
  description,
  errors,
  confirmLabel = "Continue",
  onConfirm,
  destructive,
  requireReason,
  reason = "",
  onReasonChange,
}: Props) {
  const hasErrors = errors.length > 0;
  const canConfirm = !hasErrors && (!requireReason || reason.trim().length > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {hasErrors ? (
          <ul className="list-disc pl-5 text-sm text-destructive space-y-1" role="alert">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">All checks passed. You can proceed.</p>
        )}
        {requireReason && !hasErrors ? (
          <div className="space-y-2 pt-2">
            <Label htmlFor="exam-cancel-reason">Cancellation reason</Label>
            <Input
              id="exam-cancel-reason"
              value={reason}
              onChange={(e) => onReasonChange?.(e.target.value)}
              placeholder="Required"
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Close</AlertDialogCancel>
          {canConfirm ? (
            <AlertDialogAction
              type="button"
              className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
