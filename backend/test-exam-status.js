import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const EXAM_ABI = [
  "function isStakingOpen(bytes32 examId) view returns (bool)",
  "function getExamInfo(bytes32 examId) view returns (tuple(uint256 stakeDeadline, uint256 commitDeadline, uint256 revealDeadline, bool isActive, address[] candidates))"
];

async function testExamStatus() {
  try {
    console.log('🔍 Testing Blockchain Exam Status');
    console.log('================================');
    
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const examContract = new ethers.Contract(
      process.env.EXAM_STAKING_ADDRESS,
      EXAM_ABI,
      provider
    );

    const examId = "exam-68f4b0928c739d29c836a742-1760866943960";
    console.log('📋 Exam ID:', examId);
    
    // Convert to bytes32
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    console.log('🔗 Exam ID Bytes32:', examIdBytes);
    
    // Check if staking is open
    try {
      const stakingOpen = await examContract.isStakingOpen(examIdBytes);
      console.log('💰 Staking Open:', stakingOpen);
      
      // Get exam info
      const examInfo = await examContract.getExamInfo(examIdBytes);
      console.log('📊 Exam Info:');
      console.log('  - Stake Deadline:', new Date(Number(examInfo.stakeDeadline) * 1000));
      console.log('  - Commit Deadline:', new Date(Number(examInfo.commitDeadline) * 1000));
      console.log('  - Reveal Deadline:', new Date(Number(examInfo.revealDeadline) * 1000));
      console.log('  - Is Active:', examInfo.isActive);
      console.log('  - Candidates:', examInfo.candidates.length);
      
      if (!stakingOpen) {
        console.log('❌ PROBLEM: Staking is closed!');
        console.log('Current time:', new Date());
        console.log('Stake deadline:', new Date(Number(examInfo.stakeDeadline) * 1000));
      } else {
        console.log('✅ Staking is open - students can stake!');
      }
      
    } catch (contractError) {
      console.log('❌ Contract Error:', contractError.message);
      if (contractError.message.includes('Exam not found')) {
        console.log('💡 This means the exam ID doesn\'t exist on the blockchain');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExamStatus();