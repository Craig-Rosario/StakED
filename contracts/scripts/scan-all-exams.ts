import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  
  console.log("🔍 Scanning ALL Recent Blockchain Exams");
  console.log("=====================================");
  
  const examStakingAddress = "0x183d22182C5190b1E4df90527B05050d026fFce9";
  const studentAddress = "0xd109c14be156e89d0051F77022A974D4170bAaA2";
  
  // Contract instance
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)",
    "function getExam(bytes32 examId) external view returns (address, uint64, bool, bool, uint16, uint256, uint256, address[])",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)"
  ], provider);

  // Generate exam IDs around the current time (last 2 hours)
  const now = Math.floor(Date.now());
  const twoHoursAgo = now - (2 * 60 * 60 * 1000);
  
  console.log("👤 Student Address:", studentAddress);
  console.log("⏰ Checking timerange:", new Date(twoHoursAgo), "to", new Date(now));
  
  let foundExam = false;
  
  // Check timestamps around when the exam was likely created
  for (let timestamp = twoHoursAgo; timestamp <= now; timestamp += 60000) { // Every minute
    // Generate exam ID based on the backend pattern: exam-timestamp-randomstring
    const possibleExamIds = [
      `exam-${timestamp}-test`,
      `exam-${timestamp}-abc123`,
      `exam-${timestamp}-xyz789`,
    ];
    
    for (const examIdString of possibleExamIds) {
      try {
        const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdString));
        const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
          await examStaking.getExam(examIdBytes);
        
        // Check if this exam exists
        if (verifier !== "0x0000000000000000000000000000000000000000") {
          console.log(`\n🎯 FOUND EXAM: ${examIdString}`);
          console.log(`   Verifier: ${verifier}`);
          console.log(`   Finalized: ${finalized}`);
          console.log(`   Total Stake: ${ethers.formatUnits(totalStake, 6)} PYUSD`);
          console.log(`   Candidates: ${candidates.length}`);
          
          foundExam = true;
          
          // Check your stakes
          for (const candidate of candidates) {
            const stake = await examStaking.stakeOf(examIdBytes, studentAddress, candidate);
            if (stake > 0) {
              console.log(`   ✅ Your stake on ${candidate}: ${ethers.formatUnits(stake, 6)} PYUSD`);
              
              if (finalized) {
                const isWinner = await examStaking.isWinner(examIdBytes, candidate);
                const hasClaimed = await examStaking.hasClaimed(examIdBytes, studentAddress);
                
                console.log(`   🏆 Winner: ${isWinner}`);
                console.log(`   💰 Claimed: ${hasClaimed}`);
                
                if (isWinner && !hasClaimed) {
                  console.log(`\n🎉 CLAIMABLE REWARDS FOUND!`);
                  console.log(`   Exam ID: ${examIdString}`);
                  console.log(`   Your reward is waiting to be claimed!`);
                  
                  // Since we don't have the private key, provide instructions
                  console.log(`\n💡 To claim your rewards:`);
                  console.log(`   1. Use MetaMask connected to your student wallet`);
                  console.log(`   2. Call contract.claim("${examIdBytes}") on ${examStakingAddress}`);
                  console.log(`   3. Or look for a "Claim Rewards" button in the frontend`);
                  return;
                }
              }
            }
          }
        }
      } catch (error) {
        // Exam doesn't exist, continue
        continue;
      }
    }
  }
  
  if (!foundExam) {
    console.log("\n❌ No recent exams found on blockchain");
    console.log("💡 This could mean:");
    console.log("   1. The exam hasn't been created on blockchain yet");
    console.log("   2. Different exam ID pattern is being used");
    console.log("   3. Exam was created on a different contract");
  }
  
  // Let's also try the exact exam IDs that were in the logs
  console.log("\n🔍 Trying specific exam IDs from backend logs...");
  const knownExamIds = [
    "exam-1729382756527-yizkxf6kh", // From your earlier logs
  ];
  
  for (const examIdString of knownExamIds) {
    try {
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdString));
      const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
        await examStaking.getExam(examIdBytes);
      
      if (verifier !== "0x0000000000000000000000000000000000000000") {
        console.log(`\n📋 FOUND KNOWN EXAM: ${examIdString}`);
        console.log(`   Finalized: ${finalized}`);
        console.log(`   Total Stake: ${ethers.formatUnits(totalStake, 6)} PYUSD`);
        
        // Check your stakes
        for (const candidate of candidates) {
          const stake = await examStaking.stakeOf(examIdBytes, studentAddress, candidate);
          if (stake > 0) {
            console.log(`   Your stake: ${ethers.formatUnits(stake, 6)} PYUSD on ${candidate}`);
            
            if (finalized) {
              const isWinner = await examStaking.isWinner(examIdBytes, candidate);
              const hasClaimed = await examStaking.hasClaimed(examIdBytes, studentAddress);
              console.log(`   Winner: ${isWinner}, Claimed: ${hasClaimed}`);
              
              if (isWinner && !hasClaimed) {
                console.log(`🎉 REWARDS READY TO CLAIM!`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`❌ Exam ${examIdString} not found`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});