import { ethers } from "ethers";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// MongoDB Models (simplified)
const examSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  classId: mongoose.Schema.Types.ObjectId,
  verifier: mongoose.Schema.Types.ObjectId,
  stakeDeadline: Date,
  blockchainExamId: String,
  blockchainCreated: Boolean,
  blockchainError: String,
  status: String
}, { collection: 'exams' });

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  walletAddress: String,
  username: String,
  role: String
}, { collection: 'users' });

const classSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  students: [mongoose.Schema.Types.ObjectId]
}, { collection: 'classes' });

async function main() {
  console.log("🔧 Fixing Exam with Blockchain Creation");
  console.log("=====================================");

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const Exam = mongoose.model('Exam', examSchema);
  const User = mongoose.model('User', userSchema);
  const Class = mongoose.model('Class', classSchema);

  // Get the failing exam
  const examId = "68f4b0928c739d29c836a742";
  const exam = await Exam.findById(examId);
  
  if (!exam) {
    console.error("❌ Exam not found");
    return;
  }

  console.log("📋 Found exam:", exam.name);
  console.log("   Status:", exam.status);
  console.log("   Blockchain Created:", exam.blockchainCreated);
  console.log("   Stake Deadline:", exam.stakeDeadline);

  // Check if blockchain setup is available
  if (!process.env.SEPOLIA_RPC_URL || !process.env.SEPOLIA_PRIVATE_KEY) {
    console.error("❌ Missing blockchain environment variables");
    console.log("Please set SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in your .env file");
    return;
  }

  // Initialize blockchain
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

  console.log("🔗 Blockchain wallet:", await wallet.getAddress());

  // Contract addresses
  const CONTRACTS = {
    EXAM_STAKING: "0xEe41CA98C7E2f2050127111edf3bac094dE24029",
    VERIFIER_REGISTRY: "0xAAB09f246A15C56370d3Bc2f1F9f8765156E5EB5",
    STUDENT_REGISTRY: "0xda43a6b8f99F804B1455109388DC363443478b90"
  };

  // Contract ABIs
  const EXAM_ABI = [
    "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external"
  ];

  const VERIFIER_ABI = [
    "function addVerifier(address verifier) external",
    "function isVerifier(address verifier) external view returns (bool)"
  ];

  const STUDENT_ABI = [
    "function registerStudent(address student) external",
    "function isRegistered(address student) external view returns (bool)"
  ];

  try {
    // Get verifier details
    const verifier = await User.findById(exam.verifier);
    if (!verifier || !verifier.walletAddress) {
      throw new Error("Verifier wallet address not found");
    }

    console.log("👤 Verifier:", verifier.walletAddress);

    // Get class and students
    const classData = await Class.findById(exam.classId).populate('students');
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get student wallet addresses
    const students = await User.find({ _id: { $in: classData.students } });
    const candidateAddresses = students
      .filter(s => s.walletAddress)
      .map(s => s.walletAddress);

    if (candidateAddresses.length === 0) {
      throw new Error("No students with wallet addresses found");
    }

    console.log("👥 Found", candidateAddresses.length, "students with wallets");

    // Register verifier if needed
    const verifierRegistry = new ethers.Contract(CONTRACTS.VERIFIER_REGISTRY, VERIFIER_ABI, wallet);
    const isVerifierRegistered = await verifierRegistry.isVerifier(verifier.walletAddress);
    
    if (!isVerifierRegistered) {
      console.log("📝 Registering verifier...");
      const registerTx = await verifierRegistry.addVerifier(verifier.walletAddress);
      await registerTx.wait();
      console.log("✅ Verifier registered");
    } else {
      console.log("✅ Verifier already registered");
    }

    // Register students if needed
    const studentRegistry = new ethers.Contract(CONTRACTS.STUDENT_REGISTRY, STUDENT_ABI, wallet);
    for (const studentAddr of candidateAddresses) {
      const isRegistered = await studentRegistry.isRegistered(studentAddr);
      if (!isRegistered) {
        console.log(`📝 Registering student ${studentAddr.slice(0, 8)}...`);
        const registerTx = await studentRegistry.registerStudent(studentAddr);
        await registerTx.wait();
      }
    }

    // Create blockchain exam ID
    const blockchainExamId = `exam-${exam._id}-${Date.now()}`;
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(blockchainExamId));
    
    // Set stake deadline to future (24 hours from now)
    const newStakeDeadline = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);
    const feeBps = 250; // 2.5%

    console.log("🎯 Creating exam on blockchain...");
    console.log("   Exam ID:", blockchainExamId);
    console.log("   Candidates:", candidateAddresses.length);
    console.log("   New Stake Deadline:", new Date(newStakeDeadline * 1000));

    // Create exam on blockchain
    const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, wallet);
    const createTx = await examContract.createExam(
      examIdBytes,
      verifier.walletAddress,
      candidateAddresses,
      newStakeDeadline,
      feeBps
    );
    
    console.log("⏳ Transaction sent:", createTx.hash);
    await createTx.wait();
    console.log("✅ Exam created on blockchain!");

    // Update MongoDB exam
    await Exam.findByIdAndUpdate(examId, {
      blockchainExamId: blockchainExamId,
      blockchainCreated: true,
      blockchainError: null,
      status: "staking",
      stakeDeadline: new Date(newStakeDeadline * 1000)
    });

    console.log("✅ MongoDB exam updated");
    console.log("");
    console.log("🎉 Exam fixed successfully!");
    console.log("   Students can now stake PYUSD on this exam");
    console.log("   Blockchain Exam ID:", blockchainExamId);
    console.log("   New Stake Deadline:", new Date(newStakeDeadline * 1000));

  } catch (error) {
    console.error("❌ Failed to fix exam:", error.message);
    
    // Update exam with error
    await Exam.findByIdAndUpdate(examId, {
      blockchainError: error.message
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);