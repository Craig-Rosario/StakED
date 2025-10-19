import { useState } from 'react';
import { ethers } from 'ethers';

const EXAM_STAKING_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "examId",
        "type": "bytes32"
      }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "examId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "staker",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "candidate",
        "type": "address"
      }
    ],
    "name": "stakeOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "examId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "staker",
        "type": "address"
      }
    ],
    "name": "hasClaimed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "examId",
        "type": "bytes32"
      }
    ],
    "name": "getExam",
    "outputs": [
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "stakeDeadline",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "finalized",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "canceled",
        "type": "bool"
      },
      {
        "internalType": "uint16",
        "name": "feeBps",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "totalStake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "protocolFee",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "candidates",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface ManualClaimProps {
  contractAddress: string;
  examId: string;
  onClose: () => void;
}

export default function ManualClaim({ contractAddress, examId, onClose }: ManualClaimProps) {
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState('');

  const claimReward = async () => {
    try {
      setClaiming(true);
      setStatus('Connecting to MetaMask...');

      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      setStatus('Connected! Preparing transaction...');

      const contract = new ethers.Contract(contractAddress, EXAM_STAKING_ABI, signer);
      
      const userAddress = await signer.getAddress();
      
      const examIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(examId));
      
      setStatus('Checking stake on blockchain...');
      
      try {
        // Get exam details to find candidates
        const examDetails = await contract.getExam(examIdBytes32);
        const candidates = examDetails[7]; // candidates array
        
        // Check if user has already claimed
        const hasClaimed = await contract.hasClaimed(examIdBytes32, userAddress);
        if (hasClaimed) {
          throw new Error('Rewards already claimed');
        }
        
        // Check user's total stake across all candidates
        let totalStake = 0n;
        for (const candidate of candidates) {
          const stake = await contract.stakeOf(examIdBytes32, userAddress, candidate);
          totalStake += stake;
        }
        
        setStatus(`Found stake: ${ethers.formatUnits(totalStake, 6)} PYUSD`);
        
        if (totalStake === 0n) {
          throw new Error('No stake found for this exam');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Stake verification failed: ${errorMessage}`);
      }
      
      setStatus('Sending claim transaction...');

      const tx = await contract.claim(examIdBytes32);
      
      setStatus(`Transaction sent! Hash: ${tx.hash}`);
      setStatus('Waiting for confirmation...');

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setStatus('✅ Rewards claimed successfully!');
        setTimeout(() => {
          onClose();
          window.location.reload(); 
        }, 3000);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error: unknown) {
      console.error('Claim error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setStatus(`❌ Error: ${errorMessage}`);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black p-6 max-w-md mx-4 shadow-[8px_8px_0px_#000]">
        <h2 className="text-xl font-bold mb-4 text-center">Manual Claim Required</h2>
        
        <div className="space-y-4 mb-6">
          <div className="p-3 bg-blue-50 border-2 border-blue-300">
            <p className="text-sm font-bold text-blue-800">
              🔗 Contract: <span className="font-mono text-xs break-all">{contractAddress}</span>
            </p>
          </div>
          
          <div className="p-3 bg-green-50 border-2 border-green-300">
            <p className="text-sm font-bold text-green-800">
              📋 Exam ID: <span className="font-mono text-xs break-all">{examId}</span>
            </p>
          </div>

          {status && (
            <div className="p-3 bg-gray-50 border-2 border-gray-300">
              <p className="text-sm font-bold text-gray-800">{status}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={claimReward}
            disabled={claiming}
            className="flex-1 bg-green-500 text-white font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {claiming ? 'CLAIMING...' : 'CLAIM WITH METAMASK'}
          </button>
          
          <button
            onClick={onClose}
            disabled={claiming}
            className="bg-gray-500 text-white font-bold py-2 px-4 border-2 border-black shadow-[4px_4px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
          >
            CLOSE
          </button>
        </div>

        <div className="mt-4 p-2 bg-yellow-50 border-2 border-yellow-300">
          <p className="text-xs text-yellow-800">
            💡 Make sure MetaMask is connected to Sepolia testnet and you have enough ETH for gas fees.
          </p>
        </div>
      </div>
    </div>
  );
}