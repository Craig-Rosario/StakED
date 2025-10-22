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

interface AnalyticsMetrics {
  totalStaked: string;
  totalStakesWon: number;
  totalStakesLost: number;
  winRate: number;
  totalEarnings: string;
  totalEarningsValue: number;
  classesJoined: number;
  examResults: ExamResult[];
}

const BLOCKSCOUT_BASE_URL =
  import.meta.env.VITE_BLOCKSCOUT_BASE_URL;

async function getLogsFromBlockscout(contractAddress: string) {
  const url = `${BLOCKSCOUT_BASE_URL}/addresses/${contractAddress}/logs`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Blockscout error: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
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
        let won = 0;
        let lost = 0;
        const finals = new Map<string, string[]>();
        const examResults: ExamResult[] = [];

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
            const payout = BigInt(parsed.args.payout.toString());
            if (staker.toLowerCase() === userAddress.toLowerCase()) {
              totalEarnings += payout;
            }
          }
        }

        for (const [, winners] of finals.entries()) {
          if (winners.includes(userAddress.toLowerCase())) won++;
          else lost++;
        }

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

        setMetrics({
          totalStaked: `${formattedStaked.toFixed(2)} PYUSD`,
          totalStakesWon: won,
          totalStakesLost: lost,
          winRate: Math.round(winRate),
          totalEarnings: `${
            formattedEarnings >= 0 ? "+" : ""
          }${formattedEarnings.toFixed(2)} PYUSD`,
          totalEarningsValue: formattedEarnings,
          classesJoined,
          examResults,
        });
        setError(null);
      } catch (err: any) {
        console.error("Analytics fetch error:", err);
        setError(err.message);
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
