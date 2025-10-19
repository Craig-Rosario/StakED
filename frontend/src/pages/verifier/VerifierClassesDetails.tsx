import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GradingDialog from "@/components/custom/GradingDialog";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const VerifierClassesDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("students");

  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Grading dialog state
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [showGradingDialog, setShowGradingDialog] = useState(false);

  const [examForm, setExamForm] = useState({
    name: "",
    description: "",
    examDate: "",
    stakeDeadline: "",
    commitDeadline: "",
    revealDeadline: "",
    maxMarks: 100 as number | string,
  });

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!id) {
        console.error("Missing class ID in URL");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/classes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        if (data.success) {
          setStudents(data.students || []);
          setExams(data.exams || []);
        } else {
          console.error("Class fetch failed:", data);
        }
      } catch (err) {
        console.error("Failed to fetch class details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setExamForm({ ...examForm, [e.target.name]: e.target.value });
  };

  const toISO = (s: string | Date) =>
    typeof s === "string" ? new Date(s).toISOString() : new Date(s).toISOString();

  const handleCreateExam = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!examForm.name || !examForm.examDate) {
        alert("Please fill in all required fields");
        return;
      }

      const examDateLocal = new Date(examForm.examDate);
      const defaultStake = new Date(examDateLocal.getTime() - 24 * 60 * 60 * 1000);
      defaultStake.setHours(23, 59, 0, 0);

      const commit = examForm.commitDeadline
        ? new Date(examForm.commitDeadline)
        : new Date(examDateLocal.getTime() + 2 * 24 * 60 * 60 * 1000);

      const reveal = examForm.revealDeadline
        ? new Date(examForm.revealDeadline)
        : new Date(examDateLocal.getTime() + 4 * 24 * 60 * 60 * 1000);

      const response = await fetch(`${API_BASE}/classes/${id}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: examForm.name,
          description: examForm.description,
          maxMarks: Number(examForm.maxMarks),
          examDate: toISO(examForm.examDate),
          stakeDeadline: toISO(defaultStake),
          commitDeadline: toISO(commit),
          revealDeadline: toISO(reveal),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Exam created successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error("Error creating exam:", err);
      alert("Error creating exam");
    }
  };

  const handleGradeExam = (exam: any) => {
    setSelectedExam(exam);
    setShowGradingDialog(true);
  };

  const closeGradingDialog = () => {
    setShowGradingDialog(false);
    setSelectedExam(null);
  };

  if (loading) {
    return <p className="text-center mt-10">Loading class details...</p>;
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="mb-6 flex justify-start">
        <Button
          onClick={() => navigate("/verifier/classes")}
          className="flex items-center gap-2 text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-md px-4 py-2 text-sm sm:text-base font-bold cursor-pointer bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 uppercase">Class Details</h1>
          <p className="font-mono text-gray-600 mt-1 mb-2">Manage students and exams for this class.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-7xl mx-auto">
        <TabsList className="relative flex w-full sm:w-1/2 mx-auto border-2 border-black rounded-xl overflow-hidden bg-gray-100 shadow-[4px_4px_0px_#000]">
          <TabsTrigger
            value="students"
            className="flex-1 py-3 text-center font-extrabold uppercase text-sm sm:text-base tracking-wide transition-all hover:bg-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_0_2px_#000]"
          >
            Students
          </TabsTrigger>
          <TabsTrigger
            value="exams"
            className="flex-1 py-3 text-center font-extrabold uppercase text-sm sm:text-base tracking-wide transition-all hover:bg-gray-200 data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-[inset_0_0_0_2px_#000]"
          >
            Exams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-8">
          <div className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] p-6">
            <h2 className="text-xl sm:text-2xl font-extrabold uppercase mb-5">Students Enrolled</h2>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b-2 border-black">
                  <TableHead className="font-bold uppercase">Name</TableHead>
                  <TableHead className="font-bold uppercase">Wallet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-semibold">{student.username || "Unnamed"}</TableCell>
                      <TableCell className="font-mono text-gray-700">{student.walletAddress || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500">
                      No students enrolled yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="exams" className="mt-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Exams</h2>
              <p className="font-mono text-gray-600 mt-1 mb-4 sm:mb-0">Manage and create exams for this class.</p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-red-400 text-white px-5 sm:px-6 py-3 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer rounded-md shadow-md">
                  <Plus className="w-5 h-5" /> Create New Exam
                </Button>
              </DialogTrigger>

              <DialogContent className="w-[90vw] sm:w-[80vw] md:max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6 rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-center uppercase">
                    Create New Exam
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-6 space-y-4">
                  <div>
                    <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">Exam Title</Label>
                    <Input
                      name="name"
                      value={examForm.name}
                      onChange={handleChange}
                      placeholder="e.g., Midterm Examination"
                      className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="uppercase text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Exam Date
                      </Label>
                      <Input
                        type="date"
                        name="examDate"
                        value={examForm.examDate}
                        onChange={handleChange}
                        className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <Label className="uppercase text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Staking Deadline
                      </Label>
                      <Input
                        type="datetime-local"
                        name="stakeDeadline"
                        value={examForm.stakeDeadline}
                        onChange={handleChange}
                        className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">Maximum Marks</Label>
                    <Input
                      type="number"
                      name="maxMarks"
                      value={examForm.maxMarks}
                      onChange={handleChange}
                      placeholder="100"
                      className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">Description</Label>
                    <Textarea
                      name="description"
                      value={examForm.description}
                      onChange={handleChange}
                      placeholder="Enter exam details and instructions..."
                      rows={4}
                      className="bg-white border-2 border-black px-3 py-2 text-sm sm:text-base resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={handleCreateExam}
                      disabled={!examForm.name || !examForm.examDate}
                      className="flex-1 px-4 py-3 bg-red-400 text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-md disabled:opacity-50 text-sm sm:text-base font-semibold cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {exams.length > 0 ? (
              exams.map((exam, index) => (
                <div
                  key={exam._id || index}
                  className="bg-white border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] p-5 flex flex-col justify-between transition-transform hover:translate-y-[-3px]"
                >
                  <div>
                    <h3 className="text-lg sm:text-xl font-black uppercase mb-2">{exam.name}</h3>

                    <div className="space-y-2 text-sm font-bold mb-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Exam Date</span>
                        <span className="text-[#00A2FF]">
                          {new Date(exam.examDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className="text-[#00FF99] capitalize">
                          {exam.status || "upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3">
                    <Button 
                      onClick={() => handleGradeExam(exam)}
                      className="bg-[#00FF99] text-black px-4 py-2 text-xs sm:text-sm font-bold cursor-pointer rounded-md w-full sm:w-auto"
                    >
                      Grade
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center col-span-3">No exams created yet.</p>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* Grading Dialog */}
      <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
        <DialogContent className="w-[95vw] max-w-2xl bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-6 rounded-lg">
          {selectedExam && (
            <GradingDialog
              examId={selectedExam._id}
              examName={selectedExam.name}
              students={students}
              onClose={closeGradingDialog}
              onGraded={() => {
                closeGradingDialog();
                // Could refresh data here if needed
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerifierClassesDetails;
