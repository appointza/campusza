import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { NotebookPen, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  homeworkService,
  type StaffHomeworkItem,
  type StaffHomeworkSlot,
} from "@/services/homework.service";
import { describeApiError } from "@/utils/api-error";
import { isPastDateYmd, localDateYmd } from "@/utils/date";

type FormState = {
  id: string;
  classid: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
};

const emptyForm = (): FormState => ({
  id: "",
  classid: "",
  subject: "",
  title: "",
  description: "",
  dueDate: "",
});

type Props = {
  selectedClassId: string;
  className: string;
  subjectLabel: string;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  embedded?: boolean;
};

function slotKey(slot: StaffHomeworkSlot): string {
  return `${slot.classid}|${slot.subject.trim().toLowerCase()}|${slot.time}`;
}

function primarySubject(label: string): string {
  const first = label.split(",")[0]?.trim();
  return first || label.trim() || "Lesson";
}

export function StaffClassHomeworkSection({
  selectedClassId,
  className,
  subjectLabel,
  selectedDate: controlledDate,
  onDateChange,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [internalDate, setInternalDate] = useState(localDateYmd());
  const [slots, setSlots] = useState<StaffHomeworkSlot[]>([]);
  const [activeSlotKey, setActiveSlotKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const activeDate = controlledDate || internalDate;
  const isPastDate = activeDate ? isPastDateYmd(activeDate) : false;

  const loadPage = useCallback(
    async (date: string) => {
      if (!selectedClassId) {
        setSlots([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await homeworkService.getStaffHomeworkPage(date);
        setInternalDate(data.date || date);
        const forClass = data.slots.filter((s) => s.classid === selectedClassId);
        if (forClass.length > 0) {
          setSlots(forClass);
        } else {
          setSlots([
            {
              classid: selectedClassId,
              classname: className,
              subject: primarySubject(subjectLabel),
              time: "",
              room: "",
              homework: [],
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load homework:", error);
        toast({
          title: "Error",
          description: "Failed to load homework.",
          variant: "destructive",
        });
        setSlots([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedClassId, className, subjectLabel, toast]
  );

  useEffect(() => {
    loadPage(activeDate);
  }, [selectedClassId, activeDate, loadPage]);

  const displaySlots = useMemo(() => slots, [slots]);

  const rejectPastEdit = () => {
    toast({
      title: "Past date",
      description: "Homework cannot be edited for previous days.",
      variant: "destructive",
    });
  };

  const openCreateForm = (slot: StaffHomeworkSlot) => {
    if (isPastDate) {
      rejectPastEdit();
      return;
    }
    setActiveSlotKey(slotKey(slot));
    setForm({
      ...emptyForm(),
      classid: slot.classid,
      subject: slot.subject,
    });
  };

  const openEditForm = (slot: StaffHomeworkSlot, item: StaffHomeworkItem) => {
    if (isPastDate) {
      rejectPastEdit();
      return;
    }
    setActiveSlotKey(slotKey(slot));
    setForm({
      id: item.id,
      classid: item.classid,
      subject: item.subject,
      title: item.title,
      description: item.description,
      dueDate: item.duedate,
    });
  };

  const handleSave = async () => {
    const date = activeDate;
    if (date && isPastDateYmd(date)) {
      rejectPastEdit();
      return;
    }
    if (!form.classid || !date) {
      toast({ title: "Error", description: "Missing class or date.", variant: "destructive" });
      return;
    }
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Title is required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const data = await homeworkService.save({
        id: form.id,
        classid: form.classid,
        subject: form.subject,
        title: form.title.trim(),
        description: form.description.trim(),
        assigneddate: date,
        duedate: form.dueDate || undefined,
      });
      setInternalDate(data.date);
      onDateChange?.(data.date);
      const forClass = data.slots.filter((s) => s.classid === selectedClassId);
      setSlots(
        forClass.length > 0
          ? forClass
          : [
              {
                classid: selectedClassId,
                classname: className,
                subject: form.subject,
                time: "",
                room: "",
                homework: [],
              },
            ]
      );
      setForm(emptyForm());
      setActiveSlotKey(null);
      toast({
        title: form.id ? "Homework updated" : "Homework assigned",
        description: `Saved for ${className}.`,
      });
    } catch (error) {
      console.error("Failed to save homework:", error);
      toast({
        title: "Error",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: StaffHomeworkItem) => {
    const date = activeDate;
    if (date && isPastDateYmd(date)) {
      rejectPastEdit();
      return;
    }
    if (!item.id) return;

    setSaving(true);
    try {
      const data = await homeworkService.delete(item.id, date);
      setInternalDate(data.date);
      onDateChange?.(data.date);
      const forClass = data.slots.filter((s) => s.classid === selectedClassId);
      setSlots(forClass.length > 0 ? forClass : slots);
      if (form.id === item.id) {
        setForm(emptyForm());
        setActiveSlotKey(null);
      }
      toast({ title: "Deleted", description: "Homework removed." });
    } catch (error) {
      console.error("Failed to delete homework:", error);
      toast({
        title: "Error",
        description: describeApiError(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!selectedClassId) {
    return (
      <Card className="shadow-lg border-border/50">
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Select a class to assign homework.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-primary" />
          Homework — {className}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign homework for this class on the selected date.
        </p>
        {isPastDate ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            Past date — homework is read-only.
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : (
          displaySlots.map((slot) => {
            const key = slotKey(slot);
            const isActive = activeSlotKey === key;
            return (
              <div key={key} className="rounded-xl border border-border/60 p-4 space-y-3 bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{slot.subject}</p>
                    {slot.time ? (
                      <p className="text-xs text-muted-foreground">{slot.time}</p>
                    ) : null}
                  </div>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => openCreateForm(slot)}
                    disabled={saving || isPastDate}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {isActive && (
                  <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-background">
                    <p className="font-medium text-sm">{form.id ? "Edit homework" : "New homework"}</p>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Homework title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instructions</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="What should students complete?"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due date (optional)</Label>
                      <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveSlotKey(null);
                          setForm(emptyForm());
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {slot.homework.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No homework for this date yet.</p>
                ) : (
                  slot.homework.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
                      <div className="font-medium">{item.title}</div>
                      {item.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        {item.duedate ? `Due: ${item.duedate}` : "No due date"}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(slot, item)}
                          disabled={saving || isPastDate}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(item)}
                          disabled={saving || isPastDate}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
