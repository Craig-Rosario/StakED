import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Simple schema definitions
const stakeSchema = new mongoose.Schema({}, { strict: false });
const Stake = mongoose.model('Stake', stakeSchema);

async function checkAllStakes() {
  try {
    console.log('🔍 CHECKING ALL STAKES IN DATABASE');
    console.log('===================================');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Get ALL stakes
    const allStakes = await Stake.find({}).lean();
    console.log(`📊 Total stakes in database: ${allStakes.length}\n`);

    if (allStakes.length === 0) {
      console.log('❌ NO STAKES FOUND IN DATABASE!');
      console.log('This means the staking process never saved to database.');
      return;
    }

    // Show all stakes with key details
    console.log('📋 ALL STAKES:');
    allStakes.forEach((stake, index) => {
      console.log(`\n--- STAKE ${index + 1} ---`);
      console.log(`ID: ${stake._id}`);
      console.log(`Student: ${stake.student}`);
      console.log(`Exam: ${stake.exam}`);
      console.log(`Wallet: ${stake.walletAddress || 'NOT SET'}`);
      console.log(`Amount: ${stake.stakeAmount}`);
      console.log(`Predicted: ${stake.predictedMarks}`);
      console.log(`Actual: ${stake.actualMarks || 'Not graded'}`);
      console.log(`Winner: ${stake.isWinner}`);
      console.log(`Claimed: ${stake.isClaimed}`);
      console.log(`Reward: ${stake.rewardAmount}`);
      console.log(`Created: ${stake.createdAt}`);
    });

    // Check for your specific wallet
    const yourWallet = '0xd109c14be156e89d0051F77022A974D4170bAaA2';
    const yourStakes = allStakes.filter(stake => 
      stake.walletAddress && 
      stake.walletAddress.toLowerCase() === yourWallet.toLowerCase()
    );

    console.log(`\n🎯 Stakes with your wallet (${yourWallet}): ${yourStakes.length}`);

    // Check for stakes without wallet addresses
    const noWalletStakes = allStakes.filter(stake => !stake.walletAddress);
    console.log(`\n⚠️  Stakes WITHOUT wallet addresses: ${noWalletStakes.length}`);

    if (noWalletStakes.length > 0) {
      console.log('\n📋 Stakes missing wallet addresses:');
      noWalletStakes.forEach((stake, index) => {
        console.log(`${index + 1}. ID: ${stake._id}, Student: ${stake.student}, Amount: ${stake.stakeAmount}`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

checkAllStakes();