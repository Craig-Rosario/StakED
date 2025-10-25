import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixAtlasStake() {
  console.log("🔧 Fixing Your Stake in MongoDB Atlas");
  console.log("====================================");
  
  try {
    // Use the actual MONGO_URI from your .env file
    const mongoUri = process.env.MONGO_URI;
    console.log("🌐 Connecting to MongoDB Atlas...");
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Atlas successfully!");
    
    // Get the database name from the connection
    const dbName = mongoose.connection.db.databaseName;
    console.log("📊 Database name:", dbName);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📂 Collections (${collections.length}):`);
    
    for (const col of collections) {
      console.log(`   - ${col.name}`);
      
      // Check document count for each collection
      const collection = mongoose.connection.db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`     Documents: ${count}`);
      
      if (count > 0 && (col.name === 'stakes' || col.name.toLowerCase().includes('stake'))) {
        console.log(`\n🔍 Checking ${col.name} collection for your stake...`);
        
        // Try to find your specific stake by ID
        try {
          const objectId = new mongoose.Types.ObjectId("68f4ccec23d8f4a7a41ea542");
          const yourStake = await collection.findOne({ _id: objectId });
          
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
            
            // Update the reward amount to 1 PYUSD if it's currently 0
            if (yourStake.rewardAmount === 0 && yourStake.isWinner) {
              console.log("\n🔧 Updating reward amount from 0 to 1 PYUSD...");
              
              const result = await collection.updateOne(
                { _id: objectId },
                { 
                  $set: { 
                    rewardAmount: 1,
                    updatedAt: new Date()
                  }
                }
              );
              
              if (result.modifiedCount > 0) {
                console.log("✅ SUCCESSFULLY UPDATED!");
                
                // Verify the update
                const verified = await collection.findOne({ _id: objectId });
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
                console.log("   2. Look for a 'Claim Rewards' button");
                console.log("   3. Click it to get your 1 PYUSD back!");
                return;
              } else {
                console.log("❌ Failed to update the stake");
              }
            } else {
              console.log(`✅ Reward amount is already set correctly: ${yourStake.rewardAmount} PYUSD`);
            }
            return;
          }
        } catch (err) {
          console.log("❌ Error checking for stake by ID:", err.message);
        }
        
        // Try to find by wallet address
        try {
          const byWallet = await collection.findOne({ 
            candidateAddress: "0xd109c14be156e89d0051f77022a974d4170baaa2" 
          });
          
          if (byWallet) {
            console.log("✅ Found by wallet address!");
            console.log("   Stake ID:", byWallet._id);
            console.log("   Current reward amount:", byWallet.rewardAmount);
            
            if (byWallet.rewardAmount === 0 && byWallet.isWinner) {
              const result = await collection.updateOne(
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
                return;
              }
            }
          }
        } catch (err) {
          console.log("❌ Error checking for stake by wallet:", err.message);
        }
        
        // Show some sample documents
        console.log("\n📋 Sample stakes in the collection:");
        const samples = await collection.find({}).limit(3).toArray();
        samples.forEach((stake, i) => {
          console.log(`   ${i + 1}. ID: ${stake._id.toString().substring(0, 8)}...`);
          console.log(`      Wallet: ${stake.candidateAddress}`);
          console.log(`      Amount: ${stake.stakeAmount} PYUSD`);
          console.log(`      Winner: ${stake.isWinner}`);
          console.log(`      Reward: ${stake.rewardAmount}`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB Atlas");
  }
}

fixAtlasStake().catch(console.error);