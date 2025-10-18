import { ethers } from "ethers"; // <-- ethers v6
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("Deploying with account:", await wallet.getAddress());

  const PYUSD_ADDRESS = process.env.PYUSD_ADDRESS!;
  const TEST_VERIFIER = process.env.TEST_VERIFIER!;
  const TEST_STUDENT = process.env.TEST_STUDENT!;
  const STAKE_AMOUNT = ethers.parseUnits("1", 18); // 1 PYUSD
  const CLASS_ID = 1; // example class/exam ID

  // Load artifacts
  const StudentRegistryArtifact = await hre.artifacts.readArtifact("StudentRegistry");
  const VerifierRegistryArtifact = await hre.artifacts.readArtifact("VerifierRegistry");
  const StakEDManagerArtifact = await hre.artifacts.readArtifact("StakEDManager");

  // Deploy StudentRegistry
  const StudentRegistry = new ethers.ContractFactory(
    StudentRegistryArtifact.abi,
    StudentRegistryArtifact.bytecode,
    wallet
  );
  const studentRegistry = await StudentRegistry.deploy();
  await studentRegistry.waitForDeployment();
  console.log("✅ StudentRegistry deployed at:", studentRegistry.target);

  // Deploy VerifierRegistry
  const VerifierRegistry = new ethers.ContractFactory(
    VerifierRegistryArtifact.abi,
    VerifierRegistryArtifact.bytecode,
    wallet
  );
  const verifierRegistry = await VerifierRegistry.deploy();
  await verifierRegistry.waitForDeployment();
  console.log("✅ VerifierRegistry deployed at:", verifierRegistry.target);

  // Deploy StakEDManager
  const StakEDManager = new ethers.ContractFactory(
    StakEDManagerArtifact.abi,
    StakEDManagerArtifact.bytecode,
    wallet
  );
  const stakedManager = await StakEDManager.deploy(
    PYUSD_ADDRESS,
    studentRegistry.target,
    verifierRegistry.target
  );
  await stakedManager.waitForDeployment();
  console.log("✅ StakEDManager deployed at:", stakedManager.target);

  // Seed test data
  console.log("Seeding test data...");
  await (studentRegistry as any).registerStudent(TEST_STUDENT);
  await (verifierRegistry as any).addVerifier(TEST_VERIFIER);
  console.log("✅ Test data seeded");

  // Approve StakEDManager to spend PYUSD on behalf of student
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  const pyusd = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, wallet);
  await (pyusd as any).approve(stakedManager.target, STAKE_AMOUNT);
  console.log(`✅ Approved 1 PYUSD for staking`);

  // Stake on exam
  await (stakedManager as any).stake(CLASS_ID, STAKE_AMOUNT);
  console.log(`🎉 Staked 1 PYUSD on class/exam ${CLASS_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
