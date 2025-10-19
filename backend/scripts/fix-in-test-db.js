import mongoose from 'mongoose';

async function fixInTestDatabase() {
  console.log("🔧 Fixing Your Stake in TEST Database");
  console.log("=====================================");
  
  try {
    // Connect to the TEST database (as shown in your MongoDB Compass)
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log("✅ Connected to TEST database");

    // Access the stakes collection directly
    const stakesCollection = mongoose.connection.db.collection('stakes');
    
    // Count documents
    const count = await stakesCollection.countDocuments();
    console.log(`📊 Found ${count} documents in stakes collection`);
    
    if (count > 0) {
      // Find your specific stake by ID
      const objectId = new mongoose.Types.ObjectId("68f4ccec23d8f4a7a41ea542");
      const yourStake = await stakesCollection.findOne({ _id: objectId });
      
      if (yourStake) {
        console.log("🎉 FOUND YOUR STAKE!");
        console.log("   ID:", yourStake._id);
        console.log("   Wallet:", yourStake.candidateAddress);
        console.log("   Stake Amount:", yourStake.stakeAmount);
        console.log("   Predicted Marks:", yourStake.predictedMarks);
        console.log("   Actual Score:", yourStake.actualScore);
        console.log("   Is Winner:", yourStake.isWinner);
        console.log("   Current Reward Amount:", yourStake.rewardAmount);
        console.log("   Is Claimed:", yourStake.isClaimed);
        
        // Update the reward amount to 1 PYUSD
        const result = await stakesCollection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              rewardAmount: 1,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          console.log("\n✅ SUCCESSFULLY UPDATED!");
          console.log("   Reward amount changed from", yourStake.rewardAmount, "to 1 PYUSD");
          
          // Verify the update
          const verified = await stakesCollection.findOne({ _id: objectId });
          console.log("✅ Verified - New reward amount:", verified.rewardAmount);
          
          console.log("\n🎉 PERFECT! Your stake is now ready:");
          console.log(`   💰 You staked: ${verified.stakeAmount} PYUSD`);
          console.log(`   🎯 You predicted: ${verified.predictedMarks} marks`);
          console.log(`   📊 You scored: ${verified.actualScore} marks`);
          console.log(`   🏆 You are a winner: ${verified.isWinner}`);
          console.log(`   💎 You will receive: ${verified.rewardAmount} PYUSD`);
          console.log(`   💸 Already claimed: ${verified.isClaimed}`);
          
          console.log("\n💡 Next steps:");
          console.log("   1. Log in to your student account in the frontend");
          console.log("   2. Look for a 'Claim Rewards' button in your dashboard");
          console.log("   3. Click it to get your 1 PYUSD back!");
          
        } else {
          console.log("❌ Failed to update the stake");
        }
        
      } else {
        console.log("❌ Your specific stake ID not found");
        
        // Try to find by wallet address
        const byWallet = await stakesCollection.findOne({ 
          candidateAddress: "0xd109c14be156e89d0051f77022a974d4170baaa2" 
        });
        
        if (byWallet) {
          console.log("✅ Found by wallet address!");
          console.log("   Stake ID:", byWallet._id);
          
          const result = await stakesCollection.updateOne(
            { _id: byWallet._id },
            { 
              $set: { 
                rewardAmount: 1,
                updatedAt: new Date()
              }
            }
          );
          
          if (result.modifiedCount > 0) {
            console.log("✅ FIXED! Reward amount set to 1 PYUSD");
          }
        }
      }
      
      // Show some sample documents for debugging
      console.log("\n📋 Sample stakes in the collection:");
      const samples = await stakesCollection.find({}).limit(3).toArray();
      samples.forEach((stake, i) => {
        console.log(`   ${i + 1}. ID: ${stake._id.toString().substring(0, 8)}...`);
        console.log(`      Wallet: ${stake.candidateAddress}`);
        console.log(`      Amount: ${stake.stakeAmount} PYUSD`);
        console.log(`      Winner: ${stake.isWinner}`);
        console.log(`      Reward: ${stake.rewardAmount}`);
      });
      
    } else {
      console.log("❌ No documents found in stakes collection");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

fixInTestDatabase().catch(console.error);