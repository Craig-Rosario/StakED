import { useState, useEffect } from "react";
import { Award, BookOpen, TrendingUp, Wallet } from "lucide-react";
import ManualClaim from "../../components/ManualClaim";
import { StudentAnalytics } from "../../components/StudentAnalytics";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface Class {
  _id: string;
  name: string;
  code: string;
  description: string;
  verifier: {
    username: string;
  };
  studentsCount: number;
  upcomingExams?: number;
  classmates?: number;
}

interface ClaimableStake {
  _id: string;
  stakeAmount: number;
  rewardAmount: number;
  predictedMarks: number;
  actualMarks: number;
  candidateAddress?: string;
  isWinner: boolean;
  isClaimed: boolean;
  exam?: {
    _id: string;
    name: string;
    maxMarks: number;
  };
  class?: {
    name: string;
    code: string;
  };
  createdAt: string;
}

interface GroupedClaimableExam {
  examId: string;
  examName: string;
  className: string;
  classCode: string;
  maxMarks: number;
  stakes: ClaimableStake[];
  totalStakeAmount: number;
  totalRewardAmount: number;
  stakeCount: number;
}

export default function StudentDashboard() {
  const [userWalletAddress, setUserWalletAddress] = useState<string>("");
  const [chainId] = useState<string>("11155111"); 
  const [classes, setClasses] = useState<Class[]>([]);
  const [claimableStakes, setClaimableStakes] = useState<ClaimableStake[]>([]);
  const [groupedClaimableExams, setGroupedClaimableExams] = useState<GroupedClaimableExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [userName, setUserName] = useState("Student");
  const [showManualClaim, setShowManualClaim] = useState(false);
  const [manualClaimData, setManualClaimData] = useState<{contractAddress: string; examId: string} | null>(null);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);

  useEffect(() => {
    window.updateAnalytics = () => {
      setAnalyticsRefreshTrigger(prev => prev + 1);
    };
  }, []);
  
  const [joinFormData, setJoinFormData] = useState({
    classCode: "",
    studentName: "",
  });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchClaimableStakes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/exams/stakes/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const claimable = (data.stakes || []).filter((stake: ClaimableStake) => 
          stake.isWinner && !stake.isClaimed && stake.rewardAmount > 0
        );
        setClaimableStakes(claimable);

        const groupedByExam = claimable.reduce((groups: Record<string, GroupedClaimableExam>, stake: ClaimableStake) => {
          const examId = stake.exam?._id;
          if (!examId) return groups;

          if (!groups[examId]) {
            groups[examId] = {
              examId,
              examName: stake.exam?.name || 'Unknown Exam',
              className: stake.class?.name || 'Unknown Class',
              classCode: stake.class?.code || 'N/A',
              maxMarks: stake.exam?.maxMarks || 100,
              stakes: [],
              totalStakeAmount: 0,
              totalRewardAmount: 0,
              stakeCount: 0
            };
          }

          groups[examId].stakes.push(stake);
          groups[examId].totalStakeAmount += stake.stakeAmount;
          groups[examId].totalRewardAmount += stake.rewardAmount;
          groups[examId].stakeCount += 1;

          return groups;
        }, {});

        setGroupedClaimableExams(Object.values(groupedByExam));
      }
    } catch (error) {
      console.error("Error fetching claimable stakes:", error);
    }
  };

  const handleClaimReward = async (examId: string) => {
    try {
      setClaiming(examId);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE}/exams/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ examId })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowClaimSuccess(true);
        
        setTimeout(() => {
          setShowClaimSuccess(false);
        }, 5000);
        
        setAnalyticsRefreshTrigger(prev => prev + 1);
        
        fetchClaimableStakes();
        fetchDashboardData(); 
      } else {
        if (data.requiresUserTransaction) {
          setManualClaimData({
            contractAddress: data.blockchain.contractAddress,
            examId: data.blockchain.examId
          });
          setShowManualClaim(true);
        } else {
          alert(`❌ Claim failed: ${data.message}`);
        }
      }
    } catch (error: any) {
      alert(`❌ Claim error: ${error.message}`);
    } finally {
      setClaiming(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      let currentUserName = "Student";
      let walletAddress = "";
      try {
        const userResponse = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUserName = userData.user?.username || "Student";
          walletAddress = userData.user?.walletAddress || "";
          setUserName(currentUserName);
          setUserWalletAddress(walletAddress);
          setJoinFormData(prev => ({ ...prev, studentName: currentUserName }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }

      await fetchClaimableStakes();

      try {
        const classesResponse = await fetch(`${API_BASE}/classes/student`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (classesResponse.ok) {
          const classesData = await classesResponse.json();
          const classesWithDetails = await Promise.all(
            (classesData.classes || []).map(async (cls: any) => {
              let upcomingExams = 0;
              try {
                const examsResponse = await fetch(`${API_BASE}/classes/${cls._id}/exams`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (examsResponse.ok) {
                  const examsData = await examsResponse.json();
                  upcomingExams = (examsData.exams || []).filter((exam: any) => 
                    new Date(exam.stakeDeadline) >= new Date()
                  ).length;
                }
              } catch (error) {
                console.error("Error fetching exams for class:", cls._id, error);
              }
              
              return {
                ...cls,
                upcomingExams,
                classmates: (cls.studentsCount || 1) - 1,
              };
            })
          );
          setClasses(classesWithDetails);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinInputChange = (field: string, value: string) => {
    setJoinFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJoinClass = async () => {
    try {
      setJoinLoading(true);
      setJoinMessage("");

      if (!joinFormData.classCode || !joinFormData.studentName) {
        setJoinMessage("Please enter both class code and your name");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setJoinMessage("Please login first");
        return;
      }

      const response = await fetch(`${API_BASE}/classes/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classCode: joinFormData.classCode.toUpperCase(),
          studentName: joinFormData.studentName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoinMessage("✅ Successfully joined the class!");
        setJoinFormData({ classCode: "", studentName: joinFormData.studentName });
        setUserName(joinFormData.studentName.trim());
        
        setTimeout(() => {
          fetchDashboardData();
          setJoinMessage("");
        }, 2000);
      } else {
        setJoinMessage(`❌ ${data.message || "Invalid class code"}`);
      }
    } catch (error) {
      console.error("Error joining class:", error);
      setJoinMessage("❌ Error joining class");
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="font-mono text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-2">
            Welcome back, <span className="text-green-500">{userName}</span>
          </h1>
          <p className="font-mono text-gray-600 text-lg">
            Your StakED performance at a glance
          </p>
        </div>

          {userWalletAddress && (
            <div className="mb-8">
              <StudentAnalytics userAddress={userWalletAddress} chainId={chainId} refreshTrigger={analyticsRefreshTrigger} />
            </div>
          )}

        {showClaimSuccess && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-100 to-green-200 border-4 border-green-500 p-6 shadow-[8px_8px_0px_#22c55e]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 border-2 border-green-700">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-green-800 uppercase tracking-wide">
                    ✅ Reward Claimed Successfully!
                  </h2>
                  <p className="font-mono text-green-700">
                    Your PYUSD has been transferred to your wallet
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {groupedClaimableExams.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-100 to-yellow-100 border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-500 border-2 border-black">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-wide">
                    🎉 Claimable Rewards Available!
                  </h2>
                  <p className="font-mono text-gray-600">
                    You have {groupedClaimableExams.length} exam{groupedClaimableExams.length !== 1 ? 's' : ''} with claimable rewards
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {groupedClaimableExams.map((examGroup) => (
                  <div key={examGroup.examId} className="bg-white border-2 border-black p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{examGroup.examName}</h3>
                      <p className="text-sm text-gray-600">
                        Class: {examGroup.className} ({examGroup.classCode})
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        {examGroup.stakeCount} stake{examGroup.stakeCount !== 1 ? 's' : ''} | 
                        Total Staked: {examGroup.totalStakeAmount} PYUSD | 
                        Total Reward: {examGroup.totalRewardAmount} PYUSD
                      </p>
                      <div className="mt-2 space-y-1">
                        {examGroup.stakes.map((stake, index) => (
                          <p key={stake._id} className="text-xs text-gray-400 font-mono">
                            #{index + 1}: {stake.predictedMarks}/{examGroup.maxMarks} predicted → {stake.actualMarks}/{examGroup.maxMarks} actual (Staked: {stake.stakeAmount} PYUSD)
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="mb-2">
                        <span className="text-2xl font-black text-green-600">
                          +{examGroup.totalRewardAmount} PYUSD
                        </span>
                      </div>
                      <button
                        onClick={() => handleClaimReward(examGroup.examId)}
                        disabled={claiming === examGroup.examId}
                        className="px-4 py-2 bg-green-500 text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {claiming === examGroup.examId ? "CLAIMING..." : "CLAIM ALL REWARDS"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300">
                <p className="text-xs text-blue-800 font-bold">
                  💡 All your stakes for each exam are claimed together in a single transaction. 
                  Rewards are paid in PYUSD directly to your connected wallet.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 uppercase tracking-wide">
              My Classes
            </h2>
            
            <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-300">
              <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm tracking-wide">
                Join a New Class
              </h3>
              
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joinFormData.studentName}
                  onChange={(e) => handleJoinInputChange("studentName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-mono focus:outline-none focus:bg-gray-50"
                  disabled={joinLoading}
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={joinFormData.classCode}
                    onChange={(e) => handleJoinInputChange("classCode", e.target.value)}
                    placeholder="Enter class code (e.g., MTH101)"
                    className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:bg-gray-50"
                    disabled={joinLoading}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleJoinClass}
                    disabled={joinLoading || !joinFormData.classCode || !joinFormData.studentName}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  >
                    {joinLoading ? "JOINING..." : "JOIN"}
                  </button>
                </div>
              </div>
              
              {joinMessage && (
                <div className={`mt-3 p-2 border-2 border-black text-sm font-bold ${
                  joinMessage.includes("✅") 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {joinMessage}
                </div>
              )}
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-mono mb-2">No classes joined yet</p>
                <p className="text-gray-400 text-sm">
                  Enter your name and class code above to join your first class
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls._id} className="border-2 border-gray-300 p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800">{cls.name}</h3>
                      <span className="bg-black text-white px-2 py-1 text-xs font-bold">
                        {cls.code}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Instructor: {cls.verifier.username}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center bg-gray-50 border border-gray-300 p-2">
                        <div className="font-bold text-gray-800">{cls.upcomingExams || 0}</div>
                        <div className="text-gray-500">Upcoming Exams</div>
                      </div>
                      <div className="text-center bg-gray-50 border border-gray-300 p-2">
                        <div className="font-bold text-gray-800">{cls.classmates || 0}</div>
                        <div className="text-gray-500">Classmates</div>
                      </div>
                      <div className="text-center bg-gray-50 border border-gray-300 p-2">
                        <div className="font-bold text-gray-800">{cls.studentsCount}</div>
                        <div className="text-gray-500">Total Students</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showManualClaim && manualClaimData && (
        <ManualClaim
          contractAddress={manualClaimData.contractAddress}
          examId={manualClaimData.examId}
          onClose={() => {
            setShowManualClaim(false);
            setManualClaimData(null);
            setShowClaimSuccess(true);
            setTimeout(() => setShowClaimSuccess(false), 5000);
            fetchClaimableStakes(); 
          }}
        />
      )}
    </div>
  );
}
