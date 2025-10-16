import React from 'react';
import { NeoButton } from '@/components/custom/NeoButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PerformanceDashboard from '@/components/custom/PerformanceDialog';
import StakeDialogContent from './StakeDialogContent';

interface LeaderboardCardProps {
  rank: number;
  name: string;
  address: string;
  change: number;
  avatar: string;
  isPodium?: boolean;
  trophyImage?: React.ReactNode;
  trophyCircleBgClass?: string;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  rank,
  name,
  address,
  change,
  avatar,
  isPodium = false,
  trophyImage,
  trophyCircleBgClass,
}) => {
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

  const viewButtonWithModal = (
    <Dialog>
      <DialogTrigger asChild>
        <NeoButton className="bg-blue-400 text-white px-4 py-1 text-sm">VIEW</NeoButton>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl bg-gray-50 border-4 border-black shadow-[8px_8px_0px_#000] rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
            <img src={avatar} alt={name} className="w-14 h-14 rounded-full border-4 border-black" />
            <div>
              <span className="text-2xl font-black block">{name}'s Performance</span>
              <p className="font-mono text-sm text-gray-600 break-all">{address}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <PerformanceDashboard />
      </DialogContent>
    </Dialog>
  );

  const stakeButtonWithModal = (
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
      <div className={`${bgColor} p-4 border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000] relative flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[12px_12px_0px_#000] max-w-xs mx-auto`}>
        {trophyImage && <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 ${trophyCircleBgClass || 'bg-card'} border-4 border-black rounded-full p-2 flex items-center justify-center`}>{trophyImage}</div>}
        <div className="mt-4 flex flex-col items-center">
          <div className={`w-20 h-20 mx-auto mb-3 border-4 ${borderColor} rounded-full overflow-hidden shadow-[4px_4px_0px_#000]`}><img src={avatar} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=Error'; }} /></div>
          <div className="bg-card border-4 border-black rounded-xl px-3 py-1 mb-2 shadow-[2px_2px_0px_#000]"><span className="text-3xl font-black"># {rank}</span></div>
          <h2 className="text-xl font-black mb-1">{name}</h2>
          <p className="text-xs font-mono font-bold mb-3 bg-card/50 px-2 py-1 rounded-lg border-2 border-black break-all">{address}</p>
          <div className="bg-green-300 border-4 border-black rounded-xl px-3 py-1 shadow-[2px_2px_0px_#000] mb-4"><p className="text-2xl font-black">+{change.toFixed(1)}%</p></div>
          <div className="flex items-center gap-3">{viewButtonWithModal}{stakeButtonWithModal}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 border-4 border-black rounded-xl shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-center sm:justify-between gap-4 transition-all duration-200">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center bg-black text-white font-black text-xl border-4 border-black rounded-lg">{rank}</div>
        <div className="w-14 h-14 border-4 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_#000]"><img src={avatar} alt={name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x80?text=Error'; }} /></div>
        <div>
          <h3 className="font-black text-lg">{name}</h3>
          <div className="flex items-center gap-2 text-sm font-mono font-bold"><span className="text-gray-600">{address}</span><span className={`px-2 py-0.5 rounded-md border-2 border-black ${change > 0 ? 'bg-green-300' : 'bg-red-300'}`}>{change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%</span></div>
        </div>
      </div>
      <div className="flex items-center gap-3">{viewButtonWithModal}{stakeButtonWithModal}</div>
    </div>
  );
};

export default LeaderboardCard;