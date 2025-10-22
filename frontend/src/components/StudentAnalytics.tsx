import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";
import { Button } from "./ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "../hooks/useAnalytics";
import { Wallet, Award, BookOpen, TrendingUp } from "lucide-react";

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
  const { metrics, isLoading, error } = useAnalytics(
    userAddress,
    chainId,
    refreshTrigger
  );
  const { openPopup } = useTransactionPopup();
  const { openTxToast } = useNotification();

  if (error) {
    return (
      <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-500 font-medium">
          Error loading analytics: {error}
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <MetricCard key={i} {...stat} loading={isLoading} />
        ))}
      </div>

      
    </div>
  );
}

export default StudentAnalytics;
