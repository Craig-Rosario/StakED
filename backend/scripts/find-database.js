import mongoose from 'mongoose';

async function findDatabase() {
  console.log("🔍 Finding Your Database and Collection");
  console.log("=======================================");
  
  try {
    // Try connecting to different database names
    const possibleDatabases = [
      'mongodb://localhost:27017/staked',
      'mongodb://localhost:27017/StakED',
      'mongodb://localhost:27017/stakeify',
      'mongodb://localhost:27017/test',
      'mongodb://localhost:27017/stakeed'
    ];

    for (const dbUri of possibleDatabases) {
      console.log(`\n🔍 Checking database: ${dbUri}`);
      
      try {
        await mongoose.connect(dbUri);
        console.log("✅ Connected successfully");

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📂 Collections (${collections.length}):`);
        
        for (const col of collections) {
          console.log(`   - ${col.name}`);
          
          // Check document count for each collection
          try {
            const collection = mongoose.connection.db.collection(col.name);
            const count = await collection.countDocuments();
            console.log(`     Documents: ${count}`);
            
            if (count > 0) {
              // Look for your specific stake
              const objectId = new mongoose.Types.ObjectId("68f4ccec23d8f4a7a41ea542");
              const found = await collection.findOne({ _id: objectId });
              
              if (found) {
                console.log("🎉 FOUND YOUR STAKE!");
                console.log("   Database:", dbUri);
                console.log("   Collection:", col.name);
                console.log("   Current reward amount:", found.rewardAmount);
                
                // Fix it right now
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
                  console.log("✅ FIXED! Reward amount updated to 1 PYUSD");
                  
                  // Verify
                  const verified = await collection.findOne({ _id: objectId });
                  console.log("✅ Verified - New reward amount:", verified.rewardAmount);
                  
                  console.log("\n🎉 SUCCESS! Your stake is now ready to claim:");
                  console.log(`   💰 You will receive ${verified.rewardAmount} PYUSD`);
                  console.log(`   🏆 Score: ${verified.actualScore}/${verified.targetThreshold}`);
                  console.log(`   ✅ Winner: ${verified.isWinner}`);
                  console.log(`   💸 Claimed: ${verified.isClaimed}`);
                  
                  await mongoose.disconnect();
                  return;
                }
              }
              
              // Also try searching by wallet address in any collection with data
              const byWallet = await collection.findOne({ 
                candidateAddress: "0xd109c14be156e89d0051f77022a974d4170baaa2" 
              });
              
              if (byWallet) {
                console.log("🎉 FOUND YOUR STAKE BY WALLET!");
                console.log("   Database:", dbUri);
                console.log("   Collection:", col.name);
                console.log("   Stake ID:", byWallet._id);
                
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
                  console.log("✅ FIXED! Reward amount updated to 1 PYUSD");
                  await mongoose.disconnect();
                  return;
                }
              }
            }
          } catch (err) {
            console.log(`     ❌ Error checking ${col.name}:`, err.message);
          }
        }
        
        await mongoose.disconnect();
        
      } catch (err) {
        console.log(`❌ Cannot connect to ${dbUri}`);
      }
    }
    
    console.log("\n❌ Could not find your stake in any database");
    console.log("💡 Your stake might be in a different MongoDB instance or port");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

findDatabase().catch(console.error);