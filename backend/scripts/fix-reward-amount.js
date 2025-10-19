import mongoose from 'mongoose';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/staked';

async function fixStakeReward() {
  console.log("🔧 Fixing Your Stake Reward Amount");
  console.log("==================================");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Define stake schema
    const stakeSchema = new mongoose.Schema({}, { strict: false });
    const Stake = mongoose.model('Stake', stakeSchema);

    // Your specific stake ID from the database
    const stakeId = "68f4ccec23d8f4a7a41ea542";
    
    // Update your stake with correct reward amount
    const result = await Stake.findByIdAndUpdate(
      stakeId,
      {
        rewardAmount: 1, // You staked 1 PYUSD and passed, so you get 1 PYUSD back
        updatedAt: new Date()
      },
      { new: true }
    );

    if (result) {
      console.log("✅ Stake record updated successfully!");
      console.log("   Stake ID:", result._id);
      console.log("   Stake Amount:", result.stakeAmount);
      console.log("   Reward Amount:", result.rewardAmount);
      console.log("   Is Winner:", result.isWinner);
      console.log("   Is Claimed:", result.isClaimed);
      console.log("   Status:", result.status);
      
      console.log("\n🎉 You can now claim your 1 PYUSD reward!");
      console.log("💡 Next steps:");
      console.log("   1. Go to your student dashboard");
      console.log("   2. Look for a 'Claim Rewards' button");
      console.log("   3. Or use the API: POST /api/exams/claim");
    } else {
      console.log("❌ Stake record not found");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

fixStakeReward().catch(console.error);