import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Award, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useClassmateAnalytics } from "../../hooks/useClassmateAnalytics";
import WinRateChart from "./WinRateChart";

interface ClassmateAnalyticsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  walletAddress: string;
  analyticsData?: any; 
}

const MetricCard = ({ 
  label, 
  value, 
  icon, 
  bgColor, 
  loading 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  bgColor: string; 
  loading?: boolean; 
}) => (
  <div className={`border-4 border-black p-4 ${bgColor} shadow-[6px_6px_0px_#000]`}>
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white border-2 border-black">
        {icon}
      </div>
      {loading ? (
        <div className="animate-pulse bg-gray-300 h-6 w-16 rounded"></div>
      ) : (
        <span className="text-xl font-extrabold text-gray-800">
          {value}
        </span>
      )}
    </div>
    <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wide">
      {label}
    </h3>
  </div>
);

export default function ClassmateAnalyticsDialog({
  isOpen,
  onClose,
  studentName,
  walletAddress,
  analyticsData
}: ClassmateAnalyticsDialogProps) {
  const shouldFetch = !analyticsData;
  const memoizedAddresses = useMemo(() => shouldFetch ? [walletAddress] : [], [walletAddress, shouldFetch]);
  const { analytics, isLoading, error } = useClassmateAnalytics(memoizedAddresses);
  
  const studentAnalytics = analyticsData || analytics[walletAddress];

  if (!isOpen) return null;

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 80) return "text-green-600";
    if (winRate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black mb-2">
            {studentName}'s Performance Analytics
          </DialogTitle>
          <p className="font-mono text-sm text-gray-600 break-all">
            Wallet: {formatWalletAddress(walletAddress)}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-lg font-bold">Loading analytics...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 font-bold text-lg mb-2">Error Loading Analytics</div>
            <div className="text-gray-600">{error}</div>
          </div>
        ) : !studentAnalytics ? (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg">No analytics data available for this student</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              <MetricCard
                label="Total Staked"
                value={studentAnalytics.totalStaked}
                icon={<Wallet className="w-5 h-5 text-blue-600" />}
                bgColor="bg-blue-100"
              />
              
              <MetricCard
                label="Win Rate"
                value={`${studentAnalytics.winRate}%`}
                icon={<Award className={`w-5 h-5 ${getWinRateColor(studentAnalytics.winRate)}`} />}
                bgColor="bg-purple-100"
              />
              
              <MetricCard
                label="Stakes Won"
                value={studentAnalytics.totalStakesWon}
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                bgColor="bg-green-100"
              />
              
              <MetricCard
                label="Stakes Lost"
                value={studentAnalytics.totalStakesLost}
                icon={<TrendingDown className="w-5 h-5 text-red-600" />}
                bgColor="bg-red-100"
              />
            </div>


            {/* Win Rate Chart */}
            {studentAnalytics.winRateHistory && studentAnalytics.winRateHistory.length > 0 && (
              <WinRateChart data={studentAnalytics.winRateHistory} className="w-full" />
            )}

            <div className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_#000]">
              <div className="text-center">
                <h4 className="font-bold text-gray-700 mb-2">Performance Rating</h4>
                <div className="flex items-center justify-center gap-2">
                  {studentAnalytics.winRate >= 80 && (
                    <>
                      <span className="text-2xl">🏆</span>
                      <span className="font-bold text-green-600">Excellent Performer</span>
                    </>
                  )}
                  {studentAnalytics.winRate >= 60 && studentAnalytics.winRate < 80 && (
                    <>
                      <span className="text-2xl">⭐</span>
                      <span className="font-bold text-yellow-600">Good Performer</span>
                    </>
                  )}
                  {studentAnalytics.winRate >= 40 && studentAnalytics.winRate < 60 && (
                    <>
                      <span className="text-2xl">📊</span>
                      <span className="font-bold text-blue-600">Average Performer</span>
                    </>
                  )}
                  {studentAnalytics.winRate < 40 && (
                    <>
                      <span className="text-2xl">📈</span>
                      <span className="font-bold text-red-600">Needs Improvement</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white font-bold py-2 px-6 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            CLOSE
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}