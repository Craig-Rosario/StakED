import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Deploying Updated ExamStaking Contract");
  console.log("=========================================");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
  
  console.log("📋 Configuration:");
  console.log("  - Deployer:", await wallet.getAddress());
  console.log("  - Network: Sepolia");
  console.log("  - Balance:", ethers.formatEther(await provider.getBalance(wallet.address)), "ETH");
  
  // Contract addresses from previous deployment
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const STUDENT_REGISTRY_ADDRESS = "0xda43a6b8f99F804B1455109388DC363443478b90";
  const VERIFIER_REGISTRY_ADDRESS = "0xAAB09f246A15C56370d3Bc2f1F9f8765156E5EB5";
  
  console.log("  - PYUSD:", PYUSD_ADDRESS);
  console.log("  - Student Registry:", STUDENT_REGISTRY_ADDRESS);
  console.log("  - Verifier Registry:", VERIFIER_REGISTRY_ADDRESS);

  // Deploy the updated ExamStaking contract
  console.log("\n📝 Deploying Updated ExamStaking...");
  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");
  const ExamStakingFactory = new ethers.ContractFactory(
    ExamStakingArtifact.abi,
    ExamStakingArtifact.bytecode,
    wallet
  );
  const examStaking = await ExamStakingFactory.deploy(
    PYUSD_ADDRESS,
    VERIFIER_REGISTRY_ADDRESS,
    STUDENT_REGISTRY_ADDRESS
  );
  
  await examStaking.waitForDeployment();
  console.log("✅ Updated ExamStaking deployed at:", examStaking.target);
  
  console.log("\n🎯 Summary:");
  console.log("===========");
  console.log("Updated ExamStaking Address:", examStaking.target);
  console.log("\n📋 Key Changes:");
  console.log("- Any registered verifier can now grade any exam");
  console.log("- Staked bank is only used when nobody wins");
  console.log("- Multiple verifiers can manage the platform");
  
  console.log("\n⚙️ Next Steps:");
  console.log("1. Update backend EXAM_STAKING_ADDRESS to:", examStaking.target);
  console.log("2. Test grading with the new contract");
  console.log("3. The old contract is still deployed but won't be used");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });