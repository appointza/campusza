import type { SchoolCalendarPage } from "@/models/school-calendar.model";
import { resolveSchoolCalendarDay } from "@/utils/school-calendar-resolve";
import { isDateInRange, localDateYmd, monthsSpanningRange, parseYmd } from "@/utils/date";
import { cn } from "@/lib/utils";

const WEEK_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  page: SchoolCalendarPage;
  termStart: string;
  termEnd: string;
  selectedYmd?: string;
  onDayClick: (date: Date) => void;
};

function dayCellClass(type: ReturnType<typeof resolveSchoolCalendarDay>["type"], inTerm: boolean): string {
  if (!inTerm) return "text-muted-foreground/30 bg-muted/20";
  switch (type) {
    case "closed":
      return "bg-red-100 text-red-900 hover:bg-red-200";
    case "half_day":
      return "bg-amber-100 text-amber-950 hover:bg-amber-200";
    case "open":
      return "bg-green-50 text-green-900 hover:bg-green-100";
    default:
      return "text-muted-foreground/40";
  }
}

function buildMonthCells(monthStart: Date): (Date | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function TermCalendarGrid({ page, termStart, termEnd, selectedYmd, onDayClick }: Props) {
  const months = monthsSpanningRange(termStart, termEnd);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {months.map((monthStart) => {
        const label = monthStart.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        const cells = buildMonthCells(monthStart);
        return (
          <div key={label} className="rounded-lg border bg-card p-3">
            <h3 className="text-sm font-semibold text-center mb-2">{label}</h3>
            <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted-foreground mb-1">
              {WEEK_HEADERS.map((h, i) => (
                <div key={`${label}-h-${i}`} className="text-center font-medium">
                  {h}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((date, idx) => {
                if (!date) {
                  return <div key={`${label}-e-${idx}`} className="h-7" />;
                }
                const ymd = localDateYmd(date);
                const inTerm = isDateInRange(ymd, termStart, termEnd);
                const resolved = resolveSchoolCalendarDay(
                  ymd,
                  page.term,
                  page.weeklyRules,
                  page.dayOverrides
                );
                const isSelected = selectedYmd === ymd;
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={!inTerm}
                    title={inTerm ? `${ymd} — ${resolved.type}` : undefined}
                    onClick={() => inTerm && onDayClick(parseYmd(ymd))}
                    className={cn(
                      "h-7 w-full rounded text-[10px] font-medium transition-colors",
                      dayCellClass(resolved.type, inTerm),
                      isSelected && "ring-2 ring-primary ring-offset-1",
                      !inTerm && "cursor-default"
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
