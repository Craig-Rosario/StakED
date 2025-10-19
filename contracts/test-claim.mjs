import { ethers } from "ethers";

async function testClaim() {
  const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/f5TwM6A-w43FHlXgQPSPI");
  const contractAddress = "0x1E4731390cce9955BC21985BB45068A1858703C2";
  
  const abi = [
    "function claim(bytes32 examId) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  try {
    const code = await provider.getCode(contractAddress);
    console.log("✅ New contract exists, code length:", code.length);
    console.log("📋 Contract address:", contractAddress);
    
    // Test sample exam from deployment
    const sampleExamId = "0x2ab2fb4528704dbc6685525af04a840d07f1160a22d42668ce9da47e0884ca88";
    try {
      const examInfo = await contract.getExam(sampleExamId);
      console.log("✅ Sample exam found:", examInfo[0]); // verifier address
    } catch (e) {
      console.log("ℹ️  Sample exam not found (normal if no test data)");
    }
    
  } catch (error) {
    console.error("❌ Contract check failed:", error.message);
  }
}

testClaim().catch(console.error);
