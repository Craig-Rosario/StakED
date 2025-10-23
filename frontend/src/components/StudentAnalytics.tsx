import { useTransactionPopup } from "@blockscout/app-sdk";
import { Button } from "./ui/button";
import { CircleLoader } from "./ui/circle-loader";
import { useAnalytics } from "../hooks/useAnalytics";
import { Wallet, Award, BookOpen, TrendingUp, History } from "lucide-react";
import WinRateChart from "./custom/WinRateChart";
import BlockscoutLogo from "/images/BlockScoutLogo.png";

interface MetricCardProps {
  label: string;
  value?: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  loading?: boolean;
}

interface StudentAnalyticsProps {
  userAddress: string;
  chainId?: string;
  refreshTrigger?: number;
}

const MetricCard = ({
  label,
  value,
  icon,
  color,
  description,
  loading,
}: MetricCardProps) => (
  <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-${color}-100 border-2 border-black`}>{icon}</div>
      {loading ? (
        <div className="flex items-center justify-center">
          <CircleLoader 
            size="md" 
            variant={color === "green" ? "success" : color === "blue" ? "primary" : "secondary"} 
          />
        </div>
      ) : (
        <span className="text-2xl font-extrabold text-gray-800">
          {value ?? "--"}
        </span>
      )}
    </div>
    <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
      {label}
    </h3>
    {description && (
      <p className="font-mono text-gray-500 text-xs mt-1">{description}</p>
    )}
  </div>
);

export function StudentAnalytics({
  userAddress,
  chainId = "11155111",
  refreshTrigger,
}: StudentAnalyticsProps) {
  const { metrics, isLoading } = useAnalytics(
    userAddress,
    chainId,
    refreshTrigger
  );
  const { openPopup } = useTransactionPopup();

  const totalEarningsValue = metrics?.totalEarningsValue ?? 0;

  const stats = [
    {
      label: "Total Staked",
      value: metrics?.totalStaked ?? "--",
      icon: <img src="/images/pyusd.png" alt="PYUSD" className="w-8 h-8" />,
      color: "gray",
      description: "Across all exams",
    },
    {
      label: "Stakes Won",
      value: metrics?.totalStakesWon?.toString() ?? "--",
      icon: <Award className="w-6 h-6 text-blue-600" />,
      color: "blue",
      description: "Successful predictions",
    },
    {
      label: "Stakes Lost",
      value: metrics?.totalStakesLost?.toString() ?? "--",
      icon: <TrendingUp className="w-6 h-6 text-red-600" />,
      color: "red",
      description: "Incorrect predictions",
    },
    {
      label: "Win Rate",
      value: metrics ? `${metrics.winRate}%` : "--",
      icon: <Award className="w-6 h-6 text-purple-600" />,
      color: "purple",
      description: "Prediction accuracy",
    },
    {
      label: "Total Earnings",
      value: metrics?.totalEarnings ?? "--",
      icon: (
        <Wallet
          className={`w-6 h-6 ${
            totalEarningsValue >= 0 ? "text-green-600" : "text-red-600"
          }`}
        />
      ),
      color: totalEarningsValue >= 0 ? "green" : "red",
      description: "Net profit/loss",
    },
    {
      label: "Classes Joined",
      value: metrics?.classesJoined?.toString() ?? "--",
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      color: "indigo",
      description: "Active enrollments",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-transparent rounded-md border border-transparent">
        <img
          src={BlockscoutLogo}
          alt="Blockscout Logo"
          className="w-8 h-8 object-contain"
        />
        <p className="text-lg text-gray-600 font-mono">
          Analytics Powered by <span className="font-semibold">Blockscout</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <MetricCard key={i} {...stat} loading={isLoading} />
        ))}
      </div>

      <div className="flex mt-8">
        <Button
          className="border-2 border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 bg-purple-500 hover:bg-purple-600 cursor-pointer text-white"
          onClick={() => openPopup({ chainId, address: userAddress })}
        >
          <History className="w-4 h-4" />
          View Transaction History
        </Button>
      </div>

      {/* Win Rate Chart Section with Loader */}
      {isLoading ? (
        <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_#000]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Exam Results Timeline</h3>
              <p className="text-gray-600 text-sm">Each point = one exam • Line shows running win rate</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-end">
                <CircleLoader size="sm" />
              </div>
            </div>
          </div>

          {/* Chart Area Loader */}
          <div className="h-80 mb-4">
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <CircleLoader size="xl" className="mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Loading analytics data...</p>
                <p className="text-gray-400 text-sm">Fetching blockchain data from Blockscout</p>
              </div>
            </div>
          </div>

          {/* Chart Statistics at Bottom */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center border-2 border-gray-200 p-3 bg-blue-50">
              <div className="flex justify-center mb-2">
                <CircleLoader size="sm" variant="primary" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Current Win Rate</p>
            </div>
            <div className="text-center border-2 border-gray-200 p-3 bg-green-50">
              <div className="flex justify-center mb-2">
                <CircleLoader size="sm" variant="success" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Best Performance</p>
            </div>
            <div className="text-center border-2 border-gray-200 p-3 bg-purple-50">
              <div className="flex justify-center mb-2">
                <CircleLoader size="sm" variant="secondary" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Total Stakes</p>
            </div>
          </div>
        </div>
      ) : (
        metrics?.winRateHistory && (
          <WinRateChart data={metrics.winRateHistory} className="col-span-full" />
        )
      )}
    </div>
  );
}

export default StudentAnalytics;
