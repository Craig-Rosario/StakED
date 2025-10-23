import { useEffect, useState } from "react";
import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";
import { Button } from "./ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "../hooks/useAnalytics";
import {
  Wallet,
  Award,
  BookOpen,
  TrendingUp,
  History,
} from "lucide-react";
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

interface RecentTx {
  hash: string;
}

const BLOCKSCOUT_BASE =
  import.meta.env.VITE_BLOCKSCOUT_BASE_URL ||
  "https://eth-sepolia.blockscout.com/api/v2";

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
        <Skeleton className="h-6 w-16 rounded-md" />
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
  const { openTxToast } = useNotification();
  const [latestTx, setLatestTx] = useState<RecentTx | null>(null);
  const [fetchingTx, setFetchingTx] = useState(false);

  const fetchLatestTransaction = async () => {
    if (!userAddress) return;
    try {
      setFetchingTx(true);
      const response = await fetch(
        `${BLOCKSCOUT_BASE}/addresses/${userAddress}/transactions?limit=1`
      );
      if (!response.ok) throw new Error("Failed to fetch transaction data");
      const data = await response.json();
      const hash = data?.items?.[0]?.hash;
      if (hash) setLatestTx({ hash });
    } catch (err) {
      console.error("Error fetching latest transaction:", err);
    } finally {
      setFetchingTx(false);
    }
  };

  useEffect(() => {
    if (userAddress) fetchLatestTransaction();
  }, [userAddress]);

  const totalEarningsValue = metrics?.totalEarningsValue ?? 0;

  const stats = [
    {
      label: "Total Staked",
      value: metrics?.totalStaked ?? "--",
      icon: <Wallet className="w-6 h-6 text-green-600" />,
      color: "green",
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
      <div className="flex items-center gap-2">
        <img
          src={BlockscoutLogo}
          alt="Blockscout Logo"
          className="w-8 h-8 object-contain"
        />
        <p className="text-md text-gray-600 font-mono">
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

      {!isLoading && metrics?.winRateHistory && (
        <WinRateChart data={metrics.winRateHistory} className="col-span-full" />
      )}
    </div>
  );
}

export default StudentAnalytics;
