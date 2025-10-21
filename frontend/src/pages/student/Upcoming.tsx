import { useState, useEffect } from "react";
import IntegratedStakeDialog from "@/components/custom/IntegratedStakeDialog";
import { useAnalytics } from "../../hooks/useAnalytics";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface Exam {
  _id: string;
  name: string;
  description: string;
  classId: {
    name: string;
    code: string;
  };
  verifier: {
    username: string;
  };
  examDate: string;
  stakeDeadline: string;
  maxMarks: number;
  timeLeft: string;
  canStake: boolean;
  status: string;
}

interface StakeInfo {
  hasStaked: boolean;
  totalStakeAmount: number;
  averagePredictedGrade: number;
  stakeCount: number;
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  className?: string;
}

const StatCard = ({ title, value, subtitle, className = "" }: StatCardProps) => {
  return (
    <div className={`border-4 border-black p-4 bg-white flex flex-col items-center text-center ${className}`}>
      <h3 className="text-sm font-bold text-gray-700 mb-1">{title}</h3>
      <span className="text-xl font-extrabold mb-1">{value}</span>
      <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
    </div>
  );
};



interface StakeInfo {
  hasStaked: boolean;
  totalStakeAmount: number;
  averagePredictedGrade: number;
  stakeCount: number;
}

