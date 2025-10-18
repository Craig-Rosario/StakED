import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY!, provider);
  const walletAddress = await wallet.getAddress();

  console.log("Checking PYUSD balance for wallet:", walletAddress);

  const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function decimals() external view returns (uint8)"
  ];

  const addressesToCheck = [
    "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9", 
    "0x9cb1d88C1dC5b3fBbE1B4445A984347C9f070814", 
    "0x6f14C02Fc1F78322cFd7d707aB90f18baD3B54f5", 
    "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", 
  ];

  for (const address of addressesToCheck) {
    try {
      const token = new ethers.Contract(address, ERC20_ABI, provider);
      
      const [balance, symbol, name, decimals] = await Promise.all([
        token.balanceOf(walletAddress),
        token.symbol().catch(() => "Unknown"),
        token.name().catch(() => "Unknown"), 
        token.decimals().catch(() => 18)
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      console.log(`\nAddress: ${address}`);
      console.log(`Name: ${name}`);
      console.log(`Symbol: ${symbol}`);
      console.log(`Balance: ${formattedBalance}`);
      console.log(`Raw Balance: ${balance.toString()}`);
      
      if (parseFloat(formattedBalance) > 0) {
        console.log("✅ Found balance in this contract!");
      }
    } catch (error) {
      console.log(`\nAddress: ${address}`);
      console.log("❌ Error checking this address:", (error as any).message);
    }
  }
}

main().catch(console.error);