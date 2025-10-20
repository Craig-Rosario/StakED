import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function testPredictionBasedStaking() {
  console.log("🧪 Testing Prediction-Based Staking Contract");
  console.log("=============================================");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  const EXAM_STAKING_ADDRESS = "0x2f0c87aA37B8aa3C390f34BfAF3341a6c067a190";
  
  // Updated ABI with prediction-based logic
  const EXAM_STAKING_ABI = [
    "function stake(bytes32 examId, address candidate, uint256 amount, uint256 predictedScore) external",
    "function getPredictedScore(bytes32 examId, address student) external view returns (uint256)",
    "function getStudentScore(bytes32 examId, address student) external view returns (uint256)",
    "function setStudentScores(bytes32 examId, address[] students, uint256[] scores) external",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)"
  ];

  const examContract = new ethers.Contract(EXAM_STAKING_ADDRESS, EXAM_STAKING_ABI, provider);

  try {
    console.log("📋 Contract Address:", EXAM_STAKING_ADDRESS);
    console.log("👤 Deployer Address:", await wallet.getAddress());
    
    // Test 1: Check if we can call the new function signatures
    console.log("\n🧪 Test 1: Checking contract interface...");
    
    const testExamId = ethers.keccak256(ethers.toUtf8Bytes("test-prediction-exam"));
    
    try {
      // This should work if it's the prediction-based contract
      const predictedScore = await examContract.getPredictedScore(testExamId, wallet.address);
      console.log("✅ getPredictedScore() function exists, predicted score:", predictedScore.toString());
    } catch (error: any) {
      console.log("❌ getPredictedScore() function not found - contract may not be updated");
      console.log("Error:", error.message);
    }

    // Test 2: Check exam info for existing exam
    console.log("\n🧪 Test 2: Checking existing exam...");
    
    const existingExamId = ethers.keccak256(ethers.toUtf8Bytes("prediction-test-exam"));
    
    try {
      const examInfo = await examContract.getExam(existingExamId);
      console.log("✅ Found exam:");
      console.log("  - Verifier:", examInfo[0]);
      console.log("  - Stake Deadline:", new Date(Number(examInfo[1]) * 1000));
      console.log("  - Finalized:", examInfo[2]);
      console.log("  - Candidates:", examInfo[6]);
    } catch (error: any) {
      console.log("❌ No exam found with ID 'prediction-test-exam'");
      console.log("Error:", error.message);
    }

    console.log("\n🎯 RECOMMENDATION:");
    console.log("If getPredictedScore() failed, you need to deploy the updated contract:");
    console.log("Command: npx hardhat run scripts/deploy-prediction-based.ts --network sepolia");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testPredictionBasedStaking().catch(console.error);