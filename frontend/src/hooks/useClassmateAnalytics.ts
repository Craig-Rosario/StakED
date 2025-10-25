import { useEffect, useState, useRef, useMemo } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "../lib/web3Utils";

const EXAM_STAKING_ABI = [
  "event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount, uint256 predictedScore)",
  "event ExamFinalized(bytes32 indexed examId, address[] winners)",
  "event Claimed(bytes32 indexed examId, address indexed staker, uint256 payout)"
];

interface WinRateDataPoint {
  date: string;
  winRate: number;
  period: string;
  stakesWon: number;
  stakesTotal: number;
  examResult?: string; 
  examId?: string; 
}

interface ClassmateAnalytics {
  walletAddress: string;
  totalStaked: string;
  totalStakesWon: number;
  totalStakesLost: number;
  winRate: number;
  totalEarnings: string;
  totalEarningsValue: number;
  winRateHistory?: WinRateDataPoint[];
}

const BLOCKSCOUT_BASE_URL = import.meta.env.VITE_BLOCKSCOUT_BASE_URL;

const logsCache = {
  data: null as any[] | null,
  timestamp: 0,
  CACHE_DURATION: 60000,
};

async function getLogsFromBlockscout(contractAddress: string) {
  const now = Date.now();
  
  if (logsCache.data && (now - logsCache.timestamp) < logsCache.CACHE_DURATION) {
    console.log("Using cached blockchain data");
    return logsCache.data;
  }

  console.log("Fetching fresh blockchain data...");
  
  const url = `${BLOCKSCOUT_BASE_URL}/addresses/${contractAddress}/logs`;
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`Rate limited by Blockscout. Please wait a moment.`);
    }
    throw new Error(`Blockscout error: ${response.status}`);
  }

  const data = await response.json();
  const logs = data.items || [];
  
  logsCache.data = logs;
  logsCache.timestamp = now;
  
  return logs;
}

export function useClassmateAnalytics(walletAddresses: string[]) {
  const [analytics, setAnalytics] = useState<Record<string, ClassmateAnalytics>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const memoizedAddresses = useMemo(() => {
    return walletAddresses.sort().join(',');
  }, [walletAddresses]);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    if (walletAddresses.length === 0) {
      setIsLoading(false);
      setAnalytics({});
      return;
    }

    fetchTimeoutRef.current = setTimeout(() => {
      const fetchAllAnalytics = async () => {
        setIsLoading(true);
        try {
          const iface = new ethers.Interface(EXAM_STAKING_ABI);
          const logs = await getLogsFromBlockscout(CONTRACT_ADDRESSES.EXAM_STAKING_ADDRESS);

          const results: Record<string, ClassmateAnalytics> = {};

          for (const walletAddress of walletAddresses) {
            const lowerAddress = walletAddress.toLowerCase();
            
            let totalStaked = 0n;
            let totalEarnings = 0n;
            let won = 0;
            let lost = 0;
            const finals = new Map<string, string[]>();
            const userStakedExams = new Set<string>(); 

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
                
                if (staker.toLowerCase() === lowerAddress) {
                  totalStaked += amount;
                  userStakedExams.add(examId);
                }
              }

              else if (parsed.name === "ExamFinalized") {
                const examId = parsed.args.examId as string;
                const winners = (parsed.args.winners as string[]).map((a) => a.toLowerCase());
                finals.set(examId, winners);
              }

              else if (parsed.name === "Claimed") {
                const staker = parsed.args.staker as string;
                const payout = BigInt(parsed.args.payout.toString());
                
                if (staker.toLowerCase() === lowerAddress) {
                  totalEarnings += payout;
                }
              }
            }

            for (const [examId, winners] of finals.entries()) {
              if (userStakedExams.has(examId)) {
                if (winners.includes(lowerAddress)) {
                  won++;
                } else {
                  lost++;
                }
              }
            }

            const winRateHistory: WinRateDataPoint[] = [];
            let runningWon = 0;
            let runningTotal = 0;

            const userFinalizedExams = Array.from(finals.entries())
              .filter(([examId]) => userStakedExams.has(examId))
              .map(([examId, winners]) => ({
                examId,
                won: winners.includes(lowerAddress),
                shortId: examId.slice(0, 10) + '...'
              }));

            userFinalizedExams.forEach((exam, index) => {
              runningTotal++;
              if (exam.won) runningWon++;

              const runningWinRate = Math.round((runningWon / runningTotal) * 100);

              winRateHistory.push({
                date: `Exam ${index + 1}`,
                winRate: runningWinRate,
                period: `Exam ${index + 1}`,
                stakesWon: runningWon,
                stakesTotal: runningTotal,
                examResult: exam.won ? 'WON' : 'LOST',
                examId: exam.shortId
              });
            });

            const totalProcessed = won + lost;
            const winRate = totalProcessed > 0 ? (won / totalProcessed) * 100 : 0;
            const formattedStaked = parseFloat(ethers.formatUnits(totalStaked, 6));
            const formattedEarnings = parseFloat(ethers.formatUnits(totalEarnings, 6));

            results[walletAddress] = {
              walletAddress,
              totalStaked: `${formattedStaked.toFixed(2)} PYUSD`,
              totalStakesWon: won,
              totalStakesLost: lost,
              winRate: Math.round(winRate),
              totalEarnings: `${formattedEarnings >= 0 ? "+" : ""}${formattedEarnings.toFixed(2)} PYUSD`,
              totalEarningsValue: formattedEarnings,
              winRateHistory: winRateHistory,
            };
          }

          setAnalytics(results);
          setError(null);
        } catch (err: any) {
          console.error("Classmate analytics fetch error:", err);
          setError(err.message);
          setAnalytics({});
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllAnalytics();
    }, 1000); 
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [memoizedAddresses]);

  return { analytics, isLoading, error };
}

export default useClassmateAnalytics;