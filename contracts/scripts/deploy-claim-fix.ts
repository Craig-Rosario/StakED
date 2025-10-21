import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("🚀 Deploying Fixed ExamStaking Contract");
    console.log("=====================================");
    
    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
    const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
    console.log("📍 Deploying with account:", wallet.address);
    
    // Get current balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    // Contract addresses from .env (existing registries)
    const PYUSD_ADDRESS = process.env.PYUSD_ADDRESS!;
    const VERIFIER_REGISTRY = process.env.VERIFIER_REGISTRY_ADDRESS!;
    const STUDENT_REGISTRY = process.env.STUDENT_REGISTRY_ADDRESS!;
    const OLD_CONTRACT = process.env.EXAM_STAKING_ADDRESS!;
    
    console.log("📋 Using existing registries:");
    console.log("   PYUSD:", PYUSD_ADDRESS);
    console.log("   Verifier Registry:", VERIFIER_REGISTRY);
    console.log("   Student Registry:", STUDENT_REGISTRY);
    console.log("   OLD Contract:", OLD_CONTRACT);
    
    // Load compiled contract
    console.log("\n🔧 Loading ExamStakingFixed artifact...");
    const ExamStakingFixedArtifact = await hre.artifacts.readArtifact("ExamStakingFixed");
    
    // Deploy the fixed contract
    console.log("\n🚀 Deploying ExamStakingFixed...");
    const ExamStakingFixedFactory = new ethers.ContractFactory(
        ExamStakingFixedArtifact.abi,
        ExamStakingFixedArtifact.bytecode,
        wallet
    );
    
    const examStakingFixed = await ExamStakingFixedFactory.deploy(
        PYUSD_ADDRESS,
        VERIFIER_REGISTRY,
        STUDENT_REGISTRY
    );
    
    await examStakingFixed.waitForDeployment();
    const newContractAddress = examStakingFixed.target;
    
    console.log("✅ ExamStakingFixed deployed to:", newContractAddress);
    
    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    console.log("   ✅ Contract deployed successfully at:", newContractAddress);
    console.log("   ✅ Using PYUSD:", PYUSD_ADDRESS);
    console.log("   ✅ Using Verifier Registry:", VERIFIER_REGISTRY);
    console.log("   ✅ Using Student Registry:", STUDENT_REGISTRY);
    
    console.log("\n🎉 Deployment Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📜 OLD CONTRACT:", OLD_CONTRACT);
    console.log("🆕 NEW CONTRACT:", newContractAddress);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("\n🔧 What's Fixed:");
    console.log("   ✅ Removed incorrect 'User is not a winner' check");
    console.log("   ✅ Now allows claiming if you staked on ANY winner");
    console.log("   ✅ Mixed results (win some, lose some) now work");
    console.log("   ✅ Peer staking rewards now claimable");
    
    console.log("\n📝 Next Steps:");
    console.log("   1. Update .env files with new contract address");
    console.log("   2. Update frontend web3Utils.ts");
    console.log("   3. Update backend controller");
    console.log("   4. Test claiming with your mixed stakes!");
    
    console.log("\n🔗 Contract Verification Command:");
    console.log(`npx hardhat verify --network sepolia ${newContractAddress} "${PYUSD_ADDRESS}" "${VERIFIER_REGISTRY}" "${STUDENT_REGISTRY}"`);
    
    return {
        oldAddress: OLD_CONTRACT,
        newAddress: newContractAddress,
        deployer: wallet.address
    };
}

main()
    .then((result) => {
        console.log("\n🎯 Deployment completed successfully!");
        console.log("New contract address:", result.newAddress);
        console.log("\n⚠️  IMPORTANT: Update all .env files with the new address!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });