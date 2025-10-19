import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying Fixed ExamStaking Contract");
  console.log("=====================================");
  console.log("Network:", hre.network.name);

  // Contract addresses for dependencies
  const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
  const VERIFIER_REGISTRY = "0xb079ca589DAd234cBF3A9Ae8e82E4132c0E20CF7";
  const STUDENT_REGISTRY = "0x0fd1373be62e1E197268aaFd505201db41d102Bd";

  try {
    // Get contract factory
    const ExamStaking = await hre.ethers.getContractFactory("ExamStaking");
    
    console.log("\n📋 Constructor Parameters:");
    console.log("  PYUSD:", PYUSD_ADDRESS);
    console.log("  Verifier Registry:", VERIFIER_REGISTRY);
    console.log("  Student Registry:", STUDENT_REGISTRY);

    console.log("\n⏳ Deploying contract...");
    const examStaking = await ExamStaking.deploy(
      PYUSD_ADDRESS,
      VERIFIER_REGISTRY,
      STUDENT_REGISTRY
    );

    console.log("🔗 Deployment transaction:", examStaking.deploymentTransaction()?.hash);
    console.log("⏳ Waiting for deployment confirmation...");

    await examStaking.waitForDeployment();
    
    const contractAddress = await examStaking.getAddress();
    
    console.log("\n✅ ExamStaking Contract Deployed Successfully!");
    console.log("📋 Contract Address:", contractAddress);
    
    console.log("\n🔧 Key Changes in This Version:");
    console.log("  ✅ Single participants can claim when they win");
    console.log("  ✅ Single participants lose stake when they fail");
    console.log("  ✅ Multi-participant logic unchanged");
    
    console.log("\n🚨 IMPORTANT: Update Environment Variables");
    console.log("===========================================");
    console.log("Backend .env:");
    console.log(`EXAM_STAKING_ADDRESS=${contractAddress}`);
    console.log("\nFrontend .env:");
    console.log(`VITE_EXAM_STAKING_ADDRESS=${contractAddress}`);
    
    console.log("\n📝 Contract Verification:");
    console.log(`npx hardhat verify --network sepolia ${contractAddress} "${PYUSD_ADDRESS}" "${VERIFIER_REGISTRY}" "${STUDENT_REGISTRY}"`);

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});