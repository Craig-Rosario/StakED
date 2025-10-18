import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);

  const StudentRegistryAddress = "0x5d035D127639bCDD840e9285BcdFd4505CC136EE"; 
  const studentABI = [
    "function registerStudent(address student) external",
    "function isRegistered(address student) view returns (bool)",
  ];

  const studentRegistry = new ethers.Contract(StudentRegistryAddress, studentABI, wallet);

  console.log("Registering:", await wallet.getAddress());
  const tx = await studentRegistry.registerStudent(await wallet.getAddress());
  await tx.wait();

  const isReg = await studentRegistry.isRegistered(await wallet.getAddress());
  console.log("✅ Registration status:", isReg);
}

main().catch(console.error);
