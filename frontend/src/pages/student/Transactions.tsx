import { useEffect, useState } from "react";
import { ReceiptText, Loader2, ExternalLink } from "lucide-react";
import BlockscoutLogo from "/images/BlockScoutLogo.png";
import { Button } from "@/components/ui/button";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

interface Transaction {
  _id: string;
  stakeAmount: number;
  rewardAmount: number;
  predictedMarks: number;
  actualMarks: number;
  isWinner: boolean;
  isClaimed: boolean;
  createdAt: string;
  stakeTransactionHash?: string;
  claimTransactionHash?: string;
  exam?: {
    name: string;
    maxMarks: number;
  };
  class?: {
    name: string;
    code: string;
  };
}

interface RecentTransaction {
  hash: string;
  type: string;
  timestamp: string;
  method?: string;
  contractAddress?: string;
  from: string;
  to: string;
  value: string;
}

export default function TransactionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [userWalletAddress, setUserWalletAddress] = useState<string>("");

  useEffect(() => {
    fetchUserWalletAddress();
  }, []);

  useEffect(() => {
    if (userWalletAddress) {
      fetchTransactions();
      fetchRecentTransactions();
    }
  }, [userWalletAddress]);

  const fetchUserWalletAddress = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const walletAddress = data.user?.walletAddress;
        if (walletAddress) {
          setUserWalletAddress(walletAddress);
          localStorage.setItem("walletAddress", walletAddress);
        }
      }
    } catch (error) {
      console.error("Error fetching user wallet:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_BASE}/exams/stakes/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.stakes || []);
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      setRecentLoading(true);

      if (!userWalletAddress) {
        setRecentLoading(false);
        return;
      }

      const response = await fetch(
        `https://eth-sepolia.blockscout.com/api?module=account&action=txlist&address=${userWalletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "1") {
          const formattedTxs: RecentTransaction[] = data.result.slice(0, 5).map((tx: any) => ({
            hash: tx.hash,
            type: tx.input === "0x" ? "PYUSD Transfer" : "Contract Interaction",
            timestamp: `${Math.floor((Date.now() - parseInt(tx.timeStamp) * 1000) / (60 * 60 * 1000))}h ago`,
            method: tx.input !== "0x" ? getMethodName(tx.input) : undefined,
            contractAddress: tx.to,
            from: tx.from,
            to: tx.to,
            value: tx.value
          }));
          setRecentTxs(formattedTxs);
        }
      }
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
    } finally {
      setRecentLoading(false);
    }
  };

  const getMethodName = (input: string): string => {
    const methodMap: { [key: string]: string } = {
      "0x98e8d931": "stake",
      "0x2e1a7d4d": "claim",
      "0x095ea7b3": "approve"
    };

    const methodId = input.slice(0, 10);
    return methodMap[methodId] || "0x98e8d931";
  };

  const getTransactionDescription = (tx: RecentTransaction) => {
    if (tx.method === "approve") {
      return (
        <>
          Approved <span className="font-bold text-blue-600">T</span> for trade on{" "}
          <span className="font-bold text-blue-600">PYUSD</span> {formatAddress(tx.to)}
        </>
      );
    }
    if (tx.method === "stake") {
      return (
        <>
          {formatAddress(tx.from)} called<br />
          <span className="font-bold text-green-600">stake</span> on<br />
          {formatAddress(tx.to)}
        </>
      );
    }
    if (tx.method === "claim") {
      return (
        <>
          {formatAddress(tx.from)} called<br />
          <span className="font-bold text-green-600">claim</span> on<br />
          {formatAddress(tx.to)}
        </>
      );
    }
    return (
      <>
        {formatAddress(tx.from)} called {tx.method || 'contract'} on {formatAddress(tx.to)}
      </>
    );
  };

  const openBlockScout = (txHash: string) => {
    window.open(`https://eth-sepolia.blockscout.com/tx/${txHash}`, '_blank');
  };

  const formatAddress = (address: string) => {
    return `0x${address.slice(2, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <img
            src={BlockscoutLogo}
            alt="Blockscout Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-4xl sm:text-4xl font-extrabold text-gray-800 mb-2">
              View <span className="text-green-500">Transactions</span>
            </h1>
            <p className="font-mono text-gray-600 text-md">
              Powered By BlockScout
            </p>
          </div>
        </div>

        <div className="flex mt-8">
          <Button
            className="border-2 border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 bg-purple-500 hover:bg-purple-600 cursor-pointer text-white mb-5"
            onClick={() => window.open("https://staked.cloud.blockscout.com", "_blank")}
          >
            <ExternalLink className="w-4 h-4"/>
            View Explorer on Autoscout
          </Button>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000]">
              <h2 className="text-2xl font-extrabold text-gray-800 mb-6 uppercase tracking-wide">
                Exam Transactions
              </h2>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="animate-spin w-10 h-10 text-gray-600" />
                  <p className="ml-3 font-mono text-gray-600">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20">
                  <ReceiptText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-mono mb-2">No transactions yet</p>
                  <p className="text-gray-400 text-sm">
                    Participate in exams to see your transactions here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead className="bg-gray-100 border-b-4 border-black">
                      <tr>
                        <th className="border-b-2 border-black px-4 py-3 text-left font-extrabold uppercase tracking-wider text-gray-800">
                          Exam
                        </th>
                        <th className="border-b-2 border-black px-4 py-3 text-left font-extrabold uppercase tracking-wider text-gray-800">
                          Stake (PYUSD)
                        </th>
                        <th className="border-b-2 border-black px-4 py-3 text-left font-extrabold uppercase tracking-wider text-gray-800">
                          Reward (PYUSD)
                        </th>
                        <th className="border-b-2 border-black px-4 py-3 text-left font-extrabold uppercase tracking-wider text-gray-800">
                          Status
                        </th>
                        <th className="border-b-2 border-black px-4 py-3 text-left font-extrabold uppercase tracking-wider text-gray-800">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr
                          key={txn._id}
                          className="border-b border-gray-300 bg-white"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-800">{txn.exam?.name || "Unknown Exam"}</div>
                            <div className="text-xs text-gray-600 font-mono">
                              {txn.class?.name} ({txn.class?.code})
                            </div>
                            <div className="text-xs text-gray-500">
                              {txn.predictedMarks}/{txn.exam?.maxMarks} → {txn.actualMarks}/{txn.exam?.maxMarks}
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              {txn.stakeTransactionHash && (
                                <button
                                  onClick={() => openBlockScout(txn.stakeTransactionHash!)}
                                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white font-mono text-xs px-2 py-1 border border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
                                >
                                  Stake TX <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                              {txn.claimTransactionHash && (
                                <button
                                  onClick={() => openBlockScout(txn.claimTransactionHash!)}
                                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-mono text-xs px-2 py-1 border border-black shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] transition-all"
                                >
                                  Claim TX <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-bold">
                            {txn.stakeAmount}
                          </td>
                          <td
                            className={`px-4 py-3 font-bold ${txn.rewardAmount > 0
                              ? "text-green-600"
                              : "text-gray-500"
                              }`}
                          >
                            {txn.rewardAmount}
                          </td>
                          <td className="px-4 py-3 font-bold">
                            {txn.isWinner ? (
                              txn.isClaimed ? (
                                <span className="text-green-600">Claimed</span>
                              ) : (
                                <span className="text-yellow-600">Unclaimed</span>
                              )
                            ) : (
                              <span className="text-gray-500">Lost</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                            {new Date(txn.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000] max-h-[700px]">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-gray-800 uppercase tracking-wide">
                RECENT TRANSACTIONS FOR {userWalletAddress ? formatAddress(userWalletAddress).toUpperCase() : 'YOUR WALLET'}
              </h2>
            </div>

            {recentLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
                <p className="ml-2 font-mono text-gray-600 text-sm">Loading...</p>
              </div>
            ) : recentTxs.length === 0 ? (
              <div className="text-center py-8">
                <ReceiptText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 font-mono text-sm">No recent transactions</p>
                <p className="text-gray-400 text-xs mt-1">
                  Connect your wallet to see transactions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTxs.map((tx) => (
                  <div key={tx.hash} className="flex items-start gap-3 p-3">
                    <div className="flex-shrink-0 w-4 h-4 mt-1">
                      <div className="w-4 h-4 border-2 border-gray-400 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <button
                          onClick={() => openBlockScout(tx.hash)}
                          className="text-gray-800 hover:text-blue-600 text-sm font-normal text-left leading-tight"
                        >
                          {getTransactionDescription(tx)}
                          <ExternalLink className="w-3 h-3 ml-1 inline align-baseline" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        {tx.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}