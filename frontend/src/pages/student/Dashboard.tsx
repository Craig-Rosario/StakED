import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Sep", performance: 89 },
  { month: "Oct", performance: 78 },
  { month: "Nov", performance: 85 },
  { month: "Dec", performance: 82 },
  { month: "Jan", performance: 91 },
  { month: "Feb", performance: 94 },
];

const stats = [
    { label: "AVG CONFIDENCE INDEX", value: "87.2", trend: "up", bgColor: "bg-[#FFE66D30]" },
    { label: "TOTAL STAKE WON", value: "10", trend: "up", bgColor: "bg-[#00FF9920]" },
    { label: "TOTAL STAKE LOST", value: "3", trend: "up", bgColor: "bg-[#FF4C4C20]" },
    { label: "WIN RATE", value: "78%", trend: "down", bgColor: "bg-[#FFE66D30]" },
];

export default function PerformanceDashboard() {
  return (
    <div className="p-4 sm:p-8 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">My Performance Analytics</h1>
      <p className="font-mono text-gray-600 mt-1 mb-6">Real-time confidence tracking</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`border-[5px] border-black p-4 ${stat.bgColor} shadow-[6px_6px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-transform`}
          >
            <p className="text-xs font-semibold text-gray-700">{stat.label}</p>
            <p className="text-2xl font-extrabold flex items-center gap-1 text-gray-900">
              {stat.value}
              {stat.trend === "up" ? (
                <span className="text-green-500 inline-block rotate-45 font-bold">
                  ↑
                </span>
              ) : (
                <span className="text-red-500 inline-block -rotate-45 font-bold">
                  ↓
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="border-4 border-black p-4 shadow-brutal bg-white">
        <p className="text-sm font-bold mb-2 text-gray-800">Performance Over Time</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis domain={[70, 100]} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #000",
                borderRadius: "4px",
              }}
              labelStyle={{ fontWeight: "bold", color: "#333" }}
              itemStyle={{ color: "#39e75f" }}
            />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#39e75f"
              strokeWidth={3}
              dot={{ stroke: '#39e75f', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#39e75f', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
