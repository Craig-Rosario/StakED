import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🚀 Deploying with:", await wallet.getAddress());
  console.log("💰 Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");

  const PYUSD_ADDRESS = ethers.getAddress(process.env.PYUSD_ADDRESS!.trim());
  const TEST_VERIFIER = process.env.TEST_VERIFIER || wallet.address;
  const TEST_STUDENT = process.env.TEST_STUDENT || wallet.address;
  const STAKE_AMOUNT = ethers.parseUnits("1", 6); 
  const EXAM_ID = ethers.keccak256(ethers.toUtf8Bytes("test-exam-1"));
  const FEE_BPS = 200;
  const DEADLINE = Math.floor(Date.now() / 1000) + 3600; 

  const StudentRegistryArtifact = await hre.artifacts.readArtifact("StudentRegistry");
  const VerifierRegistryArtifact = await hre.artifacts.readArtifact("VerifierRegistry");
  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");

  console.log("\n⏳ Deploying StudentRegistry...");
  const StudentRegistryFactory = new ethers.ContractFactory(
    StudentRegistryArtifact.abi,
    StudentRegistryArtifact.bytecode,
    wallet
  );
  const studentRegistry = await StudentRegistryFactory.deploy();
  await studentRegistry.waitForDeployment();
  console.log("✅ StudentRegistry deployed at:", studentRegistry.target);

  console.log("\n⏳ Deploying VerifierRegistry...");
  const VerifierRegistryFactory = new ethers.ContractFactory(
    VerifierRegistryArtifact.abi,
    VerifierRegistryArtifact.bytecode,
    wallet
  );
  const verifierRegistry = await VerifierRegistryFactory.deploy();
  await verifierRegistry.waitForDeployment();
  console.log("✅ VerifierRegistry deployed at:", verifierRegistry.target);

  console.log("\n⏳ Deploying ExamStaking...");
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
  console.log("✅ ExamStaking deployed at:", examStaking.target);

  console.log("\n🧩 Registering test verifier and student...");
  await (await (verifierRegistry as any).addVerifier(TEST_VERIFIER)).wait();
  await (await (studentRegistry as any).registerStudent(TEST_STUDENT)).wait();
  const deployerAddress = await wallet.getAddress();
  if (deployerAddress.toLowerCase() !== TEST_STUDENT.toLowerCase()) {
    await (await (studentRegistry as any).registerStudent(deployerAddress)).wait();
    console.log("✅ Registered deployer as student:", deployerAddress);
  }
  console.log("✅ Test accounts registered");

  console.log("\n🧠 Creating test exam...");
  await (await (examStaking as any).createExam(EXAM_ID, TEST_VERIFIER, [TEST_STUDENT], DEADLINE, FEE_BPS)).wait();
  console.log("✅ Test exam created:", EXAM_ID);

  console.log("\n💳 Approving PYUSD...");
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  const pyusd = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, wallet);

  const balance = await pyusd.balanceOf(await wallet.getAddress());
  console.log("🔹 PYUSD balance:", ethers.formatUnits(balance, 6)); 

  if (balance < STAKE_AMOUNT) {
    console.warn("⚠️ Insufficient PYUSD, skipping stake test.");
  } else {
    await (await pyusd.approve(examStaking.target, STAKE_AMOUNT)).wait();

    console.log("\n📈 Performing test stake...");
    try {
      const stakeTx = await (examStaking as any).stake(EXAM_ID, TEST_STUDENT, STAKE_AMOUNT);
      await stakeTx.wait();
      console.log(`🎉 Successfully staked ${ethers.formatUnits(STAKE_AMOUNT, 6)} PYUSD`); 
    } catch (err: any) {
      console.warn("⚠️ Stake failed:", err.message);
    }
  }

  console.log("\n✅ Deployment & setup completed!");
  console.log("-------------------------------------------");
  console.log("StudentRegistry:", studentRegistry.target);
  console.log("VerifierRegistry:", verifierRegistry.target);
  console.log("ExamStaking:", examStaking.target);
  console.log("-------------------------------------------");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
