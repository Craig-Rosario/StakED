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
  try {
    const response = await fetch(`${BLOCKSCOUT_BASE_URL}/blocks/${blockNumber}`);
    const data = await response.json();
    return new Date(data.timestamp).getTime() / 1000;
  } catch {
    // Fallback: estimate timestamp based on current time and block number
    const latestBlock = 9468000; // Approximate latest block
    const secondsPerBlock = 12; // Ethereum average
    const blockDiff = latestBlock - parseInt(blockNumber, 16);
    return Date.now() / 1000 - (blockDiff * secondsPerBlock);
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
        console.log("🔍 Starting analytics fetch for:", userAddress);
        
        const iface = new ethers.Interface(EXAM_STAKING_ABI);
        const logs = await getLogsFromBlockscout(
          CONTRACT_ADDRESSES.EXAM_STAKING_ADDRESS
        );

        console.log("📊 Total logs found:", logs.length);

        let totalStaked = 0n;
        let totalEarnings = 0n;
        let won = 0;
        let lost = 0;
        const finals = new Map<string, string[]>();
        const examResults: ExamResult[] = [];
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
            const amount = BigInt(parsed.args.amount.toString());
            if (staker.toLowerCase() === userAddress.toLowerCase()) {
              totalStaked += amount;
              userStakeCount++;
              console.log("💰 User stake found:", ethers.formatUnits(amount, 6), "PYUSD");
            }
          }

          else if (parsed.name === "ExamFinalized") {
            const examId = parsed.args.examId as string;
            const winners = (parsed.args.winners as string[]).map((a) =>
              a.toLowerCase()
            );
            finals.set(examId, winners);
            console.log("🏆 Exam finalized:", examId, "Winners:", winners.length);
          }

          else if (parsed.name === "Claimed") {
            const staker = parsed.args.staker as string;
            const payout = BigInt(parsed.args.payout.toString());
            if (staker.toLowerCase() === userAddress.toLowerCase()) {
              totalEarnings += payout;
              console.log("💸 User claim found:", ethers.formatUnits(payout, 6), "PYUSD");
            }
          }
        }

        console.log("📈 User stakes found:", userStakeCount);
        console.log("🏁 Finalized exams:", finals.size);

        // Process real exam results only
        for (const [examId, winners] of finals.entries()) {
          // Check if user participated in this exam by looking through stakes
          let userParticipated = false;
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
              const stakeExamId = parsed.args.examId as string;
              if (staker.toLowerCase() === userAddress.toLowerCase() && stakeExamId === examId) {
                userParticipated = true;
                break;
              }
            }
          }
          
          if (userParticipated) {
            if (winners.includes(userAddress.toLowerCase())) {
              won++;
              examResults.push({
                exam: `Exam ${examId.slice(0, 8)}...`,
                netReward: 2.0 // Estimate - actual rewards come from Claimed events
              });
            } else {
              lost++;
              examResults.push({
                exam: `Exam ${examId.slice(0, 8)}...`, 
                netReward: -1.0 // Lost stake
              });
            }
          }
        }

        // Calculate win rate history over time
        const calculateWinRateHistory = async () => {
          console.log("📊 Starting win rate history calculation with REAL Blockscout data");
          console.log("💼 User stake count:", userStakeCount);
          console.log("🏁 Finals processed:", finals.size);
          console.log("📋 Total logs from Blockscout:", logs.length);
          
          const winRateHistory: WinRateDataPoint[] = [];
          
          // Only process if we have real blockchain activity
          if (finals.size > 0 && userStakeCount > 0) {
            console.log("🎯 Processing real blockchain data");
            
            // Create a map to track user's exam participation by timestamp
            const userExamHistory = new Map<string, { timestamp: number; won: boolean }>();
            
            // Go through logs again to get timestamps for user's staked exams
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
              
              // Track when user staked in exams
              if (parsed.name === "Staked") {
                const staker = parsed.args.staker as string;
                const examId = parsed.args.examId as string;
                if (staker.toLowerCase() === userAddress.toLowerCase()) {
                  // Get real timestamp from Blockscout block data
                  const blockNumber = log.blockNumber || "0x0";
                  const timestamp = await getBlockTimestamp(blockNumber);
                  
                  userExamHistory.set(examId, { 
                    timestamp, 
                    won: false // Will be updated when we check finals
                  });
                  
                  console.log("📅 Found user stake in real blockchain data:", {
                    examId: examId.slice(0, 10) + "...",
                    date: new Date(timestamp * 1000).toLocaleString(),
                    blockNumber
                  });
                }
              }
            }
            
            // Update with win/loss information from finals
            for (const [examId, winners] of finals.entries()) {
              if (userExamHistory.has(examId)) {
                const exam = userExamHistory.get(examId)!;
                exam.won = winners.includes(userAddress.toLowerCase());
              }
            }
            
            // Create individual data points for each exam (not grouped)
            const examPoints: Array<{ timestamp: number; won: boolean; examId: string }> = [];
            
            for (const [examId, exam] of userExamHistory.entries()) {
              // Only include finalized exams
              if (finals.has(examId)) {
                examPoints.push({
                  timestamp: exam.timestamp,
                  won: exam.won,
                  examId
                });
              }
            }
            
            // Sort chronologically by timestamp
            examPoints.sort((a, b) => a.timestamp - b.timestamp);
            
            // Create data points for each exam with running win rate
            let cumulativeWon = 0;
            let cumulativeTotal = 0;
            
            for (let i = 0; i < examPoints.length; i++) {
              const exam = examPoints[i];
              cumulativeTotal += 1;
              if (exam.won) cumulativeWon += 1;
              
              const date = new Date(exam.timestamp * 1000);
              const dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              
              const cumulativeWinRate = Math.round((cumulativeWon / cumulativeTotal) * 100);
              
              winRateHistory.push({
                date: dateStr,
                winRate: cumulativeWinRate,
                period: `Exam ${i + 1}`,
                stakesWon: cumulativeWon,
                stakesTotal: cumulativeTotal,
                examResult: exam.won ? 'WON' : 'LOST',
                examId: exam.examId.slice(0, 10) + '...'
              });
              
              console.log(`📊 Point ${i + 1}: ${exam.won ? 'WON' : 'LOST'} - Running WR: ${cumulativeWinRate}%`);
            }
            
            console.log("📈 Real win rate history:", winRateHistory);
            return winRateHistory;
          } else {
            console.log("ℹ️ No real blockchain data available for win rate history");
            console.log("💡 User needs to participate in more exams to see win rate trends");
            return [];
          }
        };

        const winRateHistory = await calculateWinRateHistory();
        console.log("📊 Final win rate history for chart:", winRateHistory);
        
        const totalProcessed = won + lost;
        const winRate = totalProcessed > 0 ? (won / totalProcessed) * 100 : 0;
        const formattedStaked = parseFloat(ethers.formatUnits(totalStaked, 6));
        const formattedEarnings = parseFloat(
          ethers.formatUnits(totalEarnings, 6)
        );

        let classesJoined = 0;
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_BASE || "http://localhost:4000/api"
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

        console.log("🎯 Setting final metrics with blockchain data:", { 
          winRateHistoryLength: winRateHistory?.length || 0,
          totalStakesWon: won,
          totalStakesLost: lost,
          winRate: Math.round(winRate),
          userStakeCount
        });

        setMetrics({
          totalStaked: `${formattedStaked.toFixed(2)} PYUSD`,
          totalStakesWon: won,
          totalStakesLost: lost,
          winRate: Math.round(winRate),
          totalEarnings: `${
            formattedEarnings >= 0 ? "+"  : ""
          }${formattedEarnings.toFixed(2)} PYUSD`,
          totalEarningsValue: formattedEarnings,
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
