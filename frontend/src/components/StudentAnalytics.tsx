import { useNotification, useTransactionPopup } from "@blockscout/app-sdk";
import { Button } from "./ui/button";
import { useAnalytics } from '../hooks/useAnalytics';
import { Wallet, Award, BookOpen, TrendingUp } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

interface StudentAnalyticsProps {
  userAddress: string;
  chainId?: string;
}

const MetricCard = ({ label, value, icon, color, description }: MetricCardProps) => (
  <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-${color}-100 border-2 border-black`}>
        {icon}
      </div>
      <span className="text-2xl font-extrabold text-gray-800">
        {value}
      </span>
    </div>
    <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wide">
      {label}
    </h3>
    {description && (
      <p className="font-mono text-gray-500 text-xs mt-1">
        {description}
      </p>
    )}
  </div>
);

export function StudentAnalytics({ userAddress, chainId = "11155111" }: StudentAnalyticsProps) {
  const { metrics, isLoading, error } = useAnalytics(userAddress);
  const { openPopup } = useTransactionPopup();
  const { openTxToast } = useNotification();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="text-red-500 font-medium">Error loading analytics: {error}</div>
      </div>
    );
  }

  // Handle no data state
  if (!metrics) {
    return (
      <div className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="text-gray-500 font-medium">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          label="Total Staked" 
          value={metrics.totalStaked}
          icon={<Wallet className="w-6 h-6 text-green-600" />}
          color="green"
          description="Across all exams"
        />
        <MetricCard 
          label="Stakes Won" 
          value={metrics.totalStakesWon.toString()}
          icon={<Award className="w-6 h-6 text-blue-600" />}
          color="blue"
          description="Successful predictions"
        />
        <MetricCard 
          label="Stakes Lost" 
          value={metrics.totalStakesLost.toString()}
          icon={<TrendingUp className="w-6 h-6 text-red-600" />}
          color="red"
          description="Incorrect predictions"
        />
        <MetricCard 
          label="Win Rate" 
          value={`${metrics.winRate}%`}
          icon={<Award className="w-6 h-6 text-purple-600" />}
          color="purple"
          description="Prediction accuracy"
        />
        <MetricCard 
          label="Total Earnings" 
          value={metrics.totalEarnings}
          icon={<Wallet className="w-6 h-6 text-yellow-600" />}
          color="yellow"
          description="Net profit/loss"
        />
        <MetricCard 
          label="Classes Joined" 
          value={metrics.classesJoined.toString()}
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          color="indigo"
          description="Active enrollments"
        />
      </div>

      {/* Blockscout Transaction Button */}
      <div className="flex justify-end">
        <Button
          variant="neutral"
          onClick={() => {
            if (chainId && userAddress) {
              openPopup?.({ chainId, address: userAddress });
              openTxToast?.(
                'View Transactions', 
                'Opening transaction history...'
              );
            }
          }}
        >
          View Transactions
        </Button>
      </div>
    </div>
  );
}

export default StudentAnalytics;