import React, { useState, useEffect } from "react";
import LeaderboardCard from "@/components/custom/LeaderboardCard";
import { NeoButton } from "@/components/custom/NeoButton";
import { Trophy, Medal, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PerformanceDashboard from "@/components/custom/PerformanceDialog";
import StakeDialogContent from "@/components/custom/StakeDialogContent"; 

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface Exam {
  _id: string;
  name: string;
  examDate: string;
  stakeDeadline: string;
  canStake: boolean;
} 

const mockStudents = [
  {
    rank: 1,
    name: "Alice Johnson",
    address: "0x4A...901",
    change: 8.4,
    avatar: "https://placehold.co/100x100/FFF/333?text=AJ",
    winRate: 85,
    stakes: 1527
  },
  {
    rank: 2,
    name: "Bob Smith",
    address: "0x7B...2C4",
    change: 6.1,
    avatar: "https://placehold.co/100x100/FFF/333?text=BS",
    winRate: 72,
    stakes: 1528
  },
  {
    rank: 3,
    name: "Carol Davis",
    address: "0x9E...5F7",
    change: 4.8,
    avatar: "https://placehold.co/100x100/FFF/333?text=CD",
    winRate: 65,
    stakes: 1527
  },
  {
    rank: 4,
    name: "David Wilson",
    address: "0x2D...8A3",
    change: -1.2,
    avatar: "https://placehold.co/100x100/FFF/333?text=DW",
    winRate: 45,
    stakes: 1528
  },
  {
    rank: 5,
    name: "Emma Brown",
    address: "0x5E...1B6",
    change: 2.7,
    avatar: "https://placehold.co/100x100/FFF/333?text=EB",
    winRate: 78,
    stakes: 1527
  },
  {
    rank: 6,
    name: "Frank Miller",
    address: "0x8F...C9E",
    change: 1.5,
    avatar: "https://placehold.co/100x100/FFF/333?text=FM",
    winRate: 55,
    stakes: 1528
  },
  {
    rank: 7,
    name: "Grace Lee",
    address: "0x3C...7D2",
    change: 3.2,
    avatar: "https://placehold.co/100x100/FFF/333?text=GL",
    winRate: 82,
    stakes: 1527
  },
  {
    rank: 8,
    name: "Henry Taylor",
    address: "0x6A...9F1",
    change: -0.8,
    avatar: "https://placehold.co/100x100/FFF/333?text=HT",
    winRate: 38,
    stakes: 1528
  },
  {
    rank: 9,
    name: "Ivy Chen",
    address: "0x1B...4E8",
    change: 5.1,
    avatar: "https://placehold.co/100x100/FFF/333?text=IC",
    winRate: 91,
    stakes: 1527
  },
  {
    rank: 10,
    name: "Jack Martinez",
    address: "0x9D...2A7",
    change: 2.3,
    avatar: "https://placehold.co/100x100/FFF/333?text=JM",
    winRate: 60,
    stakes: 1528
  },
  {
    rank: 11,
    name: "Katie Rodriguez",
    address: "0x4F...8B5",
    change: -2.1,
    avatar: "https://placehold.co/100x100/FFF/333?text=KR",
    winRate: 42,
    stakes: 1527
  },
  {
    rank: 12,
    name: "Leo Anderson",
    address: "0x7E...3C9",
    change: 4.5,
    avatar: "https://placehold.co/100x100/FFF/333?text=LA",
    winRate: 88,
    stakes: 1528
  },
];

const Classmates = () => {
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showExamSelection, setShowExamSelection] = useState(false);
  const [showStakeDialog, setShowStakeDialog] = useState(false);

  const topStudents = mockStudents.slice(0, 3);
  const otherStudents = mockStudents.slice(3);

  useEffect(() => {
    fetchAvailableExams();
  }, []);

  const fetchAvailableExams = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/classes/student/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const stakableExams = (data.exams || []).filter((exam: Exam) => 
          exam.canStake && new Date(exam.stakeDeadline) > new Date()
        );
        setAvailableExams(stakableExams);
      }
    } catch (error) {
      console.error("Error fetching available exams:", error);
    }
  };

  const handleStakeClick = (student: any) => {
    setSelectedStudent(student);
    setShowExamSelection(true);
  };

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam);
    setShowExamSelection(false);
    setShowStakeDialog(true);
  };

  const closeStakeDialog = () => {
    setShowStakeDialog(false);
    setSelectedExam(null);
    setSelectedStudent(null);
  };

  const podiumData = [
    {
      icon: <Trophy className="w-10 h-10 text-yellow-600" />,
      circleBgClass: "bg-yellow-200",
    },
    {
      icon: <Medal className="w-10 h-10 text-gray-600" />,
      circleBgClass: "bg-gray-200",
    },
    {
      icon: <Award className="w-10 h-10 text-orange-600" />,
      circleBgClass: "bg-orange-200",
    },
  ];

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 80) return "text-green-600";
    if (winRate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
      <header className="mb-16 md:mb-28 text-center">
        <h1 className="text-4xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
          CLASSMATES
          <br />
          <span className="text-accent">LEADERBOARD</span>
        </h1>
        <div className="inline-block bg-card border-4 border-border rounded-xl px-3 sm:px-5 py-1 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
          <p className="text-base sm:text-md font-bold">
            🏆 Top Performing Students 🏆
          </p>
        </div>
      </header>

      <section className="mb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-0 gap-12 items-end">
          <div className="md:order-1 order-2">
            <LeaderboardCard
              {...topStudents[1]}
              isPodium
              trophyImage={podiumData[1].icon}
              trophyCircleBgClass={podiumData[1].circleBgClass}
            />
          </div>
          <div className="md:order-2 order-1 md:transform md:scale-110 md:-translate-y-8">
            <LeaderboardCard
              {...topStudents[0]}
              isPodium
              trophyImage={podiumData[0].icon}
              trophyCircleBgClass={podiumData[0].circleBgClass}
            />
          </div>
          <div className="md:order-3 order-3">
            <LeaderboardCard
              {...topStudents[2]}
              isPodium
              trophyImage={podiumData[2].icon}
              trophyCircleBgClass={podiumData[2].circleBgClass}
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">All Students</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherStudents.map((student) => (
            <div 
              key={student.rank}
              className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-16 h-16 rounded-full border-2 border-black object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/80x80?text=Error";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xl text-gray-800 truncate">{student.name}</h3>
                  <p className="text-sm font-mono text-gray-600 truncate">{student.address}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-600 uppercase">WIN RATE</p>
                  <p className={`text-2xl font-black ${getWinRateColor(student.winRate)}`}>
                    {student.winRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-600 uppercase">STAKES</p>
                  <p className="text-2xl font-black text-gray-800">{student.stakes}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <NeoButton className="flex-1 bg-blue-400 py-3 text-base text-white cursor-pointer">
                      VIEW
                    </NeoButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-4xl bg-gray-50 border-4 border-black shadow-[8px_8px_0px_#000] rounded-lg max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
                    <DialogHeader className="flex flex-col sm:flex-row items-center justify-center relative space-y-0 mb-4 pt-4">
                      <div className="absolute left-0 top-0 sm:static sm:flex-shrink-0 mb-2 sm:mb-0">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-14 h-14 rounded-full border-4 border-black"
                        />
                      </div>
                      <div className="flex-grow text-center">
                        <DialogTitle className="text-2xl font-black mt-12 md:mt-0">
                          {student.name}'s Performance
                        </DialogTitle>
                        <p className="font-mono text-sm text-gray-600 break-all">
                          {student.address}
                        </p>
                      </div>
                    </DialogHeader>
                    <PerformanceDashboard />
                  </DialogContent>
                </Dialog>

                <NeoButton 
                  className="flex-1 bg-red-500 py-3 text-base text-white cursor-pointer"
                  onClick={() => handleStakeClick(student)}
                >
                  STAKE
                </NeoButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Exam Selection Dialog */}
      <Dialog open={showExamSelection} onOpenChange={setShowExamSelection}>
        <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Select Exam to Stake On
            </DialogTitle>
          </DialogHeader>
          
          {availableExams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No stakable exams available</p>
              <NeoButton 
                className="bg-gray-500 text-white px-6 py-2"
                onClick={() => setShowExamSelection(false)}
              >
                Close
              </NeoButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Choose an exam to stake on {selectedStudent?.name}:
              </p>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableExams.map((exam) => (
                  <div
                    key={exam._id}
                    onClick={() => handleExamSelect(exam)}
                    className="border-2 border-black p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <h4 className="font-bold">{exam.name}</h4>
                    <p className="text-sm text-gray-600">
                      Exam: {new Date(exam.examDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stake Deadline: {new Date(exam.stakeDeadline).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              
              <NeoButton 
                className="w-full bg-gray-500 text-white py-2"
                onClick={() => setShowExamSelection(false)}
              >
                Cancel
              </NeoButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stake Dialog */}
      <Dialog open={showStakeDialog} onOpenChange={(open) => !open && closeStakeDialog()}>
        <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
          {selectedExam && selectedStudent && (
            <StakeDialogContent
              stakeTargetName={selectedStudent.name}
              isSelfStake={false}
              examId={selectedExam._id}
              candidateAddress={selectedStudent.address}
              onClose={closeStakeDialog}
              onStakeSuccess={() => {
                closeStakeDialog();
                // Could refresh data here if needed
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Classmates;