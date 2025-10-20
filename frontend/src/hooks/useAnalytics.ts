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
                // Get all relevant events using Blockscout's longer history
                const provider = stakingContract.runner?.provider;
                if (!provider) throw new Error("No provider available");

                const currentBlock = await provider.getBlockNumber();
                // Look back much further for Blockscout (approximately 2 months of blocks)
                const fromBlock = currentBlock - 345600;

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

                // Create a map of exam IDs to stake amounts
                const examStakes = new Map<string, bigint>();
                const processedExams = new Set<string>();

                // First process all stake events
                for (const event of stakeEvents) {
                    if (!("args" in event)) continue; // Narrow type to EventLog
                    const examId = event.args[0];
                    const amount = event.args[3];
                    if (examId && amount) {
                        const amt = BigInt(amount.toString());
                        totalStaked += amt;
                        examStakes.set(examId.toString(), amt);
                    }
                }

                // Then process claim events to determine won/
                for (const event of stakeEvents) {
                    if (!("args" in event)) continue; // Narrow to EventLog only
                    const examId = event.args[0];
                    const amount = event.args[3];
                    if (examId && amount) {
                        totalStaked += BigInt(amount.toString());
                        examStakes.set(examId.toString(), BigInt(amount.toString()));
                    }
                }

                for (const event of claimEvents) {
                    if (!("args" in event)) continue; // Narrow to EventLog
                    const examId = event.args[0];
                    if (!examId || processedExams.has(examId.toString())) continue;

                    const stakeAmount = examStakes.get(examId.toString());
                    if (!stakeAmount) continue;

                    const isWinner: boolean = await stakingContract.isWinner(examId, userAddress);
                    if (isWinner) {
                        won++;
                        const reward = stakeAmount * BigInt(2);
                        const netReward = reward - stakeAmount;
                        totalEarnings += netReward;
                        examResults.push({
                            exam: examId.toString(),
                            netReward: parseFloat(ethers.formatUnits(netReward, 6)),
                        });
                    } else {
                        lost++;
                        totalEarnings -= stakeAmount;
                        examResults.push({
                            exam: examId.toString(),
                            netReward: -parseFloat(ethers.formatUnits(stakeAmount, 6)),
                        });
                    }
                    processedExams.add(examId.toString());
                }


                // Get classes joined from backend API for reliability
                const token = localStorage.getItem("token");
                const uniqueClasses = new Set<string>();
                if (token) {
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000/api"}/classes/student`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.classes) {
                                data.classes.forEach((cls: any) => uniqueClasses.add(cls._id));
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching classes:", error);
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