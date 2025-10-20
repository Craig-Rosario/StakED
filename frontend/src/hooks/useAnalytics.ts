import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../lib/web3Utils';

// Minimal ABI for the functions we need
const EXAM_STAKING_ABI = [
  "function stake(bytes32 examId, address candidate, uint256 amount, uint256 predictedScore) external",
  "function claim(bytes32 examId) external",
  "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
  "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
  "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
  "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
  "event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount, uint256 predictedScore)",
  "event Claimed(bytes32 indexed examId, address indexed staker, uint256 payout)"
];

interface ExamResult {
  exam: string;
  netReward: number;
}

interface AnalyticsMetrics {
  totalStaked: string;
  totalStakesWon: number;
  totalStakesLost: number;
  winRate: number;
  totalEarnings: string;
  classesJoined: number;
  examResults: ExamResult[];
}

export function useAnalytics(userAddress: string) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);

  // Initialize contract
  useEffect(() => {
    const initializeContract = async () => {
      if (!window.ethereum) {
        setError("MetaMask not installed");
        setIsLoading(false);
        return;
      }

      try {
        // Check if we're on Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') { // Sepolia chainId
          setError('Please connect to Sepolia network');
          setIsLoading(false);
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Create contract instance
        const contract = new ethers.Contract(
          CONTRACT_ADDRESSES.EXAM_STAKING_ADDRESS,
          EXAM_STAKING_ABI,
          signer
        );

        setStakingContract(contract);
      } catch (err: any) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract. Please check your MetaMask connection.');
        setIsLoading(false);
      }
    };

    if (userAddress) {
      initializeContract();
    }
  }, [userAddress]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!stakingContract || !userAddress) {
        setIsLoading(false);
        return;
      }

      try {
        // Get stake events from last 1000 blocks
        const provider = stakingContract.runner?.provider;
        if (!provider) throw new Error("No provider available");

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = currentBlock - 1000; // Look back 1000 blocks
        
        const stakeFilter = stakingContract.filters.Staked(null, userAddress);
        const claimFilter = stakingContract.filters.Claimed(null, userAddress);
        
        const [stakeEvents, claimEvents] = await Promise.all([
          stakingContract.queryFilter(stakeFilter, fromBlock),
          stakingContract.queryFilter(claimFilter, fromBlock)
        ]);
        
        let totalStaked = ethers.getBigInt(0);
        let won = 0;
        let lost = 0;
        const examResults: ExamResult[] = [];
        let totalEarnings = ethers.getBigInt(0);

        // Process stake events
        for (const event of stakeEvents) {
          const examId = event.args?.[0];
          const amount = event.args?.[3];
          if (examId && amount) {
            totalStaked = totalStaked + amount;
            
            // Check if this stake was processed
            const [claimed, isWinner] = await Promise.all([
              stakingContract.hasClaimed(examId, userAddress),
              stakingContract.isWinner(examId, userAddress)
            ]);
            
            if (claimed) {
              if (isWinner) {
                won++;
                const reward = amount * ethers.getBigInt(2); // Winners get 2x
                const netReward = reward - amount;
                totalEarnings = totalEarnings + netReward;
                examResults.push({
                  exam: examId,
                  netReward: parseFloat(ethers.formatUnits(netReward, 6))
                });
              } else {
                lost++;
                totalEarnings = totalEarnings - amount;
                examResults.push({
                  exam: examId,
                  netReward: -parseFloat(ethers.formatUnits(amount, 6))
                });
              }
            }
          }
        }

        // Get classes joined - use unique exam class IDs
        const uniqueClasses = new Set<string>();
        for (const event of stakeEvents) {
          const examId = event.args?.[0];
          if (examId) {
            const exam = await stakingContract.getExam(examId);
            uniqueClasses.add(exam.classId);
          }
        }

        // Calculate win rate and format amounts
        const totalProcessed = won + lost;
        const winRate = totalProcessed > 0 ? (won / totalProcessed) * 100 : 0;
        const formattedTotalStaked = parseFloat(ethers.formatUnits(totalStaked, 6));
        const formattedTotalEarnings = parseFloat(ethers.formatUnits(totalEarnings, 6));

        // Sort results by reward
        examResults.sort((a, b) => b.netReward - a.netReward);

        setMetrics({
          totalStaked: formattedTotalStaked.toFixed(2) + ' PYUSD',
          totalStakesWon: won,
          totalStakesLost: lost,
          winRate: Math.round(winRate),
          totalEarnings: (totalEarnings >= ethers.getBigInt(0) ? '+' : '') + 
                        formattedTotalEarnings.toFixed(2) + ' PYUSD',
          classesJoined: uniqueClasses.size,
          examResults,
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        const errorMessage = err.message || 'Failed to fetch analytics data';
        setError(`${errorMessage}. Please verify you are connected to Sepolia network.`);
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [stakingContract, userAddress]);

  return { metrics, isLoading, error };
}

export default useAnalytics;