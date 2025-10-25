import mongoose from 'mongoose';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/staked';

async function findAndFixStake() {
  console.log("🔍 Finding and Fixing Your Stake");
  console.log("=================================");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Define stake schema
    const stakeSchema = new mongoose.Schema({}, { strict: false });
    const Stake = mongoose.model('Stake', stakeSchema);

    // Your wallet address
    const walletAddress = "0xd109c14be156e89d0051F77022A974D4170bAaA2";
    
    console.log("🎯 Searching for stakes with your wallet address:", walletAddress);
    
    // Find stakes by wallet address (case insensitive)
    const stakes = await Stake.find({
      candidateAddress: { $regex: new RegExp(walletAddress, 'i') }
    });
    
    console.log(`📊 Found ${stakes.length} stakes for your wallet\n`);
    
    for (let i = 0; i < stakes.length; i++) {
      const stake = stakes[i];
      console.log(`📋 Stake ${i + 1}:`);
      console.log(`   ID: ${stake._id}`);
      console.log(`   Amount: ${stake.stakeAmount} PYUSD`);
      console.log(`   Predicted: ${stake.predictedMarks} marks`);
      console.log(`   Actual Score: ${stake.actualScore} marks`);
      console.log(`   Is Winner: ${stake.isWinner}`);
      console.log(`   Reward Amount: ${stake.rewardAmount}`);
      console.log(`   Is Claimed: ${stake.isClaimed}`);
      console.log(`   Status: ${stake.status}`);
      
      // Fix the reward amount if it's a winner but reward is 0
      if (stake.isWinner && stake.rewardAmount === 0) {
        console.log(`   🔧 FIXING: Setting reward amount to ${stake.stakeAmount} PYUSD`);
        
        const updatedStake = await Stake.findByIdAndUpdate(
          stake._id,
          {
            rewardAmount: stake.stakeAmount,
            updatedAt: new Date()
          },
          { new: true }
        );
        
        console.log(`   ✅ FIXED: Reward amount updated to ${updatedStake.rewardAmount} PYUSD`);
      }
      
      console.log('');
    }
    
    if (stakes.length === 0) {
      console.log("❌ No stakes found for your wallet address");
      console.log("💡 Let's search for any recent stakes...");
      
      // Get all recent stakes
      const recentStakes = await Stake.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }).limit(10);
      
      console.log(`\n📊 Recent stakes (last 24 hours): ${recentStakes.length}`);
      recentStakes.forEach((stake, i) => {
        console.log(`   ${i + 1}. Address: ${stake.candidateAddress}, Amount: ${stake.stakeAmount}, Winner: ${stake.isWinner}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

findAndFixStake().catch(console.error);