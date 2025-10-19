const { ethers } = require("ethers");

async function testClaim() {
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/f5TwM6A-w43FHlXgQPSPI");
  const contractAddress = "0x1E4731390cce9955BC21985BB45068A1858703C2";
  
  const abi = [
    "function claim(bytes32 examId) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function distributeRewards(bytes32 examId) external view returns (bool)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Check if contract exists
  try {
    const code = await provider.getCode(contractAddress);
    console.log("✅ Contract exists, code length:", code.length);
    console.log("📋 Contract address:", contractAddress);
  } catch (error) {
    console.error("❌ Contract check failed:", error.message);
  }
}

testClaim().catch(console.error);
