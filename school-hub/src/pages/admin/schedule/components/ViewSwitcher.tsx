import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScheduleViewMode } from "../types";

type Props = {
  value: ScheduleViewMode;
  onChange: (v: ScheduleViewMode) => void;
};

export function ViewSwitcher({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ScheduleViewMode)}>
      <TabsList>
        <TabsTrigger value="teacher">Teacher View</TabsTrigger>
        <TabsTrigger value="class">Class View</TabsTrigger>
        <TabsTrigger value="room">Room View</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
