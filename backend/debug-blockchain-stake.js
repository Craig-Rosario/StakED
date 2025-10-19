import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ethers } from 'ethers';

dotenv.config();

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const examSchema = new mongoose.Schema({
  name: String,
  blockchainExamId: String,
  rewardsDistributed: Boolean,
  // ... other fields
}, { timestamps: true });

const stakeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  stakeAmount: Number,
  predictedMarks: Number,
  actualMarks: Number,
  isWinner: Boolean,
  isClaimed: Boolean,
  rewardAmount: Number,
  // ... other fields
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username: String,
  walletAddress: String,
  // ... other fields
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);
const Stake = mongoose.model('Stake', stakeSchema);
const User = mongoose.model('User', userSchema);

// Smart contract setup
const CONTRACTS = {
  EXAM_STAKING: '0x183d22182C5190b1E4df90527B05050d026fFce9'
};

// Minimal ABI for the functions we need
const EXAM_ABI = [
  "function getStake(bytes32 examId, address staker) external view returns (uint256 amount, uint256 predictedMarks, bool hasStaked)",
  "function isWinner(bytes32 examId, address staker) external view returns (bool)",
  "function hasClaimed(bytes32 examId, address claimer) external view returns (bool)",
  "function getExamInfo(bytes32 examId) external view returns (bool exists, bool gradingComplete, uint256 totalStaked)"
];

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, provider);

async function debugStakeIssue() {
  await connectDB();
  
  console.log("🔍 DEBUGGING BLOCKCHAIN STAKE ISSUE");
  console.log("=====================================");
  
  try {
    // Find your claimable stake
    const userWallet = '0xd109c14be156e89d0051F77022A974D4170bAaA2';
    const user = await User.findOne({ walletAddress: { $regex: new RegExp(userWallet, 'i') } });
    
    if (!user) {
      console.log("❌ User not found with wallet:", userWallet);
      return;
    }
    
    console.log("👤 Found user:", user.username, "ID:", user._id);
    
    // Find claimable stakes
    const claimableStakes = await Stake.find({
      student: user._id,
      isWinner: true,
      isClaimed: false,
      rewardAmount: { $gt: 0 }
    }).populate('exam').populate('class');
    
    console.log("💰 Found", claimableStakes.length, "claimable stakes");
    
    for (const stake of claimableStakes) {
      console.log("\n🎯 STAKE DETAILS:");
      console.log("   Stake ID:", stake._id);
      console.log("   Exam:", stake.exam.name);
      console.log("   Blockchain Exam ID:", stake.exam.blockchainExamId);
      console.log("   Stake Amount:", stake.stakeAmount, "PYUSD");
      console.log("   Predicted:", stake.predictedMarks);
      console.log("   Actual:", stake.actualMarks);
      console.log("   Reward Amount:", stake.rewardAmount, "PYUSD");
      console.log("   Is Winner:", stake.isWinner);
      console.log("   Is Claimed:", stake.isClaimed);
      
      // Check blockchain state
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(stake.exam.blockchainExamId));
      
      console.log("\n🔗 CHECKING BLOCKCHAIN STATE:");
      console.log("   Exam ID (string):", stake.exam.blockchainExamId);
      console.log("   Exam ID (bytes32):", examIdBytes);
      console.log("   User Wallet:", userWallet);
      console.log("   Contract:", CONTRACTS.EXAM_STAKING);
      
      try {
        // Check if exam exists on blockchain
        const examInfo = await contract.getExamInfo(examIdBytes);
        console.log("   📋 Exam exists on blockchain:", examInfo.exists);
        console.log("   📋 Grading complete:", examInfo.gradingComplete);
        console.log("   📋 Total staked:", ethers.formatUnits(examInfo.totalStaked, 6), "PYUSD");
        
        // Check if user has a stake on blockchain
        const stakeInfo = await contract.getStake(examIdBytes, userWallet);
        console.log("   💵 Has staked on blockchain:", stakeInfo.hasStaked);
        console.log("   💵 Blockchain stake amount:", ethers.formatUnits(stakeInfo.amount, 6), "PYUSD");
        console.log("   💵 Blockchain predicted marks:", stakeInfo.predictedMarks.toString());
        
        // Check if user is winner on blockchain
        const isWinnerOnChain = await contract.isWinner(examIdBytes, userWallet);
        console.log("   🏆 Is winner on blockchain:", isWinnerOnChain);
        
        // Check if already claimed on blockchain
        const hasClaimedOnChain = await contract.hasClaimed(examIdBytes, userWallet);
        console.log("   ✅ Has claimed on blockchain:", hasClaimedOnChain);
        
        // Diagnosis
        console.log("\n🩺 DIAGNOSIS:");
        if (!examInfo.exists) {
          console.log("   ❌ PROBLEM: Exam doesn't exist on blockchain!");
          console.log("   🔧 SOLUTION: The exam was never properly initialized on blockchain");
        } else if (!stakeInfo.hasStaked) {
          console.log("   ❌ PROBLEM: User never staked on blockchain!");
          console.log("   🔧 SOLUTION: The stake was saved to database but never sent to blockchain");
        } else if (!examInfo.gradingComplete) {
          console.log("   ❌ PROBLEM: Exam grading not completed on blockchain!");
          console.log("   🔧 SOLUTION: Grades were saved to database but never submitted to blockchain");
        } else if (!isWinnerOnChain) {
          console.log("   ❌ PROBLEM: User is not marked as winner on blockchain!");
          console.log("   🔧 SOLUTION: Database shows winner but blockchain doesn't");
        } else if (hasClaimedOnChain) {
          console.log("   ❌ PROBLEM: Already claimed on blockchain!");
          console.log("   🔧 SOLUTION: Update database to reflect claimed status");
        } else {
          console.log("   ✅ Everything looks correct on blockchain!");
          console.log("   🤔 The claim should work - there might be a different issue");
        }
        
      } catch (blockchainError) {
        console.log("   ❌ Blockchain query failed:", blockchainError.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    process.exit(0);
  }
}

debugStakeIssue();