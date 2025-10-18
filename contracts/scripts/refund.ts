import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("💰 Getting your PYUSD back from ExamStaking contract");
  console.log("Wallet:", await wallet.getAddress());

  const EXAM_ID = ethers.keccak256(ethers.toUtf8Bytes("test-exam-1"));
  const TEST_STUDENT = process.env.TEST_STUDENT || await wallet.getAddress();
  
  const EXAM_STAKING_ADDRESS = "0xf87A667f85e5CFB406cb5851Ecf6e92Dec7929ad";
  
  const ExamStakingArtifact = await hre.artifacts.readArtifact("ExamStaking");
  const examStaking = new ethers.Contract(EXAM_STAKING_ADDRESS, ExamStakingArtifact.abi, wallet);

  console.log("\n📊 Checking current status...");
  try {
    const examInfo = await examStaking.getExam(EXAM_ID);
    console.log("Finalized:", examInfo.finalized);
    console.log("Canceled:", examInfo.canceled);
    console.log("Total stake:", ethers.formatUnits(examInfo.totalStake, 6), "PYUSD");
    
    const userStake = await examStaking.stakeOf(EXAM_ID, await wallet.getAddress(), TEST_STUDENT);
    console.log("Your stake:", ethers.formatUnits(userStake, 6), "PYUSD");

    if (userStake > 0) {
      if (examInfo.canceled) {
        console.log("\n🔄 Exam is canceled - attempting refund...");
        try {
          const refundTx = await examStaking.refund(EXAM_ID, TEST_STUDENT);
          await refundTx.wait();
          console.log("🎉 Successfully refunded your PYUSD!");
        } catch (error) {
          console.log("❌ Refund failed:", (error as any).message);
        }
      } else {
        console.log("\n⏳ Exam is not canceled yet. Canceling it first...");
        try {
          const cancelTx = await examStaking.cancelExam(EXAM_ID);
          await cancelTx.wait();
          console.log("✅ Exam canceled");
          
          console.log("\n🔄 Now attempting refund...");
          const refundTx = await examStaking.refund(EXAM_ID, TEST_STUDENT);
          await refundTx.wait();
          console.log("🎉 Successfully refunded your PYUSD!");
        } catch (error) {
          console.log("❌ Cancel/refund failed:", (error as any).message);
        }
      }
    } else {
      console.log("❌ No stake found to refund");
    }

    console.log("\n💳 Checking your PYUSD balance...");
    const PYUSD_ADDRESS = ethers.getAddress(process.env.PYUSD_ADDRESS!.trim());
    const ERC20_ABI = ["function balanceOf(address account) external view returns (uint256)"];
    const pyusd = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, provider);
    const balance = await pyusd.balanceOf(await wallet.getAddress());
    console.log("🔹 Current PYUSD balance:", ethers.formatUnits(balance, 6));

  } catch (error) {
    console.error("❌ Error:", (error as any).message);
  }
}

main().catch(console.error);