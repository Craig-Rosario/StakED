import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/web3Utils";

const EXAM_STAKING_ABI = [
  "event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount, uint256 predictedScore)",
  "event ExamFinalized(bytes32 indexed examId, address[] winners)",
  "event Claimed(bytes32 indexed examId, address indexed staker, uint256 payout)"
];


interface ExamResult {
  exam: string;
  netReward: number;
}

interface WinRateDataPoint {
  date: string;
  winRate: number;
  period: string; // e.g., "Oct 2024"
  stakesWon: number;
  stakesTotal: number;
  examResult?: string; // 'WON' or 'LOST'
  examId?: string; // Short exam ID
}

interface AnalyticsMetrics {
  totalStaked: string;
  totalStakesWon: number;
  totalStakesLost: number;
  winRate: number;
  totalEarnings: string;
  totalEarningsValue: number;
  classesJoined: number;
  examResults: ExamResult[];
  winRateHistory: WinRateDataPoint[];
}

const BLOCKSCOUT_BASE_URL =
  import.meta.env.VITE_BLOCKSCOUT_BASE_URL || 'https://eth-sepolia.blockscout.com/api/v2';

async function getLogsFromBlockscout(contractAddress: string) {
  const url = `${BLOCKSCOUT_BASE_URL}/addresses/${contractAddress}/logs`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Blockscout error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Helper function to get block timestamp from Blockscout
async function getBlockTimestamp(blockNumber: string): Promise<number> {
  // ✅ Prevent invalid API calls
  if (!blockNumber || blockNumber === "0x0" || blockNumber === "0") {
    return Date.now() / 1000; // fallback to current time
  }

  try {
    const response = await fetch(`${BLOCKSCOUT_BASE_URL}/blocks/${blockNumber}`);
    if (!response.ok) {
      throw new Error(`Blockscout returned ${response.status}`);
    }
    const data = await response.json();
    return new Date(data.timestamp).getTime() / 1000;
  } catch {
    // Fallback: estimate timestamp based on block diff
    const latestBlock = 9468000;
    const secondsPerBlock = 12;
    const blockDiff = latestBlock - parseInt(blockNumber, 16);
    return Date.now() / 1000 - blockDiff * secondsPerBlock;
  }
}



export function useAnalytics(
  userAddress: string,
  chainId = "11155111",
  refreshTrigger?: number
) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userAddress) return;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const iface = new ethers.Interface(EXAM_STAKING_ABI);
        const logs = await getLogsFromBlockscout(
          CONTRACT_ADDRESSES.EXAM_STAKING_ADDRESS
        );

        let totalStaked = 0n;
        let totalEarnings = 0n;
        const finals = new Map<string, string[]>();
        const userStakes = new Map<string, bigint>(); // Track user stakes per exam
        const userClaims = new Map<string, bigint>(); // Track user claims per exam
        let userStakeCount = 0;

        for (const log of logs) {
          if (!Array.isArray(log.topics)) continue;

          let parsed: ethers.LogDescription | null = null;
          try {
            parsed = iface.parseLog({
              topics: log.topics.filter(Boolean),
              data: log.data || "0x",
            });
          } catch {
            continue;
          }

          if (!parsed) continue;

          if (parsed.name === "Staked") {
            const staker = parsed.args.staker as string;
            const examId = parsed.args.examId as string;
            const amount = BigInt(parsed.args.amount.toString());
            if (staker.toLowerCase() === userAddress.toLowerCase()) {
              totalStaked += amount;
              userStakeCount++;
              // Track stake amount per exam for accurate loss calculation
              const currentStake = userStakes.get(examId) || 0n;
              userStakes.set(examId, currentStake + amount);
            }
          }

          else if (parsed.name === "ExamFinalized") {
            const examId = parsed.args.examId as string;
            const winners = (parsed.args.winners as string[]).map((a) =>
              a.toLowerCase()
            );
            finals.set(examId, winners);
          }

          else if (parsed.name === "Claimed") {
            const staker = parsed.args.staker as string;
            const examId = parsed.args.examId as string;
            const payout = BigInt(parsed.args.payout.toString());
            if (staker.toLowerCase() === userAddress.toLowerCase()) {
              totalEarnings += payout;
              // Track claim amount per exam for accurate win calculation
              const currentClaim = userClaims.get(examId) || 0n;
              userClaims.set(examId, currentClaim + payout);
            }
          }
        };

        // Calculate win rate history with immutable historical data
        const calculateWinRateHistory = async (forceRefresh = false) => {

          // Get stored historical data
          const storageKey = `winRateHistory_${userAddress.toLowerCase()}`;
          let storedHistory: WinRateDataPoint[] = [];

          try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              storedHistory = JSON.parse(stored);
            }
          } catch (error) {
            console.warn("⚠️ Failed to load stored history:", error);
          }

          // Create a set of already processed exam IDs to prevent duplicates
          const processedExamIds = new Set(storedHistory.map(point => point.examId));

          // Find new exams that haven't been processed yet
          const newExamPoints: Array<{
            timestamp: number;
            won: boolean;
            examId: string;
            blockNumber: string;
          }> = [];

          // Get all user stakes with timestamps for win rate calculation
          const userStakeTimestamps = new Map<string, { timestamp: number; blockNumber: string }>();

          for (const log of logs) {
            if (!Array.isArray(log.topics)) continue;

            let parsed: ethers.LogDescription | null = null;
            try {
              parsed = iface.parseLog({
                topics: log.topics.filter(Boolean),
                data: log.data || "0x",
              });
            } catch {
              continue;
            }

            if (parsed?.name === "Staked") {
              const staker = parsed.args.staker as string;
              const examId = parsed.args.examId as string;

              if (staker.toLowerCase() === userAddress.toLowerCase()) {
                const blockNumber = log.blockNumber || "0x0";
                const timestamp = await getBlockTimestamp(blockNumber);

                userStakeTimestamps.set(examId, { timestamp, blockNumber });
              }
            }
          }

          // Check for new finalized exams
          for (const [examId, winners] of finals.entries()) {
            // Skip if already processed
            if (processedExamIds.has(examId.slice(0, 10) + '...')) {
              continue;
            }

            // Only include if user participated
            if (userStakeTimestamps.has(examId)) {
              const stakeInfo = userStakeTimestamps.get(examId)!;
              const userWon = winners.includes(userAddress.toLowerCase());

              newExamPoints.push({
                timestamp: stakeInfo.timestamp,
                won: userWon,
                examId,
                blockNumber: stakeInfo.blockNumber
              });
            }
          }
          if (!forceRefresh) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              storedHistory = JSON.parse(stored);
            }
          }


          // Sort new exams chronologically
          newExamPoints.sort((a, b) => a.timestamp - b.timestamp);

          if (newExamPoints.length === 0) {
            return storedHistory;
          }

          // Create combined history with new points
          const allPoints = [...storedHistory];

          // Add new points and recalculate running win rate from the point where we add new data
          let cumulativeWon = storedHistory.length > 0 ? storedHistory[storedHistory.length - 1].stakesWon : 0;
          let cumulativeTotal = storedHistory.length > 0 ? storedHistory[storedHistory.length - 1].stakesTotal : 0;

          for (const newPoint of newExamPoints) {
            cumulativeTotal += 1;
            if (newPoint.won) cumulativeWon += 1;

            const date = new Date(newPoint.timestamp * 1000);
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const cumulativeWinRate = Math.round((cumulativeWon / cumulativeTotal) * 100);

            const newDataPoint: WinRateDataPoint = {
              date: dateStr,
              winRate: cumulativeWinRate,
              period: `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
              stakesWon: cumulativeWon,
              stakesTotal: cumulativeTotal,
              examResult: newPoint.won ? 'WON' : 'LOST',
              examId: newPoint.examId.slice(0, 10) + '...'
            };

            allPoints.push(newDataPoint);
          }

          // Save updated history to localStorage
          try {
            localStorage.setItem(storageKey, JSON.stringify(allPoints));
          } catch (error) {
            console.warn("⚠️ Failed to save history:", error);
          }

          // Sort final result by timestamp to ensure chronological order
          allPoints.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          });

          return allPoints;


        };

        const winRateHistory = await calculateWinRateHistory(true);

        // Calculate analytics metrics from the immutable win rate history
        let won = 0;
        let lost = 0;
        const examResults: ExamResult[] = [];
        let totalReceivedFromWins = 0n;  // Total claimed from wins
        let totalLostFromLosses = 0n;    // Total staked on losses

        // Use the immutable history to calculate consistent metrics with actual amounts
        for (const point of winRateHistory) {
          if (point.examResult === 'WON') {
            won++;
            // Get the full exam ID from the short ID
            const fullExamId = Array.from(finals.keys()).find(id =>
              id.slice(0, 10) + '...' === point.examId
            );

            if (fullExamId) {
              const claimedAmount = userClaims.get(fullExamId) || 0n;
              const stakedAmount = userStakes.get(fullExamId) || 0n;

              if (claimedAmount > 0n) {
                // User has claimed rewards - count the full claim amount
                totalReceivedFromWins += claimedAmount;
                const netReward = parseFloat(ethers.formatUnits(claimedAmount, 6));

                examResults.push({
                  exam: `Exam ${point.examId}`,
                  netReward: netReward
                });
              } else {
                // User won but hasn't claimed yet - assume they'll get their stake back
                totalReceivedFromWins += stakedAmount; // At minimum, stake returned
                const netReward = parseFloat(ethers.formatUnits(stakedAmount, 6));
                console.log(`⏳ Win not claimed yet: +${netReward} PYUSD (estimated stake return)`);

                examResults.push({
                  exam: `Exam ${point.examId}`,
                  netReward: netReward
                });
              }
            } else {
              console.log(`⚠️ WIN: Could not find full exam ID for ${point.examId}`);
              // Fallback to estimated values if exam not found
              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: 1.0 // Conservative estimate
              });
            }
          } else if (point.examResult === 'LOST') {
            lost++;
            // Get the full exam ID from the short ID
            const fullExamId = Array.from(finals.keys()).find(id =>
              id.slice(0, 10) + '...' === point.examId
            );

            if (fullExamId) {
              const stakedAmount = userStakes.get(fullExamId) || 0n;

              // For losses: count the full stake amount as lost
              totalLostFromLosses += stakedAmount;
              const netReward = -parseFloat(ethers.formatUnits(stakedAmount, 6));

              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: netReward
              });
            } else {
              console.log(`⚠️ LOSS: Could not find full exam ID for ${point.examId}`);
              // Fallback to estimated values if exam not found
              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: -1.0 // Estimate: typically lose stake amount
              });
            }
          }
        }

        // Calculate net earnings: Total received - Total lost
        const netEarnings = parseFloat(ethers.formatUnits(totalReceivedFromWins - totalLostFromLosses, 6));

        const totalProcessed = won + lost;
        const winRate = totalProcessed > 0 ? (won / totalProcessed) * 100 : 0;

        // Total Staked: Keep as blockchain data (cumulative amount staked - always increases)
        const formattedStaked = parseFloat(ethers.formatUnits(totalStaked, 6));

        // Total Earnings: Use calculated net earnings (wins - losses, can be negative)
        // const blockchainEarnings = parseFloat(ethers.formatUnits(totalEarnings, 6));

        let classesJoined = 0;
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE
            }/classes/student`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            const data = await res.json();
            classesJoined = (data.classes || []).length;
          }
        }

        setMetrics({
          totalStaked: `${formattedStaked.toFixed(2)} PYUSD`,
          totalStakesWon: won,
          totalStakesLost: lost,
          winRate: Math.round(winRate),
          totalEarnings: `${netEarnings >= 0 ? "+" : ""
            }${netEarnings.toFixed(2)} PYUSD`,
          totalEarningsValue: netEarnings,
          classesJoined,
          examResults,
          winRateHistory: winRateHistory || [],
        });
        setError(null);
      } catch (err: unknown) {
        console.error("Analytics fetch error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userAddress, chainId, refreshTrigger]);

  return { metrics, isLoading, error };
}

export default useAnalytics;
