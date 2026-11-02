import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { examService } from "@/services/exam.service";
import type { ExamSeries, ExamStudentResults } from "@/models/exam.model";
import { Printer } from "lucide-react";

const StudentExamResults = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [seriesList, setSeriesList] = useState<ExamSeries[]>([]);
  const [seriesId, setSeriesId] = useState("");
  const [results, setResults] = useState<ExamStudentResults | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("campusza_user");
    if (!raw) {
      navigate("/signin");
      return;
    }
    try {
      const user = JSON.parse(raw) as { role?: string; studentId?: string };
      if (user.role !== "student" || !user.studentId) {
        navigate("/signin");
        return;
      }
      setStudentId(user.studentId);
    } catch {
      navigate("/signin");
    }
  }, [navigate]);

  useEffect(() => {
    examService
      .selectSeries()
      .then((list) => setSeriesList(list.filter((s) => s.status === "Results Published")))
      .catch(() => setSeriesList([]));
  }, []);

  const loadResults = async () => {
    if (!seriesId || !studentId) return;
    setError("");
    try {
      const data = await examService.getStudentExamResults(seriesId, studentId);
      setResults(data);
    } catch {
      setResults(null);
      setError("Results are not available yet.");
    }
  };

  return (
    <DashboardLayout role="student">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <div>
            <h1 className="text-2xl font-bold">Exam results</h1>
            <p className="text-sm text-muted-foreground">Published results only</p>
          </div>
          <Button variant="outline" onClick={() => window.print()} disabled={!results?.published}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>

        <Card className="no-print">
          <CardContent className="pt-6">
            <Label>Exam series</Label>
            <Select value={seriesId} onValueChange={setSeriesId}>
              <SelectTrigger>
                <SelectValue placeholder="Select published series" />
              </SelectTrigger>
              <SelectContent>
                {seriesList.map((s) => (
                  <SelectItem key={s.id} value={s.id!}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="mt-3" onClick={loadResults} disabled={!seriesId}>
              View results
            </Button>
            {error ? <p className="text-sm text-destructive mt-2">{error}</p> : null}
          </CardContent>
        </Card>

        {results?.published ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {results.examseriesname} — {results.studentname}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Max</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Pass</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.subjects.map((row) => (
                    <TableRow key={row.sessionid}>
                      <TableCell>{row.subjectname}</TableCell>
                      <TableCell>{row.maxmarks}</TableCell>
                      <TableCell>{row.marksobtained == null ? "—" : row.marksobtained}</TableCell>
                      <TableCell>{row.attendancestatus}</TableCell>
                      <TableCell>{row.passed == null ? "—" : row.passed ? "Pass" : "Fail"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-sm">
                Total: {results.totalobtained ?? "—"} / {results.totalmax ?? "—"}
                {results.percentage != null ? ` (${results.percentage}%)` : ""}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default StudentExamResults;
