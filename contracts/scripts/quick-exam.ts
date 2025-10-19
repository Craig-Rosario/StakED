import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("Creating test exam for frontend...");

  const EXAM_STAKING_ADDRESS = "0xf87A667f85e5CFB406cb5851Ecf6e92Dec7929ad";
  
  const abi = [
    "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)"
  ];

  const contract = new ethers.Contract(EXAM_STAKING_ADDRESS, abi, wallet);
  const userAddress = await wallet.getAddress();
  
  // Create exam with exact ID that frontend expects
  const examId = ethers.keccak256(ethers.toUtf8Bytes("frontend-test"));
  const stakeDeadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week

  try {
    const tx = await contract.createExam(
      examId,
      userAddress,
      [userAddress],
      stakeDeadline,
      250
    );
    await tx.wait();
    console.log("✅ Test exam created!");
    console.log("Use exam ID 'frontend-test' in your frontend");
  } catch (error: any) {
    console.log("Error:", error.message);
  }
}

main().catch(console.error);