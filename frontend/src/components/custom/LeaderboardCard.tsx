import React, { useState } from 'react';
import { NeoButton } from '@/components/custom/NeoButton';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClassmateAnalyticsDialog from './ClassmateAnalyticsDialog';
import StakeDialogContent from './StakeDialogContent';

interface LeaderboardCardProps {
  rank: number;
  name: string;
  address: string;
  walletAddress: string; 
  avatar: string;
  winRate?: number;
  stakes?: number;
  totalStakes?: number;
  totalStakesWon?: number;
  totalStakesLost?: number;
  analyticsData?: any; 
  isPodium?: boolean;
  trophyImage?: React.ReactNode;
  trophyCircleBgClass?: string;
  onStakeClick?: () => void;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  rank,
  name,
  address,
  walletAddress,
  avatar,
  winRate = 0,
  stakes = 0,
  totalStakesWon = 0,
  totalStakesLost = 0,
  analyticsData,
  isPodium = false,
  trophyImage,
  trophyCircleBgClass,
  onStakeClick,
}) => {
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const bgColors: Record<number, string> = {
    1: 'bg-yellow-100',
    2: 'bg-gray-200',
    3: 'bg-orange-100',
  };
  const borderColors: Record<number, string> = {
    1: 'border-yellow-400',
    2: 'border-gray-400',
    3: 'border-orange-400',
  };
  const bgColor = bgColors[rank] || 'bg-card';
  const borderColor = borderColors[rank] || 'border-border';

  const getWinRateColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const viewButtonWithModal = (
    <NeoButton 
      className="bg-blue-400 text-white px-4 py-1 text-sm"
      onClick={() => setShowAnalyticsDialog(true)}
    >
      VIEW
    </NeoButton>
  );

  const stakeButtonWithModal = onStakeClick ? (
    <NeoButton 
      className="bg-red-500 text-white px-4 py-1 text-sm"
      onClick={onStakeClick}
    >
      STAKE
    </NeoButton>
  ) : (
    <Dialog>
      <DialogTrigger asChild>
        <NeoButton className="bg-red-500 text-white px-4 py-1 text-sm">STAKE</NeoButton>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_#000000] rounded-none p-6">
        <StakeDialogContent stakeTargetName={name} />
      </DialogContent>
    </Dialog>
  );

  if (isPodium) {
    return (
      <>
        <div className={`${bgColor} p-4 border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000] relative flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_#000] max-w-xs mx-auto`}>
          {trophyImage && <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 ${trophyCircleBgClass || 'bg-card'} border-4 border-black rounded-full p-2 flex items-center justify-center`}>{trophyImage}</div>}
          <div className="mt-4 flex flex-col items-center">
            <div className={`w-20 h-20 mx-auto mb-3 border-4 ${borderColor} rounded-full overflow-hidden shadow-[4px_4px_0px_#000]`}><img src={avatar} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Error'; }} /></div>
            <div className="bg-card border-4 border-black rounded-xl px-3 py-1 mb-2 shadow-[2px_2px_0px_#000]"><span className="text-3xl font-black"># {rank}</span></div>
            <h2 className="text-xl font-black mb-1">{name}</h2>
            <p className="text-xs font-mono font-bold mb-3 bg-card/50 px-2 py-1 rounded-lg border-2 border-black break-all">{address}</p>
            
            <div className="space-y-2 mb-4">
              <div className="bg-purple-200 border-4 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000]">
                <p className="text-xs font-bold text-gray-700 uppercase">Win Rate</p>
                <p className={`text-lg font-black ${getWinRateColor(winRate)}`}>{winRate}%</p>
              </div>
              <div className="bg-blue-200 border-4 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000]">
                <p className="text-xs font-bold text-gray-700 uppercase">Total Staked</p>
                <p className="text-lg font-black text-gray-800">{stakes.toFixed(2)} PYUSD</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">{viewButtonWithModal}{stakeButtonWithModal}</div>
          </div>
        </div>
        
        <ClassmateAnalyticsDialog
          isOpen={showAnalyticsDialog}
          onClose={() => setShowAnalyticsDialog(false)}
          studentName={name}
          walletAddress={walletAddress}
          analyticsData={analyticsData}
        />
      </>
    );
  }

  return (
    <>
      <div className="bg-card p-4 border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-center sm:justify-between gap-4 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-black text-white font-black text-xl border-4 border-black rounded-lg">{rank}</div>
          <div className="w-14 h-14 border-4 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_#000]"><img src={avatar} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x80?text=Error'; }} /></div>
          <div className="flex-1">
            <h3 className="font-black text-lg">{name}</h3>
            <div className="flex items-center gap-2 text-sm font-mono font-bold mb-2">
              <span className="text-gray-600">{address}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-bold">Win Rate:</span>
                <span className={`font-black ${getWinRateColor(winRate)}`}>{winRate}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-bold">Total Stakes:</span>
                <span className="font-black text-gray-800">{totalStakesWon + totalStakesLost}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-bold">Stakes Won:</span>
                <span className="font-black text-green-600">{totalStakesWon}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-bold">Stakes Lost:</span>
                <span className="font-black text-red-600">{totalStakesLost}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">{viewButtonWithModal}{stakeButtonWithModal}</div>
      </div>
      
      <ClassmateAnalyticsDialog
        isOpen={showAnalyticsDialog}
        onClose={() => setShowAnalyticsDialog(false)}
        studentName={name}
        walletAddress={walletAddress}
        analyticsData={analyticsData}
      />
    </>
  );
};

export default LeaderboardCard;