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
  period: string; 
  stakesWon: number;
  stakesTotal: number;
  examResult?: string; 
  examId?: string;
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

async function getBlockTimestamp(blockNumber: string): Promise<number> {
  if (!blockNumber || blockNumber === "0x0" || blockNumber === "0") {
    return Date.now() / 1000; 
  }

  try {
    const response = await fetch(`${BLOCKSCOUT_BASE_URL}/blocks/${blockNumber}`);
    if (!response.ok) {
      throw new Error(`Blockscout returned ${response.status}`);
    }
    const data = await response.json();
    return new Date(data.timestamp).getTime() / 1000;
  } catch {
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
        const userStakes = new Map<string, bigint>(); 
        const userClaims = new Map<string, bigint>(); 
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
              const currentClaim = userClaims.get(examId) || 0n;
              userClaims.set(examId, currentClaim + payout);
            }
          }
        };

        const calculateWinRateHistory = async (forceRefresh = false) => {

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

          const processedExamIds = new Set(storedHistory.map(point => point.examId));

          const newExamPoints: Array<{
            timestamp: number;
            won: boolean;
            examId: string;
            blockNumber: string;
          }> = [];

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

          for (const [examId, winners] of finals.entries()) {
            if (processedExamIds.has(examId.slice(0, 10) + '...')) {
              continue;
            }

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


          newExamPoints.sort((a, b) => a.timestamp - b.timestamp);

          if (newExamPoints.length === 0) {
            return storedHistory;
          }

          const allPoints = [...storedHistory];

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

          try {
            localStorage.setItem(storageKey, JSON.stringify(allPoints));
          } catch (error) {
            console.warn("⚠️ Failed to save history:", error);
          }

          allPoints.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          });

          return allPoints;


        };

        const winRateHistory = await calculateWinRateHistory(true);

        let won = 0;
        let lost = 0;
        const examResults: ExamResult[] = [];
        let totalReceivedFromWins = 0n; 
        let totalLostFromLosses = 0n;    

        for (const point of winRateHistory) {
          if (point.examResult === 'WON') {
            won++;
            const fullExamId = Array.from(finals.keys()).find(id =>
              id.slice(0, 10) + '...' === point.examId
            );

            if (fullExamId) {
              const claimedAmount = userClaims.get(fullExamId) || 0n;
              const stakedAmount = userStakes.get(fullExamId) || 0n;

              if (claimedAmount > 0n) {
                totalReceivedFromWins += claimedAmount;
                const netReward = parseFloat(ethers.formatUnits(claimedAmount, 6));

                examResults.push({
                  exam: `Exam ${point.examId}`,
                  netReward: netReward
                });
              } else {
                totalReceivedFromWins += stakedAmount; 
                const netReward = parseFloat(ethers.formatUnits(stakedAmount, 6));
                console.log(`⏳ Win not claimed yet: +${netReward} PYUSD (estimated stake return)`);

                examResults.push({
                  exam: `Exam ${point.examId}`,
                  netReward: netReward
                });
              }
            } else {
              console.log(`⚠️ WIN: Could not find full exam ID for ${point.examId}`);
              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: 1.0 
              });
            }
          } else if (point.examResult === 'LOST') {
            lost++;
            const fullExamId = Array.from(finals.keys()).find(id =>
              id.slice(0, 10) + '...' === point.examId
            );

            if (fullExamId) {
              const stakedAmount = userStakes.get(fullExamId) || 0n;

              totalLostFromLosses += stakedAmount;
              const netReward = -parseFloat(ethers.formatUnits(stakedAmount, 6));

              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: netReward
              });
            } else {
              console.log(`⚠️ LOSS: Could not find full exam ID for ${point.examId}`);
              examResults.push({
                exam: `Exam ${point.examId}`,
                netReward: -1.0 
              });
            }
          }
        }

        const netEarnings = parseFloat(ethers.formatUnits(totalReceivedFromWins - totalLostFromLosses, 6));

        const totalProcessed = won + lost;
        const winRate = totalProcessed > 0 ? (won / totalProcessed) * 100 : 0;

        const formattedStaked = parseFloat(ethers.formatUnits(totalStaked, 6));

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
