import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, DollarSign, AlertCircle } from "lucide-react";

const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`),
  info: (message: string) => alert(`ℹ️ ${message}`)
};

interface IntegratedStakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  examId: string;
  candidateAddress: string;
  candidateName: string;
}

const IntegratedStakeDialog: React.FC<IntegratedStakeDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  examId,
  candidateAddress,
  candidateName
}) => {
  const [amount, setAmount] = useState("");
  const [predictedMarks, setPredictedMarks] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"connect" | "stake" | "approve" | "confirm">("connect");

  useEffect(() => {
    if (isOpen) {
      checkWalletConnection();
    }
  }, [isOpen]);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          setStep("stake");
          
          await getPyusdBalance(address, provider);
        }
      }
    } catch (error) {
      console.error("Wallet connection check failed:", error);
    }
  };

  const getPyusdBalance = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
      const PYUSD_ABI = ["function balanceOf(address account) external view returns (uint256)"];
      
      const contract = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, provider);
      const balanceWei = await contract.balanceOf(address);
      setBalance(ethers.formatUnits(balanceWei, 6));
    } catch (error) {
      console.error("Failed to get PYUSD balance:", error);
      setBalance("0");
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setWalletAddress(address);
      setStep("stake");
      
      await getPyusdBalance(address, provider);
      
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStake = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const EXAM_ABI = [
        "function stake(bytes32 examId, address candidate, uint256 amount) external"
      ];

      const response = await fetch('http://localhost:4000/api/exams/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          examId,
          candidateAddress: candidateAddress || walletAddress,
          amount: parseFloat(amount),
          predictedMarks: parseFloat(predictedMarks)
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      const examContract = new ethers.Contract(data.blockchain.contractAddress, EXAM_ABI, signer);
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(data.blockchain.examId));
      const stakeAmountWei = ethers.parseUnits(amount, 6);
      
      const stakeTx = await examContract.stake(examIdBytes, candidateAddress || walletAddress, stakeAmountWei);
      toast.info("Staking transaction sent. Waiting for confirmation...");
      
      await stakeTx.wait();
      
      await getPyusdBalance(walletAddress, provider);
      
      toast.success(`Successfully staked ${amount} PYUSD on ${candidateName}!`);
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error("Staking error:", error);
      toast.error(error.message || "Failed to complete stake");
      setStep("stake");
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid stake amount");
      return;
    }

    if (!predictedMarks || parseFloat(predictedMarks) < 0 || parseFloat(predictedMarks) > 100) {
      toast.error("Please enter predicted marks between 0-100");
      return;
    }

    const stakeAmount = parseFloat(amount);
    if (stakeAmount > parseFloat(balance)) {
      toast.error("Insufficient PYUSD balance");
      return;
    }

    setLoading(true);
    setStep("approve");

    try {
      toast.info("Recording stake...");
      
      const response = await fetch('http://localhost:4000/api/exams/stake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          examId,
          candidateAddress: candidateAddress || walletAddress, 
          amount: stakeAmount,
          predictedMarks: parseFloat(predictedMarks)
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }

      setStep("confirm");
      toast.info("Please confirm the blockchain transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      const PYUSD_ADDRESS = data.blockchain.pyusdAddress;
      const EXAM_STAKING_ADDRESS = data.blockchain.contractAddress;
      
      const PYUSD_ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ];

      const EXAM_ABI = [
        "function stake(bytes32 examId, address candidate, uint256 amount) external"
      ];

      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, signer);
      const allowance = await pyusdContract.allowance(walletAddress, EXAM_STAKING_ADDRESS);
      const stakeAmountWei = ethers.parseUnits(stakeAmount.toString(), 6);

      if (allowance < stakeAmountWei) {
        toast.info("Approving PYUSD spending...");
        const approveTx = await pyusdContract.approve(EXAM_STAKING_ADDRESS, stakeAmountWei);
        await approveTx.wait();
        toast.info("Approval confirmed! Now staking...");
      }

      setStep("confirm");

    } catch (error: any) {
      console.error("Staking error:", error);
      toast.error(error.message || "Failed to complete stake");
      setStep("stake");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAmount("");
    setPredictedMarks("");
    setStep("connect");
    setWalletAddress("");
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case "connect":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 mb-4">
                Connect your MetaMask wallet to stake PYUSD
              </p>
              <Button 
                onClick={connectWallet} 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Connecting..." : "Connect MetaMask"}
              </Button>
            </div>
          </div>
        );

      case "stake":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Stake on {candidateName}</h3>
              <p className="text-gray-600">
                Address: {candidateAddress.slice(0, 10)}...{candidateAddress.slice(-8)}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your PYUSD Balance:</span>
                <span className="font-semibold">{parseFloat(balance).toFixed(2)} PYUSD</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Connected Wallet:</span>
                <span className="text-xs font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Stake Amount (PYUSD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount (whole numbers only)"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d+$/.test(value)) {
                      setAmount(value);
                    }
                  }}
                  className="pl-10"
                  min="1"
                  step="1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Only whole numbers allowed (no decimals)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="predictedMarks">Predicted Marks (%)</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400 text-sm">%</span>
                <Input
                  id="predictedMarks"
                  type="number"
                  placeholder="Enter predicted marks (0-100)"
                  value={predictedMarks}
                  onChange={(e) => setPredictedMarks(e.target.value)}
                  className="pl-8"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-500">
                Predict your exam score (0-100%). More accurate predictions may earn bonus rewards!
              </p>
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleClose} className="flex-1 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button 
                onClick={handleStake} 
                disabled={loading || !amount || parseFloat(amount) <= 0 || !predictedMarks || parseFloat(predictedMarks) < 0 || parseFloat(predictedMarks) > 100}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Processing..." : "Stake PYUSD"}
              </Button>
            </div>
          </div>
        );

      case "approve":
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold">Approval Required</h3>
            <p className="text-gray-600">
              Please approve PYUSD spending in your wallet
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Confirm Stake</h3>
            <p className="text-gray-600">
              Confirm the staking transaction in your wallet
            </p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <p className="font-semibold">{amount} PYUSD → {candidateName}</p>
              <p className="text-sm text-gray-600">Predicted Score: {predictedMarks}%</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={handleConfirmStake} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "Processing..." : "Confirm Stake"}
              </Button>
              <Button 
                onClick={() => setStep("stake")} 
                className="w-full border border-gray-300 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stake PYUSD</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default IntegratedStakeDialog;