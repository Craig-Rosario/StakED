import { useEffect, useState } from "react";
import { User, Wallet, Award } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const VerifierDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalExams: 0,
  });
  const [user, setUser] = useState({
    username: "Loading...",
    walletAddress: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("User API error:", text);
          throw new Error(`Status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setUser({
            username: data.user.username || "Unknown Verifier",
            walletAddress: data.user.walletAddress || "",
          });
        } else {
          throw new Error("Invalid user response");
        }
      } catch (err: any) {
        console.error("Failed to fetch user info:", err);
        setError("Failed to load user info");
      }
    };

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch(`${API_BASE}/verifier/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Stats API error:", text);
          throw new Error(`Status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setStats({
            totalClasses: data.totalClasses || 0,
            totalExams: data.totalExams || 0,
          });
        } else {
          throw new Error("Invalid stats response");
        }
      } catch (err: any) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUser(), fetchStats()]).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Classes", value: stats.totalClasses, color: "#00A2FF" },
    { label: "Total Exams", value: stats.totalExams, color: "#00FF99" },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-bold text-gray-700">
        Loading verifier dashboard...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 text-lg font-semibold">
        {error}
      </div>
    );

  return (
    <div className="p-6 sm:p-10 min-h-screen bg-[#F9F9F9]">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
          Verifier Dashboard
        </h1>
        <p className="font-mono text-gray-600 mt-1 mb-6">
          Manage your classes, exams, and student performance verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white border-4 border-black shadow-[6px_6px_0px_#000] p-8 flex flex-col justify-between">
          <h2 className="uppercase font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#00A2FF]" /> Verifier Profile
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-gray-600 font-bold">Name</p>
              <p className="text-lg font-extrabold text-gray-900">{user.username}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-600 font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00A2FF]" /> Connected Wallet
              </p>
              <div className="flex items-center gap-3 mt-1">
                <input
                  value={
                    user.walletAddress
                      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                      : "Not Connected"
                  }
                  readOnly
                  className="w-full px-3 py-2 border-2 border-[#00A2FF] bg-white text-[#00A2FF] font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border-4 border-black shadow-[6px_6px_0px_#000] p-8">
          <h2 className="uppercase font-extrabold tracking-tight mb-6 text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#00A2FF]" /> Performance Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="border-[4px] border-black p-4 shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 transition-transform"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <p className="text-sm font-bold text-gray-700 uppercase mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-extrabold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 bg-[#00FF99] border-4 border-black shadow-[6px_6px_0px_#000] p-6 text-black">
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-6 h-6 text-black" />
          <h3 className="uppercase font-extrabold tracking-tight text-black">
            Verified Verifier
          </h3>
        </div>
        <p className="text-sm font-medium text-gray-900">
          You are a verified educator on the StakED platform. You can create exams, manage student batches,
          and validate results.
        </p>
      </div>
    </div>
  );
};

export default VerifierDashboard;
