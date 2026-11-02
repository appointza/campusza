import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User } from "lucide-react";
import type { StaffMember } from "@/models/staff.model";
import { cn } from "@/lib/utils";

type Props = {
  teachers: StaffMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  periodCountByTeacher: Record<string, number>;
  daysByTeacher: Record<string, number>;
  loading?: boolean;
};

export function TeacherSidebar({
  teachers,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  periodCountByTeacher,
  daysByTeacher,
  loading,
}: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 border-r border-border/60 pr-0 lg:pr-4">
      <h3 className="font-semibold text-sm mb-3 px-1">Teachers</h3>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8 h-9"
          placeholder="Search teacher"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] lg:sticky lg:top-24">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-4">
            No teachers found. Add teachers in Staff Management.
          </p>
        ) : (
          teachers.map((t) => {
            const periods = periodCountByTeacher[t.id] || 0;
            const days = daysByTeacher[t.id] || 0;
            const primary = t.subjects[0] || t.department;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-colors",
                  selectedId === t.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{primary}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {periods} period{periods === 1 ? "" : "s"} · {days} day{days === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
