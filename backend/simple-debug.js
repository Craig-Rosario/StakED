import dotenv from 'dotenv';
import { ethers } from 'ethers';
import mongoose from 'mongoose';

dotenv.config();

// Simple stake schema - just for this debug
const stakeSchema = new mongoose.Schema({}, { strict: false });
const Stake = mongoose.model('Stake', stakeSchema);

const examSchema = new mongoose.Schema({}, { strict: false });
const Exam = mongoose.model('Exam', examSchema);

async function debugBlockchainIssue() {
  try {
    console.log('🔍 SIMPLE BLOCKCHAIN DEBUG');
    console.log('==========================');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Find your specific stake
    const yourWallet = '0xd109c14be156e89d0051F77022A974D4170bAaA2';
    console.log(`\n🔎 Looking for stakes by wallet: ${yourWallet}`);
    
    const stakes = await Stake.find({ studentWallet: yourWallet });
    console.log(`📊 Found ${stakes.length} stakes for your wallet:`);
    
    for (const stake of stakes) {
      console.log(`\n📋 Stake ID: ${stake._id}`);
      console.log(`💰 Stake Amount: ${stake.stakeAmount}`);
      console.log(`🎯 Predicted Marks: ${stake.predictedMarks}`);
      console.log(`📝 Actual Marks: ${stake.actualMarks || 'Not graded'}`);
      console.log(`🏆 Is Winner: ${stake.isWinner}`);
      console.log(`💎 Reward Amount: ${stake.rewardAmount}`);
      console.log(`✅ Is Claimed: ${stake.isClaimed}`);
      console.log(`🔗 Blockchain ID: ${stake.blockchainExamId}`);
      console.log(`📅 Created: ${stake.createdAt}`);
      
      if (stake.examId) {
        const exam = await Exam.findById(stake.examId);
        if (exam) {
          console.log(`📚 Exam: ${exam.name}`);
          console.log(`🔗 Exam Blockchain ID: ${exam.blockchainExamId}`);
        }
      }
      console.log('---');
    }

    // Now check the blockchain
    console.log('\n🔗 CHECKING BLOCKCHAIN...');
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const privateKey = process.env.SEPOLIA_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const contractAddress = '0x183d22182C5190b1E4df90527B05050d026fFce9';
    const contractABI = [
      'function getStakes(string examId, address user) view returns (uint256, uint256, bool, bool)',
      'function examExists(string examId) view returns (bool)',
      'function getExamDetails(string examId) view returns (uint256, bool, uint256, uint256, uint256)'
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);
    
    // Check each stake on blockchain
    for (const stake of stakes) {
      if (stake.blockchainExamId) {
        console.log(`\n🔍 Checking blockchain for exam: ${stake.blockchainExamId}`);
        
        try {
          const examExists = await contract.examExists(stake.blockchainExamId);
          console.log(`📋 Exam exists on blockchain: ${examExists}`);
          
          if (examExists) {
            const examDetails = await contract.getExamDetails(stake.blockchainExamId);
            console.log(`📊 Exam Details: totalStaked=${examDetails[0]}, isGraded=${examDetails[1]}, winners=${examDetails[2]}, scenario=${examDetails[3]}, rewardPerWinner=${examDetails[4]}`);
            
            const stakeDetails = await contract.getStakes(stake.blockchainExamId, yourWallet);
            console.log(`💰 Blockchain Stake: amount=${stakeDetails[0]}, prediction=${stakeDetails[1]}, isWinner=${stakeDetails[2]}, claimed=${stakeDetails[3]}`);
          }
        } catch (error) {
          console.log(`❌ Blockchain check failed: ${error.message}`);
        }
      } else {
        console.log(`⚠️  Stake ${stake._id} has no blockchain exam ID`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

debugBlockchainIssue();