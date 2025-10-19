import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🧪 Testing Complete Staking Flow with New Reward Rules");
  console.log("====================================================");
  
  const examStakingAddress = "0xEe41CA98C7E2f2050127111edf3bac094dE24029";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const examId = "two-student-final";
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
  
  const userAddress = await wallet.getAddress();
  const secondStudent = "0xCD4D36e9b762c59C4475C7374924621800188cd9"; // From deployment
  const stakedBank = "0x6D41680267986408E5e7c175Ee0622cA931859A4";

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
    "function totalOn(bytes32 examId, address candidate) external view returns (uint256)",
    "function stake(bytes32 examId, address candidate, uint256 amount) external",
    "function setStudentScores(bytes32 examId, address[] students, uint256[] scores, uint256 passingScore) external",
    "function distributeRewards(bytes32 examId) external",
    "function claim(bytes32 examId) external",
    "function getStudentScore(bytes32 examId, address student) external view returns (uint256)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)"
  ], wallet);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ], wallet);

  try {
    // 1. Check exam exists and get info
    console.log("\n📋 Step 1: Checking Exam Info");
    const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
      await examStaking.getExam(examIdBytes);
    
    console.log("✅ Exam found!");
    console.log("   Verifier:", verifier);
    console.log("   Candidates:", candidates);
    console.log("   Stake Deadline:", new Date(Number(stakeDeadline) * 1000));
    console.log("   Fee BPS:", Number(feeBps), "(" + (Number(feeBps) / 100) + "%)");
    console.log("   Finalized:", finalized);

    // 2. Check PYUSD balances
    console.log("\n💰 Step 2: Checking PYUSD Balances");
    const userBalance = await pyusd.balanceOf(userAddress);
    const bankBalance = await pyusd.balanceOf(stakedBank);
    
    console.log("   User Balance:", ethers.formatUnits(userBalance, 6), "PYUSD");
    console.log("   Staked Bank Balance:", ethers.formatUnits(bankBalance, 6), "PYUSD");

    // 3. Check current stakes
    console.log("\n📊 Step 3: Current Staking Status");
    for (const candidate of candidates) {
      const userStake = await examStaking.stakeOf(examIdBytes, userAddress, candidate);
      const totalStakeOnCandidate = await examStaking.totalOn(examIdBytes, candidate);
      
      console.log(`   ${candidate}:`);
      console.log(`     Your stake: ${ethers.formatUnits(userStake, 6)} PYUSD`);
      console.log(`     Total stakes: ${ethers.formatUnits(totalStakeOnCandidate, 6)} PYUSD`);
    }

    // 4. Test different reward scenarios
    console.log("\n🎯 Step 4: Testing Reward Scenarios");
    console.log("Available scenarios:");
    console.log("   1. Everyone wins (both pass) → Everyone gets stake back");
    console.log("   2. Nobody wins (both fail) → All stakes go to Staked Bank");
    console.log("   3. Mixed results (one wins) → Winner takes all");
    console.log("");

    if (!finalized) {
      console.log("⚠️ Exam not yet finalized. You can:");
      console.log("   - Test staking with: npx hardhat run scripts/make-stakes.ts --network sepolia");
      console.log("   - Set scores with: npx hardhat run scripts/set-scores.ts --network sepolia");
      console.log("   - Distribute rewards: npx hardhat run scripts/distribute-rewards.ts --network sepolia");
    } else {
      console.log("✅ Exam is finalized! Checking results...");
      
      // Check scores and winners
      for (const candidate of candidates) {
        const score = await examStaking.getStudentScore(examIdBytes, candidate);
        const isWinner = await examStaking.isWinner(examIdBytes, candidate);
        
        console.log(`   ${candidate}: Score ${score}, Winner: ${isWinner}`);
      }
    }

    console.log("\n🎉 Test completed successfully!");

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    
    if (error.message.includes("Exam not found")) {
      console.log("\n💡 Solution: Run the deployment script to create the exam:");
      console.log("   npx hardhat run scripts/deploy-final.ts --network sepolia");
    }
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});