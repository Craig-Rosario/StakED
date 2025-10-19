import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("💰 Making Test Stakes on Two-Student Exam");
  console.log("=========================================");
  
  const examStakingAddress = "0xEe41CA98C7E2f2050127111edf3bac094dE24029";
  const pyusdAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const examId = "two-student-final";
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
  
  const userAddress = await wallet.getAddress();
  const secondStudent = "0xCD4D36e9b762c59C4475C7374924621800188cd9";

  // Contract instances
  const examStaking = new ethers.Contract(examStakingAddress, [
    "function stake(bytes32 examId, address candidate, uint256 amount) external",
    "function getExam(bytes32 examId) external view returns (address, uint64, bool, bool, uint16, uint256, uint256, address[])",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
    "function totalOn(bytes32 examId, address candidate) external view returns (uint256)"
  ], wallet);

  const pyusd = new ethers.Contract(pyusdAddress, [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
  ], wallet);

  try {
    console.log("👤 Staker:", userAddress);
    console.log("🎯 Exam ID:", examId);
    console.log("📚 Candidates:", [userAddress, secondStudent]);

    // Check current balance
    const balance = await pyusd.balanceOf(userAddress);
    console.log("\n💳 Current PYUSD Balance:", ethers.formatUnits(balance, 6));

    // Check current allowance
    const allowance = await pyusd.allowance(userAddress, examStakingAddress);
    console.log("💰 Current Allowance:", ethers.formatUnits(allowance, 6), "PYUSD");

    // Approve PYUSD spending if needed
    const stakeAmount1 = ethers.parseUnits("10", 6); // 10 PYUSD on yourself
    const stakeAmount2 = ethers.parseUnits("5", 6);  // 5 PYUSD on second student
    const totalNeeded = stakeAmount1 + stakeAmount2;

    if (allowance < totalNeeded) {
      console.log("\n🔓 Approving PYUSD spending...");
      const approveTx = await pyusd.approve(examStakingAddress, ethers.parseUnits("100", 6));
      await approveTx.wait();
      console.log("✅ Approval successful!");
    }

    // Make stakes
    console.log("\n📈 Making stakes...");
    
    // Stake 10 PYUSD on yourself
    console.log("   Staking 10 PYUSD on yourself...");
    const stakeTx1 = await examStaking.stake(examIdBytes, userAddress, stakeAmount1);
    await stakeTx1.wait();
    console.log("   ✅ Staked 10 PYUSD on", userAddress.slice(0, 8) + "...");

    // Stake 5 PYUSD on second student
    console.log("   Staking 5 PYUSD on second student...");
    const stakeTx2 = await examStaking.stake(examIdBytes, secondStudent, stakeAmount2);
    await stakeTx2.wait();
    console.log("   ✅ Staked 5 PYUSD on", secondStudent.slice(0, 8) + "...");

    // Check updated stakes
    console.log("\n📊 Updated Staking Status:");
    const userStakeOnSelf = await examStaking.stakeOf(examIdBytes, userAddress, userAddress);
    const userStakeOnOther = await examStaking.stakeOf(examIdBytes, userAddress, secondStudent);
    const totalOnSelf = await examStaking.totalOn(examIdBytes, userAddress);
    const totalOnOther = await examStaking.totalOn(examIdBytes, secondStudent);

    console.log(`   ${userAddress}:`);
    console.log(`     Your stake: ${ethers.formatUnits(userStakeOnSelf, 6)} PYUSD`);
    console.log(`     Total stakes: ${ethers.formatUnits(totalOnSelf, 6)} PYUSD`);
    
    console.log(`   ${secondStudent}:`);
    console.log(`     Your stake: ${ethers.formatUnits(userStakeOnOther, 6)} PYUSD`);
    console.log(`     Total stakes: ${ethers.formatUnits(totalOnOther, 6)} PYUSD`);

    console.log("\n🎯 Next Steps:");
    console.log("   1. Set student scores: npx hardhat run scripts/set-scores.ts --network sepolia");
    console.log("   2. Distribute rewards: npx hardhat run scripts/distribute-rewards.ts --network sepolia");
    console.log("   3. Test frontend staking: Open frontend and try StakeDialog");

    console.log("\n💡 Test Scenarios Available:");
    console.log("   • Everyone wins: Both students score >= passing");
    console.log("   • Nobody wins: Both students score < passing");  
    console.log("   • Mixed results: One passes, one fails");

  } catch (error: any) {
    console.error("❌ Staking failed:", error.message);
    
    if (error.message.includes("insufficient allowance")) {
      console.log("\n💡 Solution: Increase PYUSD allowance for ExamStaking contract");
    } else if (error.message.includes("ERC20: transfer amount exceeds balance")) {
      console.log("\n💡 Solution: Get more PYUSD tokens from faucet");
    }
  }
}

main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});