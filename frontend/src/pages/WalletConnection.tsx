import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, CheckCircle, AlertTriangle, Copy } from "lucide-react";
import { ethers } from "ethers";

interface User {
  _id: string;
  username: string;
  walletAddress?: string;
  role: string;
}

const WalletConnection: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [pyusdBalance, setPyusdBalance] = useState<string>("0");

  useEffect(() => {
    fetchUserInfo();
    checkWalletConnection();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setConnectedAddress(address);
          setIsConnected(true);
          
          await getPyusdBalance(address, provider);
        }
      }
    } catch (error) {
      console.error("Wallet check failed:", error);
    }
  };

  const getPyusdBalance = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
      const PYUSD_ABI = ["function balanceOf(address account) external view returns (uint256)"];
      
      const contract = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, provider);
      const balanceWei = await contract.balanceOf(address);
      setPyusdBalance(ethers.formatUnits(balanceWei, 6));
    } catch (error) {
      console.error("Failed to get PYUSD balance:", error);
      setPyusdBalance("0");
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) { 
        throw new Error("Please switch to Sepolia testnet in MetaMask");
      }
      
      setConnectedAddress(address);
      setIsConnected(true);
      
      await getPyusdBalance(address, provider);
      
      alert("✅ Wallet connected successfully!\nYou can now update your profile with this wallet address.");
      
    } catch (error: any) {
      alert(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateWalletAddress = async () => {
    if (!isConnected || !connectedAddress) {
      alert("Please connect your wallet first");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/users/update-wallet', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          walletAddress: connectedAddress.toLowerCase()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(prev => prev ? { ...prev, walletAddress: connectedAddress.toLowerCase() } : null);
        alert("✅ Wallet address updated successfully!\nYou can now participate in PYUSD staking.");
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      alert(`❌ Failed to update wallet: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const copyAddress = () => {
    if (connectedAddress) {
      navigator.clipboard.writeText(connectedAddress);
      alert("📋 Address copied to clipboard!");
    }
  };

  const getWalletStatus = () => {
    if (!user?.walletAddress) {
      return { status: "not_connected", color: "red", icon: AlertTriangle, text: "No wallet connected" };
    } else if (user.walletAddress !== connectedAddress.toLowerCase()) {
      return { status: "different", color: "yellow", icon: AlertTriangle, text: "Different wallet connected" };
    } else {
      return { status: "connected", color: "green", icon: CheckCircle, text: "Wallet connected" };
    }
  };

  const walletStatus = getWalletStatus();
  const StatusIcon = walletStatus.icon;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wallet Connection</h1>
        <p className="text-gray-600">Connect your MetaMask wallet to participate in PYUSD staking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>Current Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-5 h-5 text-${walletStatus.color}-600`} />
              <span className={`font-semibold text-${walletStatus.color}-600`}>
                {walletStatus.text}
              </span>
            </div>

            {user?.walletAddress && (
              <div>
                <Label className="text-sm font-medium">Saved Wallet Address:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                    {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(user.walletAddress!)}
                    className="px-2 py-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {isConnected && (
              <div>
                <Label className="text-sm font-medium">Connected Wallet:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="bg-blue-100 px-2 py-1 rounded text-sm flex-1">
                    {connectedAddress.slice(0, 10)}...{connectedAddress.slice(-8)}
                  </code>
                  <Button
                    size="sm"
                    onClick={copyAddress}
                    className="px-2 py-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  PYUSD Balance: <strong>{parseFloat(pyusdBalance).toFixed(2)} PYUSD</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Connect MetaMask</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect your MetaMask wallet to participate in PYUSD staking on exams
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
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Wallet Connected</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Network: Sepolia Testnet ✓
                  </p>
                </div>

                {walletStatus.status !== "connected" && (
                  <Button 
                    onClick={updateWalletAddress}
                    disabled={updating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {updating ? "Updating..." : "Save This Wallet Address"}
                  </Button>
                )}

                {walletStatus.status === "connected" && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✅ You're all set! Your wallet is connected and saved. You can now participate in PYUSD staking on exams.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Get PYUSD for Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Get Sepolia ETH</h4>
              <p className="text-sm text-gray-600 mb-2">
                You need Sepolia ETH for gas fees. Get it from:
              </p>
              <ul className="text-sm space-y-1">
                <li>• <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Sepolia Faucet</a></li>
                <li>• <a href="https://faucets.chain.link/sepolia" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chainlink Faucet</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Step 2: Get PYUSD</h4>
              <p className="text-sm text-gray-600 mb-2">
                PYUSD Contract: <code className="bg-gray-100 px-1 rounded">0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9</code>
              </p>
              <p className="text-sm text-gray-600">
                Add this token to MetaMask or get test PYUSD from the deployer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnection;