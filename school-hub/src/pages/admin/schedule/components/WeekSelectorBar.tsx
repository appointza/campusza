import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WeekRange } from "../types";

type Props = {
  weekRange: WeekRange;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
};

export function WeekSelectorBar({ weekRange, onPrev, onNext, onThisWeek }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous week">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[200px] text-center font-medium text-sm sm:text-base px-2">
        {weekRange.label}
      </div>
      <Button variant="outline" size="icon" onClick={onNext} aria-label="Next week">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onThisWeek}>
        This Week
      </Button>
    </div>
  );
}
