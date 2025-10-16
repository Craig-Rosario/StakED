import { Plus, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeoButton } from "@/components/custom/NeoButton";

const mockClasses = [
  { id: 1, name: "Calculus 101", students: 32, exams: 5 },
  { id: 2, name: "Physics Advanced", students: 28, exams: 4 },
  { id: 3, name: "Chemistry 201", students: 25, exams: 6 },
  { id: 4, name: "Biology Fundamentals", students: 30, exams: 4 },
  { id: 5, name: "Algebra II", students: 35, exams: 3 },
  { id: 6, name: "Organic Chemistry", students: 22, exams: 5 },
];

const VerifierClasses = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="mb-5 flex justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">My Classes</h1>
          <p className="font-mono text-gray-600 mt-1 mb-6">Manage your courses, students & exams.</p>
        </div>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <NeoButton className="bg-[#00A2FF] text-white px-6 py-3 text-base font-extrabold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New Class
              </NeoButton>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_#000] p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-center uppercase">
                  Create New Class
                </DialogTitle>
              </DialogHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                    Class Name
                  </Label>
                  <Input
                    placeholder="e.g., Advanced Mathematics"
                    className="bg-white border-2 border-black focus:border-[#00A2FF] px-3 py-2"
                  />
                </div>
                <div>
                  <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                    Description
                  </Label>
                  <Input
                    placeholder="Brief description of the class"
                    className="bg-white border-2 border-black focus:border-[#00A2FF] px-3 py-2"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 px-4 py-3 border-2 border-black text-black hover:bg-gray-100 transition-all">
                    Cancel
                  </button>
                  <button className="flex-1 px-4 py-3 bg-[#00A2FF] text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    Create
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {mockClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white border-4 border-black rounded-lg shadow-[6px_6px_0px_#000] p-6 flex flex-col justify-between hover:translate-x-1 hover:translate-y-1 transition-transform"
          >
            <div>
              <h3 className="text-xl font-black uppercase mb-2">{cls.name}</h3>
              <div className="flex items-center justify-between text-sm font-bold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00A2FF]" /> {cls.students} Students
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#00FF99]" /> {cls.exams} Exams
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <NeoButton
                    className="bg-[#00FF99] text-black px-4 py-2 text-sm font-bold"
                    onClick={() => setSelectedClass(cls)}
                  >
                    VIEW
                  </NeoButton>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-3xl bg-white border-4 border-black shadow-[10px_10px_0px_#000] p-6 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center uppercase">
                      {cls.name} Overview
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-6 space-y-4">
                    <p className="text-sm font-mono text-gray-700">
                      Total Students: {cls.students}
                    </p>
                    <p className="text-sm font-mono text-gray-700">
                      Total Exams: {cls.exams}
                    </p>
                    <div className="border-t-2 border-black pt-4">
                      <p className="text-sm text-gray-600">
                        Add or remove students, assign upcoming exams, and manage class performance data.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <NeoButton className="bg-[#FF4C4C] text-white px-4 py-2 text-sm font-bold">
                    ADD STUDENT
                  </NeoButton>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[10px_10px_0px_#000] p-6">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-center uppercase">
                      Add Student to {cls.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                        Student Name
                      </Label>
                      <Input
                        placeholder="John Doe"
                        className="bg-white border-2 border-black focus:border-[#FF4C4C] px-3 py-2"
                      />
                    </div>
                    <div>
                      <Label className="uppercase text-xs font-bold text-gray-800 mb-1 block">
                        Wallet Address
                      </Label>
                      <Input
                        placeholder="0x..."
                        className="bg-white border-2 border-black focus:border-[#FF4C4C] px-3 py-2"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button className="flex-1 px-4 py-3 border-2 border-black text-black hover:bg-gray-100 transition-all">
                        Cancel
                      </button>
                      <button className="flex-1 px-4 py-3 bg-[#FF4C4C] text-white border-2 border-black shadow-[3px_3px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                        Add Student
                      </button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default VerifierClasses;
