import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("💎 Quick Claim Your PYUSD Rewards!");
  console.log("==================================");
  
  const examStakingAddress = "0x183d22182C5190b1E4df90527B05050d026fFce9";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  const userAddress = await wallet.getAddress();
  console.log("👤 Your Address:", userAddress);

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function claim(bytes32 examId) external",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)"
  ], wallet);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function balanceOf(address account) external view returns (uint256)"
  ], provider);

  try {
    // Find your exam ID - using the recent exam that was just graded
    // You'll need to replace this with your actual exam ID from the backend
    const recentExamIds = [
      "exam-1729382756527-yizkxf6kh", // Example - replace with your actual exam ID
      "exam-1729382800000-test", // Add more recent exam IDs here
    ];
    
    console.log("\n🔍 Searching for your rewards...");
    
    for (const examIdString of recentExamIds) {
      try {
        const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdString));
        
        // Check if you're a winner
        const isWinner = await examStaking.isWinner(examIdBytes, userAddress);
        const hasClaimed = await examStaking.hasClaimed(examIdBytes, userAddress);
        
        console.log(`\n📋 Exam: ${examIdString}`);
        console.log(`   Winner: ${isWinner}`);
        console.log(`   Already Claimed: ${hasClaimed}`);
        
        if (isWinner && !hasClaimed) {
          console.log("\n💰 Found claimable rewards!");
          
          // Get balance before claiming
          const balanceBefore = await pyusd.balanceOf(userAddress);
          console.log("   Balance Before:", ethers.formatUnits(balanceBefore, 6), "PYUSD");

          // Claim rewards
          console.log("\n💎 Claiming your rewards...");
          const claimTx = await examStaking.claim(examIdBytes);
          console.log("   Transaction sent:", claimTx.hash);
          
          await claimTx.wait();
          console.log("✅ Rewards claimed successfully!");

          // Get balance after claiming
          const balanceAfter = await pyusd.balanceOf(userAddress);
          console.log("   Balance After:", ethers.formatUnits(balanceAfter, 6), "PYUSD");
          
          const rewardReceived = balanceAfter - balanceBefore;
          console.log("🎁 Reward Received:", ethers.formatUnits(rewardReceived, 6), "PYUSD");
          
          console.log("\n🎉 SUCCESS! Your PYUSD is back in your wallet!");
          return;
        }
      } catch (error) {
        // Exam might not exist, continue to next
        continue;
      }
    }
    
    console.log("\n❌ No claimable rewards found in recent exams.");
    console.log("💡 Tips:");
    console.log("   1. Make sure you won the exam (scored >= passing grade)");
    console.log("   2. Check if you already claimed your rewards");
    console.log("   3. Verify the exam was properly graded and finalized");

  } catch (error: any) {
    console.error("❌ Claim failed:", error.message);
    
    if (error.message.includes("No stake to claim")) {
      console.log("\n💡 You might not have any rewards to claim for this exam");
    } else if (error.message.includes("Already claimed")) {
      console.log("\n💡 You have already claimed your rewards");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});