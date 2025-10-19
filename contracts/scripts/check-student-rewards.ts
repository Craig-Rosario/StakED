import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  console.log("💎 Checking Claimable Rewards for Your Student Wallet");
  console.log("====================================================");
  
  const examStakingAddress = "0x183d22182C5190b1E4df90527B05050d026fFce9";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  // Your actual student wallet address
  const studentAddress = "0xd109c14be156e89d0051F77022A974D4170bAaA2";
  console.log("👤 Student Address:", studentAddress);

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
    "function getExam(bytes32 examId) external view returns (address, uint64, bool, bool, uint16, uint256, uint256, address[])",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)"
  ], provider);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function balanceOf(address account) external view returns (uint256)"
  ], provider);

  try {
    // Check current PYUSD balance
    const currentBalance = await pyusd.balanceOf(studentAddress);
    console.log("💰 Current PYUSD Balance:", ethers.formatUnits(currentBalance, 6));

    // Try different possible exam IDs based on the backend pattern
    const possibleExamIds = [
      // Recent exam pattern: exam-timestamp-randomstring
      "exam-1729382756527-yizkxf6kh",
      "exam-1729382800000-test",
      // Try some variations around the current timestamp
      "exam-1729385000000-test",
      "exam-1729383000000-test"
    ];
    
    console.log("\n🔍 Searching for your staked exams...");
    
    let foundRewards = false;
    
    for (const examIdString of possibleExamIds) {
      try {
        const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdString));
        
        // Get exam info
        const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
          await examStaking.getExam(examIdBytes);
        
        // Check if this exam exists (verifier won't be zero address)
        if (verifier === "0x0000000000000000000000000000000000000000") {
          continue; // Exam doesn't exist
        }
        
        console.log(`\n📋 Found Exam: ${examIdString}`);
        console.log(`   Finalized: ${finalized}`);
        console.log(`   Total Stake: ${ethers.formatUnits(totalStake, 6)} PYUSD`);
        console.log(`   Candidates: ${candidates.length}`);
        
        // Check if you have stakes in this exam
        let hasStakes = false;
        for (const candidate of candidates) {
          const stake = await examStaking.stakeOf(examIdBytes, studentAddress, candidate);
          if (stake > 0) {
            hasStakes = true;
            console.log(`   Your stake on ${candidate}: ${ethers.formatUnits(stake, 6)} PYUSD`);
            
            if (finalized) {
              const isWinner = await examStaking.isWinner(examIdBytes, candidate);
              const hasClaimed = await examStaking.hasClaimed(examIdBytes, studentAddress);
              
              console.log(`   ${candidate} won: ${isWinner}`);
              console.log(`   You claimed: ${hasClaimed}`);
              
              if (isWinner && !hasClaimed) {
                console.log(`\n🎉 FOUND CLAIMABLE REWARDS!`);
                console.log(`   Exam: ${examIdString}`);
                console.log(`   Winner: ${candidate}`);
                console.log(`   Your stake: ${ethers.formatUnits(stake, 6)} PYUSD`);
                console.log(`\n💡 To claim your rewards:`);
                console.log(`   1. Connect your wallet (${studentAddress}) to MetaMask`);
                console.log(`   2. Go to the frontend and look for a "Claim Rewards" button`);
                console.log(`   3. Or use the claim script with your private key`);
                foundRewards = true;
              }
            } else {
              console.log(`   ⏳ Exam not yet finalized`);
            }
          }
        }
        
        if (!hasStakes) {
          console.log(`   ❌ No stakes found for your address`);
        }
        
      } catch (error) {
        // Exam might not exist, continue to next
        continue;
      }
    }
    
    if (!foundRewards) {
      console.log("\n❌ No claimable rewards found.");
      console.log("\n💡 Debugging tips:");
      console.log("   1. Verify you staked on the correct exam");
      console.log("   2. Check if the exam has been finalized by the verifier");
      console.log("   3. Confirm you scored >= passing grade");
      console.log("   4. Make sure you haven't already claimed");
      
      console.log("\n🔍 Let's check for any stakes across all possible recent exams...");
      // Additional debug - check for any stakes at all
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});