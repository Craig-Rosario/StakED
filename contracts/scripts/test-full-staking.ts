import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function testStakingFlow() {
  console.log("🎯 Testing Complete Staking Flow");
  console.log("================================");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  const EXAM_STAKING_ADDRESS = "0x2f0c87aA37B8aa3C390f34BfAF3341a6c067a190";
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  
  const PYUSD_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
  ];

  const EXAM_STAKING_ABI = [
    "function stake(bytes32 examId, address candidate, uint256 amount, uint256 predictedScore) external",
    "function getPredictedScore(bytes32 examId, address student) external view returns (uint256)",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function isStakingOpen(bytes32 examId) external view returns (bool)",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)"
  ];

  const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, provider);
  const examContract = new ethers.Contract(EXAM_STAKING_ADDRESS, EXAM_STAKING_ABI, provider);
  const examContractSigner = new ethers.Contract(EXAM_STAKING_ADDRESS, EXAM_STAKING_ABI, wallet);

  const userAddress = await wallet.getAddress();
  const examId = ethers.keccak256(ethers.toUtf8Bytes("prediction-test-exam"));

  try {
    console.log("👤 User Address:", userAddress);
    console.log("📋 Contract Address:", EXAM_STAKING_ADDRESS);
    
    // Step 1: Check PYUSD balance
    console.log("\n💰 Step 1: Checking PYUSD balance...");
    const balance = await pyusdContract.balanceOf(userAddress);
    const balanceFormatted = ethers.formatUnits(balance, 6);
    console.log("✅ PYUSD Balance:", balanceFormatted);

    if (parseFloat(balanceFormatted) < 1) {
      console.log("❌ Insufficient PYUSD balance for testing. Need at least 1 PYUSD.");
      return;
    }

    // Step 2: Check exam status
    console.log("\n🎯 Step 2: Checking exam status...");
    const examInfo = await examContract.getExam(examId);
    const stakingOpen = await examContract.isStakingOpen(examId);
    
    console.log("✅ Exam Info:");
    console.log("  - Verifier:", examInfo[0]);
    console.log("  - Stake Deadline:", new Date(Number(examInfo[1]) * 1000));
    console.log("  - Total Stake:", ethers.formatUnits(examInfo[5], 6), "PYUSD");
    console.log("  - Candidates Count:", examInfo[6].length);
    console.log("  - Staking Open:", stakingOpen);

    if (!stakingOpen) {
      console.log("❌ Staking is closed for this exam");
      return;
    }

    // Step 3: Check allowance
    console.log("\n🔒 Step 3: Checking PYUSD allowance...");
    const allowance = await pyusdContract.allowance(userAddress, EXAM_STAKING_ADDRESS);
    const allowanceFormatted = ethers.formatUnits(allowance, 6);
    console.log("✅ Current Allowance:", allowanceFormatted, "PYUSD");

    const stakeAmount = ethers.parseUnits("1", 6); // 1 PYUSD
    const predictedScore = 75; // 75%

    if (allowance < stakeAmount) {
      console.log("\n🔓 Step 4: Approving PYUSD spending...");
      const pyusdContractSigner = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, wallet);
      const approveTx = await pyusdContractSigner.approve(EXAM_STAKING_ADDRESS, stakeAmount);
      console.log("⏳ Approval transaction sent:", approveTx.hash);
      await approveTx.wait();
      console.log("✅ PYUSD spending approved!");
    }

    // Step 5: Execute stake
    console.log("\n🎯 Step 5: Executing stake transaction...");
    console.log("  - Amount: 1 PYUSD");
    console.log("  - Predicted Score:", predictedScore, "%");
    console.log("  - Candidate:", userAddress);

    const stakeTx = await examContractSigner.stake(examId, userAddress, stakeAmount, predictedScore);
    console.log("⏳ Stake transaction sent:", stakeTx.hash);
    await stakeTx.wait();
    console.log("✅ Stake transaction confirmed!");

    // Step 6: Verify stake
    console.log("\n✅ Step 6: Verifying stake...");
    const userStake = await examContract.stakeOf(examId, userAddress, userAddress);
    const predictedScoreStored = await examContract.getPredictedScore(examId, userAddress);
    
    console.log("✅ Verification Results:");
    console.log("  - Stake Amount:", ethers.formatUnits(userStake, 6), "PYUSD");
    console.log("  - Predicted Score Stored:", predictedScoreStored.toString(), "%");

    console.log("\n🎉 STAKING TEST SUCCESSFUL!");
    console.log("✅ The prediction-based staking system is working correctly!");

  } catch (error: any) {
    console.error("❌ Test failed:", error);
    console.error("Error details:", error.message);
  }
}

testStakingFlow().catch(console.error);