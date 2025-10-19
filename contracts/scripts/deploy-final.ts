import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🚀 Deploying Updated ExamStaking with New Reward Rules");
  console.log("Deployer:", await wallet.getAddress());
  console.log("Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");

  const PYUSD_ADDRESS = process.env.PYUSD_ADDRESS!.trim();
  const TEST_VERIFIER = process.env.TEST_VERIFIER || wallet.address;
  const TEST_STUDENT = process.env.TEST_STUDENT || wallet.address;
  const STAKED_BANK = "0x6D41680267986408E5e7c175Ee0622cA931859A4";

  // Load artifacts
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
  console.log("✅ StudentRegistry:", studentRegistry.target);

  // Deploy VerifierRegistry
  console.log("\n⏳ Deploying VerifierRegistry...");
  const VerifierRegistryFactory = new ethers.ContractFactory(
    VerifierRegistryArtifact.abi,
    VerifierRegistryArtifact.bytecode,
    wallet
  );
  const verifierRegistry = await VerifierRegistryFactory.deploy();
  await verifierRegistry.waitForDeployment();
  console.log("✅ VerifierRegistry:", verifierRegistry.target);

  // Deploy ExamStaking with new reward rules
  console.log("\n⏳ Deploying ExamStaking with New Reward Rules...");
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
  console.log("✅ ExamStaking:", examStaking.target);

  // Register test accounts
  console.log("\n🧩 Setting up test accounts...");
  const deployerAddress = await wallet.getAddress();
  
  // Register deployer and test accounts
  await (await (studentRegistry as any).registerStudent(deployerAddress)).wait();
  await (await (verifierRegistry as any).addVerifier(deployerAddress)).wait();
  
  if (TEST_STUDENT !== deployerAddress) {
    await (await (studentRegistry as any).registerStudent(TEST_STUDENT)).wait();
  }
  if (TEST_VERIFIER !== deployerAddress) {
    await (await (verifierRegistry as any).addVerifier(TEST_VERIFIER)).wait();
  }
  
  console.log("✅ Accounts registered");

  // Create 2-student test exam
  console.log("\n🎯 Creating 2-student test exam...");
  const EXAM_ID = ethers.keccak256(ethers.toUtf8Bytes("two-student-final"));
  const STAKE_DEADLINE = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const FEE_BPS = 250; // 2.5%

  const candidates = [deployerAddress, TEST_STUDENT];

  await (await (examStaking as any).createExam(
    EXAM_ID,
    deployerAddress, // verifier
    candidates,
    STAKE_DEADLINE,
    FEE_BPS
  )).wait();
  
  console.log("✅ Test exam created!");

  // Display final information
  console.log("\n🎉 Deployment Complete!");
  console.log("================================");
  console.log("📋 New Contract Addresses:");
  console.log("   StudentRegistry:", studentRegistry.target);
  console.log("   VerifierRegistry:", verifierRegistry.target);
  console.log("   ExamStaking:", examStaking.target);
  console.log("   PYUSD Token:", PYUSD_ADDRESS);
  console.log("   Staked Bank:", STAKED_BANK);
  
  console.log("\n🎯 Test Exam Created:");
  console.log("   Exam ID: 'two-student-final'");
  console.log("   Candidates:", candidates);
  console.log("   Stake Deadline:", new Date(STAKE_DEADLINE * 1000));
  
  console.log("\n💰 Reward Rules Implemented:");
  console.log("   • Everyone wins → Everyone gets their stake back");
  console.log("   • Nobody wins → All stakes go to Staked Bank");
  console.log("   • Mixed results → Winner takes all (minus 2.5% fee)");
  console.log("   • PYUSD amounts: Whole numbers only (no decimals)");
  
  console.log("\n🔧 Frontend Updates Needed:");
  console.log(`   EXAM_STAKING_ADDRESS: "${examStaking.target}"`);
  console.log(`   Exam ID: "two-student-final"`);
  console.log("================================");
}

main().catch((err) => {
  console.error("❌ Deployment Error:", err);
  process.exit(1);
});