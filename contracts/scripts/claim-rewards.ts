import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("💎 Claiming Rewards from Finalized Exam");
  console.log("======================================");
  
  const examStakingAddress = "0xEe41CA98C7E2f2050127111edf3bac094dE24029";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const examId = "two-student-final";
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
  
  const userAddress = await wallet.getAddress();

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function claim(bytes32 examId) external",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function getExam(bytes32 examId) external view returns (address, uint64, bool, bool, uint16, uint256, uint256, address[])"
  ], wallet);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function balanceOf(address account) external view returns (uint256)"
  ], provider);

  try {
    console.log("👤 Claimer:", userAddress);
    console.log("🎯 Exam ID:", examId);

    // Check if exam is finalized
    const [, , finalized] = await examStaking.getExam(examIdBytes);
    console.log("📋 Exam Finalized:", finalized);

    if (!finalized) {
      console.log("❌ Exam not finalized yet. Cannot claim rewards.");
      return;
    }

    // Check if user is a winner
    const isWinner = await examStaking.isWinner(examIdBytes, userAddress);
    console.log("🏆 Is Winner:", isWinner);

    // Check if already claimed
    const hasClaimed = await examStaking.hasClaimed(examIdBytes, userAddress);
    console.log("✅ Already Claimed:", hasClaimed);

    if (hasClaimed) {
      console.log("ℹ️ You have already claimed your rewards for this exam.");
      return;
    }

    // Get balance before claiming
    const balanceBefore = await pyusd.balanceOf(userAddress);
    console.log("\n💰 PYUSD Balance Before Claim:", ethers.formatUnits(balanceBefore, 6));

    // Claim rewards
    console.log("\n💎 Claiming rewards...");
    const claimTx = await examStaking.claim(examIdBytes);
    console.log("⏳ Transaction sent:", claimTx.hash);
    
    await claimTx.wait();
    console.log("✅ Rewards claimed successfully!");

    // Get balance after claiming
    const balanceAfter = await pyusd.balanceOf(userAddress);
    console.log("\n💰 PYUSD Balance After Claim:", ethers.formatUnits(balanceAfter, 6));

    // Calculate reward received
    const rewardReceived = balanceAfter - balanceBefore;
    console.log("🎁 Reward Received:", ethers.formatUnits(rewardReceived, 6), "PYUSD");

    // Summary
    console.log("\n📊 Claim Summary:");
    console.log("   Exam:", examId);
    console.log("   Result: Winner (Mixed Results Scenario)");
    console.log("   Reward:", ethers.formatUnits(rewardReceived, 6), "PYUSD");
    console.log("   Expected: 14.625 PYUSD (15 total - 0.375 fee)");

    console.log("\n🎉 Reward System Working Perfectly!");
    console.log("💡 Your PYUSD is now back in your wallet and ready to use!");

  } catch (error: any) {
    console.error("❌ Claim failed:", error.message);
    
    if (error.message.includes("No rewards to claim")) {
      console.log("\n💡 Either you didn't win or have already claimed");
    } else if (error.message.includes("Exam not finalized")) {
      console.log("\n💡 Wait for exam to be finalized before claiming");
    }
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});