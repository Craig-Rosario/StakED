import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🔧 Fixing verifier registration and creating test exam...");
  console.log("User address:", await wallet.getAddress());

  const EXAM_STAKING_ADDRESS = "0xf87A667f85e5CFB406cb5851Ecf6e92Dec7929ad";
  const VERIFIER_REGISTRY_ADDRESS = "0xea9DA664E4282B0ca32C14c154B28850d7b1bf51";
  const STUDENT_REGISTRY_ADDRESS = "0x63bA70B9051dB79F68CFb513f6c7AB633B609476";

  // Register as verifier first
  const verifierABI = ["function addVerifier(address verifier) external"];
  const verifierRegistry = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, verifierABI, wallet);

  console.log("📝 Registering as verifier...");
  try {
    const tx1 = await verifierRegistry.addVerifier(await wallet.getAddress());
    await tx1.wait();
    console.log("✅ Registered as verifier");
  } catch (error: any) {
    console.log("ℹ️ Already registered as verifier or error:", error.message);
  }

  // Register as student too
  const studentABI = ["function registerStudent(address student) external"];
  const studentRegistry = new ethers.Contract(STUDENT_REGISTRY_ADDRESS, studentABI, wallet);

  console.log("📝 Registering as student...");
  try {
    const tx2 = await studentRegistry.registerStudent(await wallet.getAddress());
    await tx2.wait();
    console.log("✅ Registered as student");
  } catch (error: any) {
    console.log("ℹ️ Already registered as student or error:", error.message);
  }

  // Now create the exam
  const examABI = [
    "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)"
  ];

  const examContract = new ethers.Contract(EXAM_STAKING_ADDRESS, examABI, wallet);
  const userAddress = await wallet.getAddress();
  
  // Create exam for 2 students (you + test student)
  const examId = ethers.keccak256(ethers.toUtf8Bytes("two-student-test"));
  const stakeDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week
  
  // Two candidates for testing
  const candidates = [
    userAddress, // Student 1 (you)
    "0xCD4D36e9b762c59C4475C7374924621800188cd9" // Student 2 (test student from env)
  ];

  console.log("🎯 Creating two-student test exam...");
  try {
    const tx3 = await examContract.createExam(
      examId,
      userAddress, // verifier
      candidates,
      stakeDeadline,
      250 // 2.5% fee
    );
    await tx3.wait();
    
    console.log("✅ Two-student exam created successfully!");
    console.log("📋 Exam Details:");
    console.log("   ID: 'two-student-test'");
    console.log("   Candidates:", candidates);
    console.log("   Stake deadline:", new Date(stakeDeadline * 1000));
    
    // Verify exam was created
    const examInfo = await examContract.getExam(examId);
    console.log("\n✅ Verification:");
    console.log("   Verifier:", examInfo.verifier);
    console.log("   Total candidates:", examInfo.candidates.length);
    console.log("   Fee:", examInfo.feeBps / 100, "%");
    
  } catch (error: any) {
    console.error("❌ Failed to create exam:", error.message);
  }

  console.log("\n🎯 Frontend Update Required:");
  console.log("Use exam ID: 'two-student-test'");
  console.log("This exam has 2 students for proper testing");
}

main().catch(console.error);