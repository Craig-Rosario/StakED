import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🚀 Deploying Enhanced ExamStaking with PYUSD Integration");
  console.log("Deploying with:", await wallet.getAddress());
  console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");

  const PYUSD_ADDRESS = process.env.PYUSD_ADDRESS!.trim();
  const TEST_VERIFIER = process.env.TEST_VERIFIER || wallet.address;
  const TEST_STUDENT = process.env.TEST_STUDENT || wallet.address;

  // Load contract artifacts
  const StudentRegistryArtifact = await hre.artifacts.readArtifact("StudentRegistry");
  const VerifierRegistryArtifact = await hre.artifacts.readArtifact("VerifierRegistry");
  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");

  // Deploy StudentRegistry
  console.log("\n⏳ Deploying StudentRegistry...");
  const StudentRegistryFactory = new ethers.ContractFactory(
    StudentRegistryArtifact.abi,
    StudentRegistryArtifact.bytecode,
    wallet
  );
  const studentRegistry = await StudentRegistryFactory.deploy();
  await studentRegistry.waitForDeployment();
  console.log("✅ StudentRegistry deployed at:", studentRegistry.target);

  // Deploy VerifierRegistry
  console.log("\n⏳ Deploying VerifierRegistry...");
  const VerifierRegistryFactory = new ethers.ContractFactory(
    VerifierRegistryArtifact.abi,
    VerifierRegistryArtifact.bytecode,
    wallet
  );
  const verifierRegistry = await VerifierRegistryFactory.deploy();
  await verifierRegistry.waitForDeployment();
  console.log("✅ VerifierRegistry deployed at:", verifierRegistry.target);

  // Deploy Enhanced ExamStaking
  console.log("\n⏳ Deploying Enhanced ExamStaking...");
  const ExamStakingFactory = new ethers.ContractFactory(
    ExamStakingArtifact.abi,
    ExamStakingArtifact.bytecode,
    wallet
  );
  const examStaking = await ExamStakingFactory.deploy(
    PYUSD_ADDRESS,
    verifierRegistry.target,
    studentRegistry.target
  );
  await examStaking.waitForDeployment();
  console.log("✅ Enhanced ExamStaking deployed at:", examStaking.target);

  // Register test accounts
  console.log("\n🧩 Registering test accounts...");
  const deployerAddress = await wallet.getAddress();
  
  // Register deployer as both student and verifier
  await (await (studentRegistry as any).registerStudent(deployerAddress)).wait();
  await (await (verifierRegistry as any).addVerifier(deployerAddress)).wait();
  
  // Register test accounts from .env if different
  if (TEST_STUDENT !== deployerAddress) {
    await (await (studentRegistry as any).registerStudent(TEST_STUDENT)).wait();
  }
  if (TEST_VERIFIER !== deployerAddress) {
    await (await (verifierRegistry as any).addVerifier(TEST_VERIFIER)).wait();
  }
  
  console.log("✅ Test accounts registered");

  // Create a sample exam for testing
  const EXAM_ID = ethers.keccak256(ethers.toUtf8Bytes("enhanced-exam-1"));
  const STAKE_DEADLINE = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week from now
  const FEE_BPS = 250; // 2.5% fee

  console.log("\n🧠 Creating sample exam for testing...");
  const candidates = [deployerAddress];
  if (TEST_STUDENT !== deployerAddress) {
    candidates.push(TEST_STUDENT);
  }

  await (await (examStaking as any).createExam(
    EXAM_ID,
    deployerAddress, // verifier
    candidates,
    STAKE_DEADLINE,
    FEE_BPS
  )).wait();
  
  console.log("✅ Sample exam created with ID:", EXAM_ID);
  console.log("   Candidates:", candidates);
  console.log("   Stake deadline:", new Date(STAKE_DEADLINE * 1000));

  // Display deployment summary
  console.log("\n✅ Enhanced PYUSD Staking System Deployed!");
  console.log("=========================================");
  console.log("📍 Contract Addresses:");
  console.log("   StudentRegistry:", studentRegistry.target);
  console.log("   VerifierRegistry:", verifierRegistry.target);
  console.log("   ExamStaking:", examStaking.target);
  console.log("   PYUSD Token:", PYUSD_ADDRESS);
  console.log("\n🎯 Sample Exam:");
  console.log("   ID:", EXAM_ID);
  console.log("   Verifier:", deployerAddress);
  console.log("   Candidates:", candidates.length);
  console.log("\n🚀 Ready for staking! Students can now:");
  console.log("   1. Stake PYUSD on exam outcomes");
  console.log("   2. Stake on individual student performance");
  console.log("   3. Claim rewards after grading");
  console.log("=========================================");

  // Update frontend contract addresses
  console.log("\n📝 Update these addresses in your frontend:");
  console.log(`EXAM_STAKING_ADDRESS: "${examStaking.target}"`);
  console.log(`STUDENT_REGISTRY_ADDRESS: "${studentRegistry.target}"`);
  console.log(`VERIFIER_REGISTRY_ADDRESS: "${verifierRegistry.target}"`);
}

main().catch((err) => {
  console.error("❌ Deployment Error:", err);
  process.exit(1);
});