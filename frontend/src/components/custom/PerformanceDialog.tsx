import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface PerformanceData {
  avgConfidence: string;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  chartData: Array<{ month: string; performance: number }>;
  trends: {
    confidence: string;
    wins: string;
    losses: string;
    winRate: string;
  };
}

interface PerformanceDashboardProps {
  studentId?: string;
  studentName?: string;
}

export default function PerformanceDashboard({ studentId, studentName }: PerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/classes/student/${studentId}/performance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPerformanceData(data.performance);
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch performance data");
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
        setError("Error loading performance data");
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchPerformanceData();
    } else {
      // Fallback to static data if no studentId provided
      setPerformanceData({
        avgConfidence: "0",
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        chartData: [{ month: "No Data", performance: 0 }],
        trends: {
          confidence: "up",
          wins: "up",
          losses: "up",
          winRate: "up"
        }
      });
      setLoading(false);
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 font-bold mb-2">Error loading data</div>
        <div className="text-gray-600">{error}</div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">No performance data available</div>
      </div>
    );
  }

  const stats = [
    { 
      label: "AVG CONFIDENCE", 
      value: `${performanceData.avgConfidence}%`, 
      trend: performanceData.trends.confidence, 
      bgColor: "bg-yellow-100" 
    },
    { 
      label: "TOTAL STAKES WON", 
      value: performanceData.totalWins.toString(), 
      trend: performanceData.trends.wins, 
      bgColor: "bg-green-100" 
    },
    { 
      label: "TOTAL STAKES LOST", 
      value: performanceData.totalLosses.toString(), 
      trend: performanceData.trends.losses, 
      bgColor: "bg-red-100" 
    },
    { 
      label: "WIN RATE", 
      value: `${performanceData.winRate}%`, 
      trend: performanceData.trends.winRate, 
      bgColor: "bg-yellow-100" 
    },
  ];

  return (
    <div className="p-1 sm:p-2">
      {/* Student Name Header */}
      {studentName && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {studentName}'s Performance Analytics
          </h3>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`border-4 border-black p-4 ${stat.bgColor} shadow-[8px_8px_0px_#000]`}
          >
            <p className="text-xs font-bold text-gray-600 mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-gray-900">
                {stat.value}
              </p>
              {stat.trend === "up" ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="border-4 border-black p-4 shadow-[8px_8px_0px_#000] bg-white">
        <p className="text-sm font-bold mb-2 text-gray-800">Performance Over Time</p>
        {performanceData.chartData.length > 0 && performanceData.chartData[0].month !== "No Data" ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "2px solid #000",
                }}
              />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="#39e75f"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg font-bold mb-2">No Performance History</div>
              <div className="text-sm">This student hasn't completed any graded exams yet.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}