export default function UpcomingTestsDashboard() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examStakeInfo, setExamStakeInfo] = useState<Record<string, StakeInfo>>({});
  const [loading, setLoading] = useState(true);
  const [userWalletAddress, setUserWalletAddress] = useState("");
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);

  // Get analytics data
  const { metrics } = useAnalytics(userWalletAddress, "11155111", analyticsRefreshTrigger);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // Fetch user profile to get wallet address
        const userResponse = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.user?.walletAddress) {
            setUserWalletAddress(userData.user.walletAddress);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchExams();
    fetchInitialData();
  }, []);

  const fetchStakeInfo = async (examId: string): Promise<StakeInfo> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/exams/${examId}/stake-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          hasStaked: data.hasStaked,
          totalStakeAmount: data.totalStakeAmount || 0,
          averagePredictedGrade: data.averagePredictedGrade || 0,
          stakeCount: data.stakeCount || 0,
        };
      }
    } catch (error) {
      console.error("Error fetching stake info:", error);
    }
    return { hasStaked: false, totalStakeAmount: 0, averagePredictedGrade: 0, stakeCount: 0 };
  };

  const fetchExams = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(`${API_BASE}/classes/student/exams`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const examList = data.exams || [];
        setExams(examList);

        // Fetch stake info for each exam
        const stakeInfoMap: Record<string, StakeInfo> = {};
        for (const exam of examList) {
          stakeInfoMap[exam._id] = await fetchStakeInfo(exam._id);
        }
        setExamStakeInfo(stakeInfoMap);
      } else {
        console.error("Failed to fetch exams");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedExam(null);
  };

  const openStakeModal = () => {
    setShowModal(false);
    setShowStakeModal(true);
  };

  const closeStakeModal = () => {
    setShowStakeModal(false);
    // Refresh analytics and exam data after staking
    setAnalyticsRefreshTrigger(prev => prev + 1);
    fetchExams();
  };

  const getExamColor = (status: string) => {
    switch (status) {
      case "staking": return "#FF6B6B";
      case "waiting": return "#4ECDC4";
      case "grading": return "#45B7D1";
      case "revealing": return "#96CEB4";
      default: return "#FECA57";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="font-mono text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <div className="min-h-screen">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
                <span className="text-black">Upcoming</span>
                <span className="text-green-500">Tests</span>
              </h1>
              
              <p className="font-mono text-gray-600 mt-1 text-sm sm:text-base">Monitor your metrics. Make your move.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6">Upcoming Tests</h2>
                  
                  {exams.length === 0 ? (
                    <div className="text-center py-12 bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8">
                      <p className="text-gray-500 text-lg mb-4 font-mono">No upcoming exams found</p>
                      <p className="text-gray-400">Join a class to see upcoming exams</p>
                      <button 
                        onClick={() => window.location.href = '/student/dashboard'}
                        className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-transform"
                      >
                        GO TO DASHBOARD
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {exams.map((exam) => (
                        <div 
                          key={exam._id}
                          className="border-4 border-black p-4 sm:p-6 bg-white shadow-[4px_4px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-transform cursor-pointer"
                          style={{ borderLeftColor: getExamColor(exam.status), borderLeftWidth: '8px' }}
                          onClick={() => handleExamSelect(exam)}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1">
                                {exam.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {exam.classId.name} ({exam.classId.code}) • {exam.verifier.username}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                                <span className="bg-gray-100 px-2 py-1 border border-gray-300 font-medium">
                                  {exam.timeLeft}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 border border-gray-300 font-medium">
                                  Max: {exam.maxMarks} marks
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 text-xs font-bold border-2 border-black ${
                                examStakeInfo[exam._id]?.hasStaked 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : exam.canStake 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                              }`}>
                                {examStakeInfo[exam._id]?.hasStaked 
                                  ? `Staked: ${examStakeInfo[exam._id].totalStakeAmount} PYUSD | Predicted Grade: ${examStakeInfo[exam._id].averagePredictedGrade}`
                                  : exam.canStake 
                                    ? 'CAN STAKE' 
                                    : 'STAKING CLOSED'
                                }
                              </span>

                            </div>
                          </div>
                          
                          <button 
                            className={`w-full py-2 mt-3 sm:mt-4 text-sm sm:text-lg border-2 border-black font-bold ${
                              examStakeInfo[exam._id]?.hasStaked 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : exam.canStake 
                                  ? 'text-black bg-white cursor-pointer hover:bg-gray-50'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (!examStakeInfo[exam._id]?.hasStaked && exam.canStake) {
                                handleExamSelect(exam);
                              }
                            }}
                            disabled={examStakeInfo[exam._id]?.hasStaked || !exam.canStake}
                          >
                            {examStakeInfo[exam._id]?.hasStaked 
                              ? 'Already Staked' 
                              : exam.canStake 
                                ? 'STAKE NOW' 
                                : 'VIEW DETAILS'
                            }
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6">Your Stats</h2>
                
                <div className="border-4 border-black p-4 sm:p-6 bg-white shadow-[6px_6px_0px_#000000]">
                  <h3 className="font-extrabold text-gray-800 mb-6 text-lg sm:text-xl text-center">Performance Overview</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard 
                      title="Total Staked" 
                      value={metrics?.totalStaked || "0 PYUSD"}
                      subtitle="Across all tests" 
                    />
                    <StatCard 
                      title="Stakes Won/Lost" 
                      value={`${metrics?.totalStakesWon || 0}/${metrics?.totalStakesLost || 0}`}
                      subtitle="Win/Loss ratio" 
                    />
                    <StatCard 
                      title="Win Rate" 
                      value={`${metrics?.winRate || 0}%`}
                      subtitle="Success rate" 
                    />
                    <StatCard 
                      title="Total Earnings" 
                      value={metrics?.totalEarnings || "0 PYUSD"}
                      subtitle="Net profit/loss" 
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 mb-3">Recent Results</h4>
                    {metrics?.examResults && metrics.examResults.length > 0 ? (
                      <div className="space-y-2">
                        {metrics.examResults.slice(0, 3).map((result, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200">
                            <span className="font-mono text-sm">{result.exam.substring(0, 8)}...</span>
                            <span className={`font-bold ${result.netReward >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.netReward >= 0 ? '+' : ''}{result.netReward.toFixed(2)} PYUSD
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent activity</p>
                        <p className="text-sm">Start staking on exams to see your activity here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={(isOpen) => { if (!isOpen) closeModal(); }}>
        <DialogContent className="w-[95vw] max-w-2xl bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
          {selectedExam && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                  {selectedExam.name}
                </h2>
                <p className="text-gray-600 mb-4">
                  {selectedExam.classId.name} • Instructor: {selectedExam.verifier.username}
                </p>
                <div className="bg-gray-50 p-4 border-2 border-gray-200 rounded">
                  <p className="text-gray-700">{selectedExam.description || "No description provided."}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-black p-3 bg-gray-50">
                  <p className="text-xs font-bold text-gray-600 mb-1">EXAM DATE</p>
                  <p className="font-bold">{new Date(selectedExam.examDate).toLocaleDateString()}</p>
                </div>
                <div className="border-2 border-black p-3 bg-gray-50">
                  <p className="text-xs font-bold text-gray-600 mb-1">STAKE DEADLINE</p>
                  <p className="font-bold">{new Date(selectedExam.stakeDeadline).toLocaleDateString()}</p>
                </div>
              </div>
              
              {selectedExam.canStake && !examStakeInfo[selectedExam._id]?.hasStaked && (
                <button 
                  onClick={openStakeModal}
                  className="w-full py-3 sm:py-4 text-lg sm:text-xl mt-4 sm:mt-6 cursor-pointer bg-green-500 hover:bg-green-600 text-white font-bold border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-transform"
                >
                  PLACE YOUR STAKE
                </button>
              )}
              
              {examStakeInfo[selectedExam._id]?.hasStaked && (
                <div className="w-full py-3 sm:py-4 text-lg sm:text-xl mt-4 sm:mt-6 bg-gray-100 border-2 border-gray-400 text-gray-600 font-bold text-center">
                  Already Staked: {examStakeInfo[selectedExam._id].totalStakeAmount} PYUSD
                  <br />
                  <span className="text-sm">Predicted Grade: {examStakeInfo[selectedExam._id].averagePredictedGrade}</span>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {selectedExam && (
        <IntegratedStakeDialog
          isOpen={showStakeModal}
          onClose={closeStakeModal}
          onSuccess={() => {
            closeStakeModal();
            fetchExams(); // This will also refresh stake info
          }}
          examId={selectedExam._id}
          candidateAddress={""} 
          candidateName="Yourself"
        />
      )}
    </div>
  );
}