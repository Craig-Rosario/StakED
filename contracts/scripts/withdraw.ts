import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("🔄 Attempting to withdraw PYUSD from ExamStaking contract");
  console.log("Wallet:", await wallet.getAddress());

  const EXAM_ID = ethers.keccak256(ethers.toUtf8Bytes("test-exam-1"));
  
  const EXAM_STAKING_ADDRESS = "0x1272B3e63A4309Ac881C09df31EcDf3873708E88"; 
  
  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");
  const examStaking = new ethers.Contract(EXAM_STAKING_ADDRESS, ExamStakingArtifact.abi, wallet);

  console.log("\n📊 Checking exam status...");
  try {
    const examInfo = await examStaking.getExam(EXAM_ID);
    console.log("Exam verifier:", examInfo.verifier);
    console.log("Stake deadline:", new Date(Number(examInfo.stakeDeadline) * 1000));
    console.log("Finalized:", examInfo.finalized);
    console.log("Canceled:", examInfo.canceled);
    console.log("Total stake:", ethers.formatUnits(examInfo.totalStake, 6), "PYUSD");
    
    const userStake = await examStaking.stakeOf(EXAM_ID, await wallet.getAddress(), process.env.TEST_STUDENT);
    console.log("Your stake:", ethers.formatUnits(userStake, 6), "PYUSD");

    if (examInfo.canceled) {
      console.log("\n❌ Exam is canceled - unfortunately this contract doesn't appear to have a refund mechanism");
      console.log("Your PYUSD may be locked until the contract owner implements a refund function");
    } else if (examInfo.finalized) {
      console.log("\n✅ Exam is finalized - checking if you can claim...");
      try {
        const hasClaimed = await examStaking.hasClaimed(EXAM_ID, await wallet.getAddress());
        if (hasClaimed) {
          console.log("✅ You have already claimed your payout");
        } else {
          console.log("🎯 Attempting to claim payout...");
          const claimTx = await examStaking.claim(EXAM_ID);
          await claimTx.wait();
          console.log("🎉 Successfully claimed your payout!");
        }
      } catch (error) {
        console.log("❌ Cannot claim:", (error as any).message);
      }
    } else {
      console.log("\n⏳ Exam is not finalized yet");
      console.log("Options:");
      console.log("1. Wait for the exam to be finalized by the verifier");
      console.log("2. Cancel the exam (only contract owner can do this)");
      
      console.log("\n🛠️ Attempting to cancel exam (as contract owner)...");
      try {
        const cancelTx = await examStaking.cancelExam(EXAM_ID);
        await cancelTx.wait();
        console.log("✅ Exam canceled successfully");
        console.log("⚠️  However, this contract doesn't have a refund mechanism for canceled exams");
      } catch (error) {
        console.log("❌ Cannot cancel exam:", (error as any).message);
        console.log("(This is expected if you're not the contract owner)");
      }
    }

  } catch (error) {
    console.error("❌ Error checking exam:", (error as any).message);
  }
}

main().catch(console.error);