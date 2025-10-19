import React, { useState } from 'react';
import { Button } from '../ui/button';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface StakeDialogContentProps {
  stakeTargetName: string;
  isSelfStake?: boolean;
  onClose?: () => void;
  examId?: string;
  candidateAddress?: string;
  onStakeSuccess?: () => void;
}

const StakeDialogContent: React.FC<StakeDialogContentProps> = ({ 
  stakeTargetName, 
  isSelfStake = false, 
  onClose,
  examId,
  candidateAddress,
  onStakeSuccess
}) => {
  const [confidence, setConfidence] = useState(50);
  const [stakeAmount, setStakeAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleStakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Call backend API to record the stake
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/stakes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examId,
          candidateAddress,
          stakeAmount,
          confidence,
          isSelfStake
        })
      });

      if (response.ok) {
        alert(`Successfully staked ${stakeAmount} PYUSD on ${stakeTargetName}!`);
        onStakeSuccess?.();
        onClose?.();
      } else {
        const error = await response.json();
        alert(`Failed to place stake: ${error.message}`);
      }
    } catch (err) {
      console.error('Stake submission failed:', err);
      alert('Failed to place stake. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const scoreLabel = isSelfStake
    ? "How much do you think you will score?"
    : "How much do you think they'll score (%)?";

  return (
    <div className="relative">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-2 border-black bg-white flex items-center justify-center font-bold hover:bg-black hover:text-white transition-colors flex-shrink-0 text-sm sm:text-base cursor-pointer"
        >
          X
        </button>
      )}
      
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Stake Your Confidence</h2>
      <p className="text-gray-600 mb-6">Place your stake for {stakeTargetName}</p>
      
      <form onSubmit={handleStakeSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {scoreLabel} 
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
            Amount to Stake (PYUSD)
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
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 text-xl bg-red-500 text-white cursor-pointer disabled:bg-gray-400"
        >
          {isLoading ? 'PLACING STAKE...' : 'CONFIRM STAKE'}
        </Button>
      </form>
    </div>
  );
};

export default StakeDialogContent;