import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("Creating exam with wallet:", await wallet.getAddress());

  const ExamStakingAddress = "0x2203570a2e3c9831d2EEdcbFB5dEC6F23C36fC0A";
  const stakingABI = [
    "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external",
  ];

  const staking = new ethers.Contract(ExamStakingAddress, stakingABI, wallet);

  const examId = ethers.keccak256(ethers.toUtf8Bytes("test-exam-1"));
  const verifier = process.env.TEST_VERIFIER!;
  const candidate = process.env.TEST_STUDENT!;
  const stakeDeadline = Math.floor(Date.now() / 1000) + 3600; 
  const feeBps = 500; 

  console.log("⏳ Creating new exam...");
  const tx = await staking.createExam(examId, verifier, [candidate], stakeDeadline, feeBps);
  await tx.wait();

  console.log(`✅ Exam created! ID: ${examId}`);
}

main().catch(console.error);
