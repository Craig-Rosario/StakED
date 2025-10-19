import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("📊 Setting Student Scores and Testing Reward Distribution");
  console.log("========================================================");
  
  const examStakingAddress = "0xEe41CA98C7E2f2050127111edf3bac094dE24029";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const examId = "two-student-final";
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
  
  const userAddress = await wallet.getAddress();
  const secondStudent = "0xCD4D36e9b762c59C4475C7374924621800188cd9";
  const stakedBank = "0x6D41680267986408E5e7c175Ee0622cA931859A4";

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function setStudentScores(bytes32 examId, address[] students, uint256[] scores, uint256 passingScore) external",
    "function distributeRewards(bytes32 examId) external",
    "function getStudentScore(bytes32 examId, address student) external view returns (uint256)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function getExam(bytes32 examId) external view returns (address, uint64, bool, bool, uint16, uint256, uint256, address[])",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
    "function totalOn(bytes32 examId, address candidate) external view returns (uint256)"
  ], wallet);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function balanceOf(address account) external view returns (uint256)"
  ], provider);

  try {
    console.log("👤 Verifier:", userAddress);
    console.log("🎯 Exam ID:", examId);

    // Get current stakes before reward distribution
    console.log("\n📊 Current Stakes:");
    const stakeOnSelf = await examStaking.totalOn(examIdBytes, userAddress);
    const stakeOnOther = await examStaking.totalOn(examIdBytes, secondStudent);
    console.log("   Stakes on", userAddress.slice(0, 8) + "...:", ethers.formatUnits(stakeOnSelf, 6), "PYUSD");
    console.log("   Stakes on", secondStudent.slice(0, 8) + "...:", ethers.formatUnits(stakeOnOther, 6), "PYUSD");

    // Get initial balances
    const initialUserBalance = await pyusd.balanceOf(userAddress);
    const initialBankBalance = await pyusd.balanceOf(stakedBank);
    console.log("\n💰 Initial Balances:");
    console.log("   User:", ethers.formatUnits(initialUserBalance, 6), "PYUSD");
    console.log("   Staked Bank:", ethers.formatUnits(initialBankBalance, 6), "PYUSD");

    // Choose test scenario
    console.log("\n🎯 Choose Test Scenario:");
    console.log("   1. Everyone wins (both pass) → Everyone gets stake back");
    console.log("   2. Nobody wins (both fail) → All stakes go to Staked Bank");  
    console.log("   3. Mixed results (one wins) → Winner takes all");
    console.log("\n   Testing Scenario 3: Mixed Results (You win, Other fails)");

    // Scenario 3: Mixed Results - You pass (85), Other fails (45), passing score = 70
    const students = [userAddress, secondStudent];
    const scores = [85, 45]; // You pass, other fails
    const passingScore = 70;

    console.log("\n📝 Setting Scores:");
    console.log("   " + userAddress.slice(0, 8) + "... : Score 85 (PASS)");
    console.log("   " + secondStudent.slice(0, 8) + "... : Score 45 (FAIL)"); 
    console.log("   Passing Score: 70");

    // Set scores
    console.log("\n⏳ Setting student scores...");
    const setScoresTx = await examStaking.setStudentScores(examIdBytes, students, scores, passingScore);
    await setScoresTx.wait();
    console.log("✅ Scores set successfully!");

    // Verify scores
    console.log("\n🔍 Verifying Scores:");
    for (let i = 0; i < students.length; i++) {
      const score = await examStaking.getStudentScore(examIdBytes, students[i]);
      const isWinner = await examStaking.isWinner(examIdBytes, students[i]);
      console.log("   " + students[i].slice(0, 8) + "...: Score", score.toString(), "Winner:", isWinner);
    }

    // Distribute rewards
    console.log("\n💎 Distributing rewards...");
    const distributeTx = await examStaking.distributeRewards(examIdBytes);
    await distributeTx.wait();
    console.log("✅ Rewards distributed!");

    // Check final balances
    const finalUserBalance = await pyusd.balanceOf(userAddress);
    const finalBankBalance = await pyusd.balanceOf(stakedBank);
    
    console.log("\n💰 Final Balances:");
    console.log("   User:", ethers.formatUnits(finalUserBalance, 6), "PYUSD");
    console.log("   Staked Bank:", ethers.formatUnits(finalBankBalance, 6), "PYUSD");

    // Calculate changes
    const userChange = finalUserBalance - initialUserBalance;
    const bankChange = finalBankBalance - initialBankBalance;
    
    console.log("\n📈 Balance Changes:");
    console.log("   User change:", ethers.formatUnits(userChange, 6), "PYUSD");
    console.log("   Bank change:", ethers.formatUnits(bankChange, 6), "PYUSD");

    // Explain the math
    const totalStaked = 15; // 10 + 5 PYUSD
    const fee = totalStaked * 0.025; // 2.5% fee
    const winnerReward = totalStaked - fee;
    
    console.log("\n🧮 Reward Mathematics (Mixed Results):");
    console.log("   Total Staked: 15.0 PYUSD");
    console.log("   Protocol Fee (2.5%):", fee.toFixed(3), "PYUSD");
    console.log("   Winner Reward:", winnerReward.toFixed(3), "PYUSD");
    console.log("   Expected User Gain:", (winnerReward - 15).toFixed(3), "PYUSD"); // Winner takes all minus what they staked

    console.log("\n🎉 Test Completed Successfully!");
    console.log("\n💡 To test other scenarios, modify the scores array:");
    console.log("   • Everyone wins: [85, 85] with passing score 70");
    console.log("   • Nobody wins: [45, 45] with passing score 70");

  } catch (error: any) {
    console.error("❌ Score setting failed:", error.message);
    
    if (error.message.includes("Not authorized verifier")) {
      console.log("\n💡 Only the exam verifier can set scores");
    } else if (error.message.includes("Exam already finalized")) {
      console.log("\n💡 Exam has already been finalized");
    }
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});