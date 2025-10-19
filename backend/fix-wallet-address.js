import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function fixWalletAddress() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get the stakes collection directly
    const stakesCollection = mongoose.connection.db.collection('stakes');

    // Your specific stake ID and wallet address
    const stakeId = '68f4ccec23d8f4a7a41ea542';
    const walletAddress = '0xd109c14be156e89d0051F77022A974D4170bAaA2';

    console.log(`🔧 Fixing stake ID: ${stakeId}`);
    console.log(`💰 Adding wallet address: ${walletAddress}`);

    // Update the stake with your wallet address
    const result = await stakesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(stakeId) },
      { 
        $set: { 
          walletAddress: walletAddress.toLowerCase() 
        } 
      }
    );

    if (result.matchedCount === 1) {
      console.log('🎉 SUCCESSFULLY UPDATED STAKE!');
      
      // Verify the update
      const updatedStake = await stakesCollection.findOne({
        _id: new mongoose.Types.ObjectId(stakeId)
      });
      
      console.log('✅ Verification:');
      console.log(`   Stake ID: ${updatedStake._id}`);
      console.log(`   Wallet: ${updatedStake.walletAddress}`);
      console.log(`   Amount: ${updatedStake.stakeAmount}`);
      console.log(`   Reward: ${updatedStake.rewardAmount}`);
      console.log(`   Winner: ${updatedStake.isWinner}`);
      console.log(`   Claimed: ${updatedStake.isClaimed}`);
      
    } else {
      console.log('❌ Stake not found or not updated');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixWalletAddress();