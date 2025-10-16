import { Calendar, Clock, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const upcomingExams = [
  { name: "Calculus Midterm", deadline: "Oct 20, 2025", pool: "2.5 ETH" },
  { name: "Physics Quiz 3", deadline: "Oct 18, 2025", pool: "1.2 ETH" },
  { name: "Chemistry Lab Final", deadline: "Oct 25, 2025", pool: "3.8 ETH" },
];

const CreateExam = () => {
  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-1 flex justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                Create New Exam
              </h1>
              <p className="font-mono text-gray-600 mt-1 mb-6">
                Assign performance staking events for your class.
              </p>
            </div>
          </div>

          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8">
            <div className="space-y-6">
              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Select Class
                </Label>
                <select className="w-full bg-white border-2 border-black text-[#0A0A0A] px-4 py-3 focus:border-[#00A2FF] focus:outline-none">
                  <option>Calculus 101</option>
                  <option>Physics Advanced</option>
                  <option>Chemistry 201</option>
                  <option>Biology Fundamentals</option>
                </select>
              </div>

              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Exam Title
                </Label>
                <Input
                  placeholder="e.g., Midterm Examination"
                  className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#0A0A0A] mb-2 uppercase text-xs font-bold tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Exam Date
                  </Label>
                  <Input
                    type="date"
                    className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                  />
                </div>
                <div>
                  <Label className="text-[#0A0A0A] mb-2 uppercase text-xs font-bold tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Staking Deadline
                  </Label>
                  <Input
                    type="datetime-local"
                    className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Maximum Marks
                </Label>
                <Input
                  type="number"
                  placeholder="100"
                  className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3"
                />
              </div>

              <div>
                <Label className="text-[#0A0A0A] mb-2 block uppercase text-xs font-bold tracking-wider">
                  Description
                </Label>
                <Textarea
                  placeholder="Enter exam details and instructions..."
                  rows={4}
                  className="bg-white border-2 border-black text-[#0A0A0A] focus:border-[#00A2FF] px-4 py-3 resize-none"
                />
              </div>

              <button className="w-full px-6 py-4 bg-[#00A2FF] text-white border-2 border-black shadow-[6px_6px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wider font-black">
                <FileText className="inline w-5 h-5 mr-2" />
                Create Exam
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
              Upcoming Exams
            </h1>
            <p className="font-mono text-gray-600 mt-1 mb-6">
              Currently active staking events
            </p>
          </div>

          <div className="space-y-5">
            {upcomingExams.map((exam, index) => (
              <div
                key={index}
                className="bg-white border-4 border-black shadow-[5px_5px_0px_#000] p-5 hover:translate-x-1 hover:translate-y-1 transition-transform"
              >
                <h3 className="uppercase font-extrabold text-[#111] mb-3">
                  {exam.name}
                </h3>
                <div className="space-y-2 text-sm font-bold">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">DEADLINE</span>
                    <span className="text-[#00A2FF]">{exam.deadline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">STAKED POOL</span>
                    <span className="text-[#00FF99]">{exam.pool}</span>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-100 border border-black">
                  <div
                    className="h-full bg-[#00FF99]"
                    style={{ width: `${Math.random() * 40 + 60}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
