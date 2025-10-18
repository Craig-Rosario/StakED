import { useState, useEffect } from "react";
import { Wallet, Award, BookOpen, Clock, TrendingUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface UserStats {
  totalStaked: number;
  activeStakes: number;
  winRate: number;
  totalEarnings: number;
  classesJoined: number;
  upcomingExams: number;
}

interface RecentActivity {
  _id: string;
  type: string;
  description: string;
  amount?: number;
  date: string;
  status: string;
}

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

export default function StudentDashboard() {
  const [stats, setStats] = useState<UserStats>({
    totalStaked: 0,
    activeStakes: 0,
    winRate: 0,
    totalEarnings: 0,
    classesJoined: 0,
    upcomingExams: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Student");
  
  // Join Class States
  const [joinFormData, setJoinFormData] = useState({
    classCode: "",
    studentName: "",
  });
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      // Fetch user profile
      try {
        const userResponse = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const currentUserName = userData.user?.username || "Student";
          setUserName(currentUserName);
          setJoinFormData(prev => ({ ...prev, studentName: currentUserName }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }

      // Fetch student classes
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
          
          // Update stats with class count
          setStats(prev => ({
            ...prev,
            classesJoined: classesWithDetails.length,
          }));
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }

      // Fetch upcoming exams count
      try {
        const examsResponse = await fetch(`${API_BASE}/classes/student/exams`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (examsResponse.ok) {
          const examsData = await examsResponse.json();
          const upcomingExamsCount = (examsData.exams || []).length;
          setStats(prev => ({
            ...prev,
            upcomingExams: upcomingExamsCount,
          }));
        }
      } catch (error) {
        console.error("Error fetching upcoming exams:", error);
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-2">
            Welcome back, <span className="text-green-500">{userName}</span>
          </h1>
          <p className="font-mono text-gray-600 text-lg">
            Your StakED performance at a glance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Staked */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 border-2 border-black">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.totalStaked.toFixed(3)} ETH
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Total Staked
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              Across all exams
            </p>
          </div>

          {/* Classes Joined */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 border-2 border-black">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.classesJoined}
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Classes Joined
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              Active enrollments
            </p>
          </div>

          {/* Upcoming Exams */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 border-2 border-black">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.upcomingExams}
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Upcoming Exams
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              Ready to stake
            </p>
          </div>

          {/* Active Stakes */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 border-2 border-black">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.activeStakes}
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Active Stakes
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              Awaiting results
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 border-2 border-black">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.winRate}%
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Win Rate
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              Prediction accuracy
            </p>
          </div>

          {/* Total Earnings */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 border-2 border-black">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-extrabold text-gray-800">
                {stats.totalEarnings.toFixed(3)} ETH
              </span>
            </div>
            <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
              Total Earnings
            </h3>
            <p className="font-mono text-gray-500 text-xs mt-1">
              All-time profits
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Classes */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 uppercase tracking-wide">
              My Classes
            </h2>
            
            {/* Join Class Section */}
            <div className="mb-6 p-4 bg-gray-50 border-2 border-gray-300">
              <h3 className="font-bold text-gray-700 mb-3 uppercase text-sm tracking-wide">
                Join a New Class
              </h3>
              
              {/* Student Name Input */}
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

              {/* Class Code Input and Join Button */}
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

            {/* Classes List */}
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
                    
                    {/* Class Stats */}
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

          {/* Recent Activity */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-6 uppercase tracking-wide">
              Recent Activity
            </h2>
            
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-mono mb-2">No recent activity</p>
                <p className="text-gray-400 text-sm">
                  Start staking on exams to see your activity here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity._id} className="border-2 border-gray-300 p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">
                          {activity.description}
                        </p>
                        <p className="text-xs font-mono text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      {activity.amount && (
                        <span className="text-sm font-bold text-green-600">
                          +{activity.amount} ETH
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
