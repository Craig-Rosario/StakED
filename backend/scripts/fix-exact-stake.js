import mongoose from 'mongoose';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/staked';

async function fixYourStake() {
  console.log("🔧 Fixing Your Exact Stake");
  console.log("===========================");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Define stake schema
    const stakeSchema = new mongoose.Schema({}, { strict: false });
    const Stake = mongoose.model('Stake', stakeSchema);

    // Use the exact ID from your database
    const stakeId = "68f4ccec23d8f4a7a41ea542";
    
    console.log("🎯 Updating stake with ID:", stakeId);
    
    // Update the specific stake with correct reward amount
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
      console.log("   Candidate Address:", result.candidateAddress);
      console.log("   Stake Amount:", result.stakeAmount);
      console.log("   Predicted Marks:", result.predictedMarks);
      console.log("   Actual Score:", result.actualScore);
      console.log("   Is Winner:", result.isWinner);
      console.log("   Reward Amount:", result.rewardAmount);
      console.log("   Is Claimed:", result.isClaimed);
      console.log("   Status:", result.status);
      
      console.log("\n🎉 SUCCESS! Your stake now shows:");
      console.log(`   💰 You will receive ${result.rewardAmount} PYUSD when you claim`);
      console.log("\n💡 Next steps to get your PYUSD:");
      console.log("   1. You can now claim your reward through the frontend");
      console.log("   2. Or use the API: POST /api/exams/claim");
      console.log("   3. Make sure you're logged in as the student who staked");
      
    } else {
      console.log("❌ Stake record not found with that exact ID");
      console.log("Let me search for it by the exact wallet address...");
      
      // Try searching with the exact address from your DB
      const exactAddress = "0xd109c14be156e89d0051f77022a974d4170baaa2";
      const stakes = await Stake.find({ candidateAddress: exactAddress });
      
      console.log(`Found ${stakes.length} stakes with exact address: ${exactAddress}`);
      if (stakes.length > 0) {
        const stake = stakes[0];
        console.log("Found your stake! Updating it now...");
        
        const updated = await Stake.findByIdAndUpdate(
          stake._id,
          { rewardAmount: 1 },
          { new: true }
        );
        
        console.log("✅ Updated! Reward amount:", updated.rewardAmount);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

fixYourStake().catch(console.error);