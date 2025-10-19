const mongoose = require('mongoose');

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/staked';

async function main() {
  console.log("🔍 Checking Backend Database for Recent Exams");
  console.log("==============================================");
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Define exam schema to query the database
    const examSchema = new mongoose.Schema({}, { strict: false });
    const Exam = mongoose.model('Exam', examSchema);

    // Get recent exams (last 3 hours)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentExams = await Exam.find({
      createdAt: { $gte: threeHoursAgo }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${recentExams.length} recent exams in database\n`);

    for (const exam of recentExams) {
      console.log(`📋 Exam: "${exam.name}"`);
      console.log(`   ID: ${exam._id}`);
      console.log(`   Blockchain ID: ${exam.blockchainExamId || 'NOT SET'}`);
      console.log(`   Class: ${exam.classId}`);
      console.log(`   Created: ${exam.createdAt}`);
      console.log(`   Status: ${exam.status || 'pending'}`);
      console.log(`   Has Stakes: ${exam.stakes ? exam.stakes.length : 0}`);
      
      if (exam.stakes && exam.stakes.length > 0) {
        console.log(`   Stakes:`);
        exam.stakes.forEach((stake, i) => {
          console.log(`     ${i+1}. Student: ${stake.studentId}`);
          console.log(`        Wallet: ${stake.walletAddress}`);
          console.log(`        Amount: ${stake.amount} PYUSD`);
          console.log(`        Predicted: ${stake.predictedMarks} marks`);
        });
      }
      
      if (exam.grades && exam.grades.length > 0) {
        console.log(`   Grades:`);
        exam.grades.forEach((grade, i) => {
          console.log(`     ${i+1}. Student: ${grade.studentId}`);
          console.log(`        Score: ${grade.marks}/${exam.maxMarks}`);
        });
      }
      
      console.log('');
    }

    // Now check if any of these exams have your student wallet
    const studentWallet = "0xd109c14be156e89d0051F77022A974D4170bAaA2";
    console.log(`🎯 Looking for exams with your wallet: ${studentWallet}\n`);
    
    for (const exam of recentExams) {
      if (exam.stakes) {
        const yourStake = exam.stakes.find(stake => 
          stake.walletAddress && stake.walletAddress.toLowerCase() === studentWallet.toLowerCase()
        );
        
        if (yourStake) {
          console.log(`🎉 FOUND YOUR STAKE!`);
          console.log(`   Exam: "${exam.name}"`);
          console.log(`   Blockchain ID: ${exam.blockchainExamId}`);
          console.log(`   Your stake: ${yourStake.amount} PYUSD`);
          console.log(`   Predicted marks: ${yourStake.predictedMarks}`);
          
          const yourGrade = exam.grades ? exam.grades.find(g => g.studentId === yourStake.studentId) : null;
          if (yourGrade) {
            console.log(`   Your actual score: ${yourGrade.marks}/${exam.maxMarks}`);
            console.log(`   Passing score: ${exam.passingScore}`);
            console.log(`   Did you pass? ${yourGrade.marks >= exam.passingScore ? '✅ YES' : '❌ NO'}`);
          }
          
          console.log(`\n🔗 Use this blockchain exam ID to check rewards:`);
          console.log(`   ${exam.blockchainExamId}`);
          break;
        }
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

main().catch(console.error);