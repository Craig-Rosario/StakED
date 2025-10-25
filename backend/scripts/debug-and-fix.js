import mongoose from 'mongoose';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/staked';

async function debugAndFix() {
  console.log("🔍 Database Debug and Fix");
  console.log("=========================");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\n📂 Available collections:");
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Try different collection names
    const possibleNames = ['stakes', 'Stake', 'stake'];
    
    for (const collectionName of possibleNames) {
      console.log(`\n🔍 Checking collection: ${collectionName}`);
      
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   Document count: ${count}`);
        
        if (count > 0) {
          // Find by the exact ObjectId
          const objectId = new mongoose.Types.ObjectId("68f4ccec23d8f4a7a41ea542");
          const stakeById = await collection.findOne({ _id: objectId });
          
          if (stakeById) {
            console.log("✅ FOUND YOUR STAKE by ID!");
            console.log("   Current data:", JSON.stringify(stakeById, null, 2));
            
            // Update it
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
              console.log("✅ UPDATED! Reward amount set to 1 PYUSD");
              
              // Verify the update
              const updated = await collection.findOne({ _id: objectId });
              console.log("✅ Verified - Reward Amount:", updated.rewardAmount);
              
              console.log("\n🎉 SUCCESS! Your stake is now fixed:");
              console.log(`   💰 Stake Amount: ${updated.stakeAmount} PYUSD`);
              console.log(`   🏆 Actual Score: ${updated.actualScore}/${updated.targetThreshold}`);
              console.log(`   💎 Reward Amount: ${updated.rewardAmount} PYUSD`);
              console.log(`   ✅ Is Winner: ${updated.isWinner}`);
              console.log(`   💸 Is Claimed: ${updated.isClaimed}`);
              
              return; // Exit successfully
            }
          } else {
            // Try by wallet address
            const stakeByWallet = await collection.findOne({ 
              candidateAddress: "0xd109c14be156e89d0051f77022a974d4170baaa2" 
            });
            
            if (stakeByWallet) {
              console.log("✅ FOUND YOUR STAKE by wallet!");
              console.log("   Stake ID:", stakeByWallet._id);
              
              const result = await collection.updateOne(
                { _id: stakeByWallet._id },
                { 
                  $set: { 
                    rewardAmount: 1,
                    updatedAt: new Date()
                  }
                }
              );
              
              if (result.modifiedCount > 0) {
                console.log("✅ UPDATED! Reward amount set to 1 PYUSD");
                return;
              }
            }
          }
          
          // List some documents to see the structure
          const samples = await collection.find({}).limit(3).toArray();
          console.log("   Sample documents:");
          samples.forEach((doc, i) => {
            console.log(`     ${i + 1}. ID: ${doc._id}, candidateAddress: ${doc.candidateAddress}`);
          });
        }
      } catch (err) {
        console.log(`   ❌ Error accessing ${collectionName}:`, err.message);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

debugAndFix().catch(console.error);