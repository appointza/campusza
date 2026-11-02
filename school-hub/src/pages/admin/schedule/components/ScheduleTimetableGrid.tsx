import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Plus, RefreshCw } from "lucide-react";
import type { EffectiveScheduleEntry } from "../types";
import type { TimetableRow } from "../types";
import { WORKING_DAYS } from "../utils/schedule-week";

type Props = {
  rows: TimetableRow[];
  days?: readonly string[];
  getEntries: (day: string, timeLabel: string) => EffectiveScheduleEntry[];
  onAdd?: (day: string, row: TimetableRow) => void;
  onEdit?: (entry: EffectiveScheduleEntry) => void;
  onDelete?: (entry: EffectiveScheduleEntry) => void;
  loading?: boolean;
  emptyMessage?: string;
  readOnly?: boolean;
};

export function ScheduleTimetableGrid({
  rows,
  days = WORKING_DAYS,
  getEntries,
  onAdd,
  onEdit,
  onDelete,
  loading,
  emptyMessage,
  readOnly,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage || "No timetable rows configured."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div
          className="grid gap-2 mb-2 sticky top-0 z-10 bg-background/95 backdrop-blur py-1"
          style={{ gridTemplateColumns: `140px repeat(${days.length}, minmax(100px, 1fr))` }}
        >
          <div className="p-2 font-medium text-muted-foreground flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 shrink-0" />
            Period
          </div>
          {days.map((day) => (
            <div key={day} className="p-2 font-semibold text-center bg-muted rounded-lg text-xs sm:text-sm">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div
            key={row.key}
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `140px repeat(${days.length}, minmax(100px, 1fr))` }}
          >
            <div className="p-2 text-xs sm:text-sm sticky left-0 z-[1] bg-background border-r border-border/40">
              <div className={row.isBreak ? "font-semibold text-amber-900" : "font-medium"}>
                {row.periodName || row.timeLabel}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{row.rangeLabel}</div>
            </div>
            {days.map((day) => {
              const items = getEntries(day, row.timeLabel);
              return (
                <div key={`${day}-${row.key}`} className="min-h-[72px] p-0.5">
                  {row.isBreak ? (
                    <div className="h-full min-h-[72px] bg-amber-50 rounded-lg border border-amber-200 flex flex-col items-center justify-center text-amber-900 px-1">
                      <span className="text-xs font-semibold text-center">{row.periodName}</span>
                    </div>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-lg ${item.color} cursor-pointer hover:opacity-90 transition-opacity group relative h-full min-h-[72px] ${
                          item.isReplacement ? "ring-2 ring-amber-400" : ""
                        } ${item.isWeeklyOverride ? "ring-1 ring-dashed ring-blue-400" : ""}`}
                        onClick={() => onEdit?.(item)}
                      >
                        <div className="font-medium text-xs leading-tight">{item.subject}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{item.class}</div>
                        <div className="text-[10px] opacity-75">{item.room}</div>
                        {item.isReplacement && item.replacementTeacher && (
                          <div className="text-[10px] text-amber-800 flex items-center gap-0.5 mt-1">
                            <RefreshCw className="w-3 h-3" />
                            Sub: {item.replacementTeacher}
                          </div>
                        )}
                        {item.isWeeklyOverride && (
                          <Badge variant="outline" className="absolute -top-1 -left-1 text-[8px] px-1 py-0 h-4">
                            ↻ Override
                          </Badge>
                        )}
                        {item.isReplacement && (
                          <Badge className="absolute -top-1 -right-1 text-[8px] px-1 py-0 h-4 bg-amber-500">
                            Sub
                          </Badge>
                        )}
                        {!readOnly && onDelete && (
                          <button
                            type="button"
                            className="absolute bottom-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-[10px] text-destructive underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))
                  ) : readOnly ? (
                    <div className="h-full min-h-[72px] bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                      —
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full h-full min-h-[72px] bg-muted/30 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-[10px] hover:bg-muted/50 hover:border-primary/40 transition-colors"
                      onClick={() => onAdd?.(day, row)}
                    >
                      <Plus className="w-3 h-3 mb-0.5" />
                      Add Schedule
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
