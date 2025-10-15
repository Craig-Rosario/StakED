import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const data = [
  { month: "Sep", performance: 89 },
  { month: "Oct", performance: 78 },
  { month: "Nov", performance: 85 },
  { month: "Dec", performance: 82 },
  { month: "Jan", performance: 91 },
  { month: "Feb", performance: 94 },
];

const stats = [
    { label: "AVG CONFIDENCE", value: "87.2", trend: "up", bgColor: "bg-yellow-100" },
    { label: "TOTAL STAKE WON", value: "10", trend: "up", bgColor: "bg-green-100" },
    { label: "TOTAL STAKE LOST", value: "3", trend: "up", bgColor: "bg-red-100" },
    { label: "WIN RATE", value: "78%", trend: "down", bgColor: "bg-yellow-100" },
];

export default function PerformanceDashboard() {
  return (
    <div className="p-1 sm:p-2">
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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis domain={[70, 100]} tickLine={false} axisLine={false} />
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
      </div>
    </div>
  );
}