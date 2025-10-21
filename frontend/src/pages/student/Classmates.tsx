import { useState, useEffect } from "react";
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
import IntegratedStakeDialog from "@/components/custom/IntegratedStakeDialog"; 

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface Exam {
  _id: string;
  name: string;
  examDate: string;
  stakeDeadline: string;
  canStake: boolean;
} 

interface Classmate {
  _id: string;
  name: string;
  walletAddress: string;
  classes: Array<{
    classId: string;
    className: string;
    classCode: string;
  }>;
  rank: number;
  avatar: string;
  winRate: number;
  stakes: number;
  totalStakes: number;
  change: number;
}

const Classmates = () => {
  const [classmates, setClassmates] = useState<Classmate[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Classmate | null>(null);
  const [showExamSelection, setShowExamSelection] = useState(false);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassmates();
    fetchAvailableExams();
  }, []);

  const fetchClassmates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view classmates");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/classes/student/classmates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClassmates(data.classmates || []);
        if (data.classmates?.length === 0) {
          setError("No classmates found. Join some classes to see your peers!");
        }
      } else {
        setError("Failed to fetch classmates");
      }
    } catch (error) {
      console.error("Error fetching classmates:", error);
      setError("Error loading classmates data");
    } finally {
      setLoading(false);
    }
  };

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

  const handleStakeClick = (student: Classmate) => {
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

  const handleStakeSuccess = () => {
    closeStakeDialog();
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

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl font-bold">Loading classmates...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 mb-4">{error}</div>
            <NeoButton 
              className="bg-blue-500 text-white px-6 py-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </NeoButton>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (classmates.length === 0) {
    return (
      <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 lg:p-12">
        <header className="mb-16 md:mb-28 text-center">
          <h1 className="text-4xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
            CLASSMATES
            <br />
            <span className="text-accent">LEADERBOARD</span>
          </h1>
        </header>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-xl font-bold mb-4">No classmates found</div>
            <p className="text-gray-600 mb-4">Join some classes to see your peers and start staking on them!</p>
            <NeoButton 
              className="bg-blue-500 text-white px-6 py-2"
              onClick={() => window.location.href = '/student/join-class'}
            >
              Join a Class
            </NeoButton>
          </div>
        </div>
      </div>
    );
  }

  // Sort all students by winRate descending for podium
  const sortedStudents = [...classmates].sort((a, b) => b.winRate - a.winRate);
  const topStudents = sortedStudents.slice(0, 3);
  const otherStudents = sortedStudents.slice(3);

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

      {/* Top Performers Podium */}
      {topStudents.length > 0 && (
        <section className="mb-16 max-w-6xl mx-auto">
          <div className={`grid gap-12 items-end ${
            topStudents.length === 1 ? 'grid-cols-1 justify-center' :
            topStudents.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-3 md:gap-0'
          }`}>
            {topStudents.length >= 2 && (
              <div className="md:order-1 order-2">
                <LeaderboardCard
                  {...topStudents[1]}
                  address={formatWalletAddress(topStudents[1].walletAddress)}
                  isPodium
                  trophyImage={podiumData[1].icon}
                  trophyCircleBgClass={podiumData[1].circleBgClass}
                  onStakeClick={() => handleStakeClick(topStudents[1])}
                />
              </div>
            )}
            <div className={`${topStudents.length >= 2 ? 'md:order-2 order-1 md:transform md:scale-110 md:-translate-y-8' : ''}`}>
              <LeaderboardCard
                {...topStudents[0]}
                address={formatWalletAddress(topStudents[0].walletAddress)}
                isPodium
                trophyImage={podiumData[0].icon}
                trophyCircleBgClass={podiumData[0].circleBgClass}
                onStakeClick={() => handleStakeClick(topStudents[0])}
              />
            </div>
            {topStudents.length >= 3 && (
              <div className="md:order-3 order-3">
                <LeaderboardCard
                  {...topStudents[2]}
                  address={formatWalletAddress(topStudents[2].walletAddress)}
                  isPodium
                  trophyImage={podiumData[2].icon}
                  trophyCircleBgClass={podiumData[2].circleBgClass}
                  onStakeClick={() => handleStakeClick(topStudents[2])}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Students Section */}
      {otherStudents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">Other Students</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherStudents.map((student: Classmate) => (
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
                    <p className="text-sm font-mono text-gray-600 truncate">{formatWalletAddress(student.walletAddress)}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.classes.map((cls: {classId: string; className: string; classCode: string}, index: number) => (
                        <span key={index} className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                          {cls.className}
                        </span>
                      ))}
                    </div>
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
                    <p className="text-xs font-bold text-gray-600 uppercase">TOTAL STAKED</p>
                    <p className="text-xl font-black text-gray-800">{student.stakes} PYUSD</p>
                    <p className="text-xs text-gray-500">{student.totalStakes} stakes</p>
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
                            {formatWalletAddress(student.walletAddress)}
                          </p>
                        </div>
                      </DialogHeader>
                      <PerformanceDashboard 
                        studentId={student._id} 
                        studentName={student.name}
                      />
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
      )}

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

      {selectedExam && selectedStudent && (
        <IntegratedStakeDialog
          isOpen={showStakeDialog}
          onClose={closeStakeDialog}
          onSuccess={handleStakeSuccess}
          examId={selectedExam._id}
          candidateAddress={selectedStudent.walletAddress}
          candidateName={selectedStudent.name}
        />
      )}
    </div>
  );
};

export default Classmates;