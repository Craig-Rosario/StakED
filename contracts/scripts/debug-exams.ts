import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🔍 Debugging Exam Staking Issue");
  console.log("Connected with:", await wallet.getAddress());

  // Use the current deployed contract address
  const EXAM_STAKING_ADDRESS = "0xf87A667f85e5CFB406cb5851Ecf6e92Dec7929ad";
  const STUDENT_REGISTRY_ADDRESS = "0x63bA70B9051dB79F68CFb513f6c7AB633B609476";
  const VERIFIER_REGISTRY_ADDRESS = "0xea9DA664E4282B0ca32C14c154B28850d7b1bf51";

  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");
  const examStaking = new ethers.Contract(EXAM_STAKING_ADDRESS, ExamStakingArtifact.abi, wallet);

  // Test different exam IDs that might be used
  const testExamIds = [
    "test-exam-1",
    "enhanced-exam-1", 
    "1", // Simple numeric ID
    "exam-1"
  ];

  console.log("\n📋 Checking existing exams...");
  
  for (const examIdString of testExamIds) {
    try {
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdString));
      console.log(`\n🔍 Checking exam: "${examIdString}"`);
      console.log(`   Bytes32 ID: ${examIdBytes}`);
      
      const examInfo = await examStaking.getExam(examIdBytes);
      
      if (examInfo.verifier !== "0x0000000000000000000000000000000000000000") {
        console.log("✅ EXAM FOUND!");
        console.log("   Verifier:", examInfo.verifier);
        console.log("   Stake deadline:", new Date(Number(examInfo.stakeDeadline) * 1000));
        console.log("   Finalized:", examInfo.finalized);
        console.log("   Canceled:", examInfo.canceled);
        console.log("   Total stake:", ethers.formatUnits(examInfo.totalStake, 6), "PYUSD");
        console.log("   Candidates:", examInfo.candidates);
      } else {
        console.log("❌ Exam not found");
      }
    } catch (error: any) {
      console.log("❌ Error checking exam:", error.message);
    }
  }

  // Create a new test exam for frontend testing
  console.log("\n🆕 Creating a new test exam for frontend...");
  
  const TEST_EXAM_ID = "frontend-test-exam";
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(TEST_EXAM_ID));
  const userAddress = await wallet.getAddress();
  const stakeDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week from now
  const feeBps = 250; // 2.5%

  try {
    // Check if user is registered as verifier
    const VerifierRegistryArtifact = await hre.artifacts.readArtifact("VerifierRegistry");
    const verifierRegistry = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VerifierRegistryArtifact.abi, wallet);
    
    const isVerifier = await verifierRegistry.isVerifier(userAddress);
    if (!isVerifier) {
      console.log("🔧 Registering as verifier first...");
      await (await verifierRegistry.addVerifier(userAddress)).wait();
    }

    // Check if user is registered as student
    const StudentRegistryArtifact = await hre.artifacts.readArtifact("StudentRegistry");
    const studentRegistry = new ethers.Contract(STUDENT_REGISTRY_ADDRESS, StudentRegistryArtifact.abi, wallet);
    
    const isStudent = await studentRegistry.isRegistered(userAddress);
    if (!isStudent) {
      console.log("🔧 Registering as student first...");
      await (await studentRegistry.registerStudent(userAddress)).wait();
    }

    // Create the exam
    console.log("🎯 Creating exam with ID:", TEST_EXAM_ID);
    const createTx = await examStaking.createExam(
      examIdBytes,
      userAddress, // verifier
      [userAddress], // candidates (yourself for testing)
      stakeDeadline,
      feeBps
    );
    await createTx.wait();

    console.log("✅ Test exam created successfully!");
    console.log("📱 Use this exam ID in your frontend: '" + TEST_EXAM_ID + "'");
    console.log("🔗 Bytes32 ID:", examIdBytes);
    console.log("⏰ Stake deadline:", new Date(stakeDeadline * 1000));
    
    // Verify the exam was created
    const newExamInfo = await examStaking.getExam(examIdBytes);
    console.log("\n✅ Verification - Exam details:");
    console.log("   Verifier:", newExamInfo.verifier);
    console.log("   Candidates:", newExamInfo.candidates);
    console.log("   Staking open:", await examStaking.isStakingOpen(examIdBytes));

  } catch (error: any) {
    console.error("❌ Failed to create test exam:", error.message);
  }

  console.log("\n🎯 Frontend Integration Notes:");
  console.log("1. Make sure your frontend uses exam ID: 'frontend-test-exam'");
  console.log("2. Update contract addresses in web3Utils.ts:");
  console.log(`   EXAM_STAKING_ADDRESS: "${EXAM_STAKING_ADDRESS}"`);
  console.log("3. Ensure user wallet is registered as both student and verifier");
  console.log("4. Check that PYUSD address matches:", process.env.PYUSD_ADDRESS);
}

main().catch(console.error);