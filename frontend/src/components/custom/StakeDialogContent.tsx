import React, { useState } from 'react';
import { NeoButton } from '@/components/custom/NeoButton';

interface StakeDialogContentProps {
  studentName: string;
}

const StakeDialogContent: React.FC<StakeDialogContentProps> = ({ studentName }) => {
  const [confidence, setConfidence] = useState(50);
  const [stakeAmount, setStakeAmount] = useState(1);

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Staking ${stakeAmount} ETH on ${studentName} with predicted score of ${confidence}%.`);
  };

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Stake Your Confidence</h2>
      <p className="text-gray-600 mb-6">Place your stake for {studentName}</p>
      
      <form onSubmit={handleStakeSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            How much do you think they'll score (%)? 
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full border-4 border-black p-3 text-lg font-bold text-center bg-white focus:outline-none focus:border-gray-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Amount to Stake (ETH)
          </label>
          <input
            type="number"
            min="1"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            className="w-full border-4 border-black p-3 text-lg font-bold text-center bg-white focus:outline-none focus:border-gray-500"
            required
          />
        </div>
        
        <NeoButton
          type="submit"
          className="w-full py-4 text-xl bg-red-500 text-white"
        >
          CONFIRM STAKE
        </NeoButton>
      </form>
    </div>
  );
};

export default StakeDialogContent;