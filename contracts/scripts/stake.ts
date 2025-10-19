import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  console.log("Using wallet:", await wallet.getAddress());

  const ExamStakingAddress = "0x1E4731390cce9955BC21985BB45068A1858703C2"; 
  const PYUSD_ADDRESS = process.env.PYUSD_ADDRESS!;

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  const examABI = [
    "function stake(bytes32 examId, address candidate, uint256 amount) external"
  ];

  const pyusd = new ethers.Contract(PYUSD_ADDRESS, ERC20_ABI, wallet);
  const staking = new ethers.Contract(ExamStakingAddress, examABI, wallet);

  const examId = ethers.keccak256(ethers.toUtf8Bytes("test-exam-1"));
  const candidate = process.env.TEST_STUDENT || "0x6D41680267986408E5e7c175Ee0622cA931859A4"; // Default to main wallet
  const amount = ethers.parseUnits("1", 6); // 1 PYUSD (6 decimals) 

  console.log("Approving ExamStaking contract...");
  await (await pyusd.approve(ExamStakingAddress, amount)).wait();
  console.log("✅ Approved 1 PYUSD");

  console.log("Staking 1 PYUSD for exam:", examId);
  const tx = await staking.stake(examId, candidate, amount);
  await tx.wait();
  console.log("🎉 Stake successful! Tx hash:", tx.hash);
}

main().catch(console.error);
