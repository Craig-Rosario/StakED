import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function checkUserStakes() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
  const contractAddress = "0x1E4731390cce9955BC21985BB45068A1858703C2";
  
  const abi = [
    "function getAllUserStakes(address user) external view returns (tuple(bytes32 examId, address candidate, uint256 amount, bool claimed)[] memory)",
    "function claim(bytes32 examId) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function getClaimableAmount(bytes32 examId, address user) external view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, wallet);
  
  console.log("🔍 Checking stakes for:", await wallet.getAddress());
  
  try {
    // Try to get all user stakes
    const stakes = await contract.getAllUserStakes(await wallet.getAddress());
    console.log("📊 Found", stakes.length, "stakes:");
    
    for (const stake of stakes) {
      const examId = stake.examId;
      const candidate = stake.candidate;
      const amount = ethers.formatUnits(stake.amount, 6); // PYUSD has 6 decimals
      const claimed = stake.claimed;
      
      console.log(`\n📋 Exam: ${examId}`);
      console.log(`   Candidate: ${candidate}`);  
      console.log(`   Amount: ${amount} PYUSD`);
      console.log(`   Claimed: ${claimed}`);
      
      try {
        const claimable = await contract.getClaimableAmount(examId, await wallet.getAddress());
        const claimableAmount = ethers.formatUnits(claimable, 6);
        console.log(`   Claimable: ${claimableAmount} PYUSD`);
        
        if (claimable > 0 && !claimed) {
          console.log(`   🎯 CAN CLAIM ${claimableAmount} PYUSD!`);
        }
      } catch (e) {
        console.log(`   ❌ Could not check claimable amount`);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error checking stakes:", error.message);
    
    // Try alternative approach - check the sample exam
    console.log("\n🔍 Checking sample exam...");
    const sampleExamId = "0x2ab2fb4528704dbc6685525af04a840d07f1160a22d42668ce9da47e0884ca88";
    
    try {
      const claimable = await contract.getClaimableAmount(sampleExamId, await wallet.getAddress());
      const claimableAmount = ethers.formatUnits(claimable, 6);
      console.log(`Sample exam claimable: ${claimableAmount} PYUSD`);
      
      if (claimable > 0) {
        console.log("🎯 ATTEMPTING TO CLAIM...");
        const tx = await contract.claim(sampleExamId);
        console.log("📤 Claim transaction:", tx.hash);
        await tx.wait();
        console.log("✅ Claim successful!");
      }
    } catch (e: any) {
      console.log("ℹ️  No claimable amount in sample exam:", e.message);
    }
  }
}

checkUserStakes().catch(console.error);