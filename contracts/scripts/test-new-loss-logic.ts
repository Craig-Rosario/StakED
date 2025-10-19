import { ethers } from "hardhat";

async function main() {
    console.log("Testing new loss distribution logic...");
    
    // Get contract instance
    const contractAddress = "0x183d22182C5190b1E4df90527B05050d026fFce9";
    const examStaking = await ethers.getContractAt("ExamStaking", contractAddress);
    
    // Get signers
    const [deployer, student1, student2] = await ethers.getSigners();
    
    console.log("Contract address:", contractAddress);
    console.log("Staked bank address: 0x6D41680267986408E5e7c175Ee0622cA931859A4");
    
    // Test scenarios:
    console.log("\n=== NEW LOSS DISTRIBUTION LOGIC ===");
    console.log("1. Single participant (win or lose) -> All stakes go to staked bank");
    console.log("2. Everyone wins (multiple participants) -> Everyone gets their stake back");
    console.log("3. Nobody wins -> All stakes go to staked bank (unchanged)");
    console.log("4. Some win, some lose -> Winners get original stake back, losers' stakes go to staked bank");
    
    console.log("\n=== KEY CHANGES ===");
    console.log("- Winners NO LONGER get bonus from losing stakes");
    console.log("- All losing stakes go to staked bank (0x6D41680267986408E5e7c175Ee0622cA931859A4)");
    console.log("- Single participants never get refunds, even if they 'win'");
    
    // Note: To test this properly, we would need to deploy the updated contract
    console.log("\n⚠️  To test these changes:");
    console.log("1. Deploy the updated contract with: npx hardhat run scripts/deploy-updated.ts --network sepolia");
    console.log("2. Update the frontend with the new contract address");
    console.log("3. Create test exams with different scenarios");
    
    console.log("\nContract modification complete! ✅");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });