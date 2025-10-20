import { ethers } from "ethers";
import dotenv from "dotenv";
import Exam from "../models/Exam.js";
import Class from "../models/Class.js";
import User from "../models/User.js";
import Stake from "../models/Stake.js";

// Configure dotenv to ensure environment variables are loaded
dotenv.config();

// Contract configuration (Updated with prediction-based logic)
const CONTRACTS = {
  EXAM_STAKING: process.env.EXAM_STAKING_ADDRESS || "0x2f0c87aA37B8aa3C390f34BfAF3341a6c067a190",
  PYUSD: process.env.PYUSD_ADDRESS || "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
  STUDENT_REGISTRY: process.env.STUDENT_REGISTRY_ADDRESS || "0xF13330A8af65533793011d4d20Dd68bA1e8fe24a",
  VERIFIER_REGISTRY: process.env.VERIFIER_REGISTRY_ADDRESS || "0x1903613D43Feb8266af88Fc67004103480cd86A2"
};

console.log("🔧 Contract Addresses Loaded:");
console.log("  EXAM_STAKING:", CONTRACTS.EXAM_STAKING);
console.log("  PYUSD:", CONTRACTS.PYUSD);
console.log("  STUDENT_REGISTRY:", CONTRACTS.STUDENT_REGISTRY);
console.log("  VERIFIER_REGISTRY:", CONTRACTS.VERIFIER_REGISTRY);

const STAKED_BANK_ADDRESS = "0x6D41680267986408E5e7c175Ee0622cA931859A4";

// Contract ABIs
const EXAM_ABI = [
  "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external",
  "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
  "function stake(bytes32 examId, address candidate, uint256 amount, uint256 predictedScore) external",
  "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
  "function totalOn(bytes32 examId, address candidate) external view returns (uint256)",
  "function setStudentScores(bytes32 examId, address[] students, uint256[] scores) external",
  "function distributeRewards(bytes32 examId) external",
  "function claim(bytes32 examId) external",
  "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
  "function getStudentScore(bytes32 examId, address student) external view returns (uint256)",
  "function getPredictedScore(bytes32 examId, address student) external view returns (uint256)",
  "function isStakingOpen(bytes32 examId) external view returns (bool)",
  "function hasClaimed(bytes32 examId, address staker) external view returns (bool)"
];

const VERIFIER_ABI = [
  "function addVerifier(address verifier) external",
  "function isVerifier(address verifier) external view returns (bool)"
];

const STUDENT_ABI = [
  "function registerStudent(address student) external",
  "function isRegistered(address student) external view returns (bool)"
];

// Blockchain provider setup (with fallback for development)
let provider, wallet;
try {
  if (process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_PRIVATE_KEY) {
    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);
  } else {
    console.warn("⚠️ Blockchain environment variables not set. Some features will be disabled.");
    provider = null;
    wallet = null;
  }
} catch (error) {
  console.error("❌ Failed to initialize blockchain provider:", error.message);
  provider = null;
  wallet = null;
}

// 1. Simple Exam Creation (No blockchain initially)
export const createExam = async (req, res) => {
  try {
    const { name, description, examDate, stakeDeadline, maxMarks, classId } = req.body;
    const verifierId = req.user.userId; // From auth middleware
    
    console.log("🎯 Creating exam (blockchain integration on first stake)...");

    // 1. Validate class and get students
    const classDetails = await Class.findById(classId).populate('students').populate('verifier');
    if (!classDetails) {
      return res.status(400).json({
        success: false,
        message: "Class not found"
      });
    }

    // 2. Simple validation
    const examDateTime = new Date(examDate);
    const stakeDateTime = new Date(stakeDeadline);
    
    if (stakeDateTime >= examDateTime) {
      return res.status(400).json({
        success: false,
        message: "Stake deadline must be before exam date"
      });
    }

    // 3. Create exam in MongoDB (blockchain created later when first student stakes)
    const examIdForBlockchain = `exam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newExam = new Exam({
      name,
      description,
      examDate: examDateTime,
      stakeDeadline: stakeDateTime,
      maxMarks,
      classId,
      verifier: verifierId,
      blockchainExamId: examIdForBlockchain,
      status: "upcoming",
      blockchainCreated: false // Will be set to true when first student stakes
    });

    const savedExam = await newExam.save();

    console.log(`✅ Exam "${name}" created successfully! Blockchain will be initialized when first student stakes.`);

    res.status(201).json({
      success: true,
      message: "Exam created successfully! Students can now stake.",
      exam: savedExam,
      studentsCount: classDetails.students.length,
      studentsWithWallets: classDetails.students.filter(s => s.walletAddress).length
    });

  } catch (error) {
    console.error("❌ Exam creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message
    });
  }
};

// Helper function to initialize blockchain for exam
const initializeBlockchainForExam = async (exam) => {
  console.log("🔗 Initializing blockchain for exam:", exam.name);

  if (!wallet || !provider) {
    throw new Error("Blockchain provider not configured");
  }

  // Get class and verifier details
  const classDetails = await Class.findById(exam.classId).populate('students');
  const verifier = await User.findById(exam.verifier);

  if (!verifier || !verifier.walletAddress) {
    throw new Error("Verifier wallet address not found");
  }

  // Ensure verifier is registered
  const verifierRegistry = new ethers.Contract(CONTRACTS.VERIFIER_REGISTRY, VERIFIER_ABI, wallet);
  const isVerifierRegistered = await verifierRegistry.isVerifier(verifier.walletAddress);
  
  if (!isVerifierRegistered) {
    console.log("📝 Registering verifier on blockchain...");
    const registerTx = await verifierRegistry.addVerifier(verifier.walletAddress);
    await registerTx.wait();
    console.log("✅ Verifier registered");
  }

  // Register students and collect candidate addresses
  const studentRegistry = new ethers.Contract(CONTRACTS.STUDENT_REGISTRY, STUDENT_ABI, wallet);
  const candidateAddresses = [];
  
  for (const student of classDetails.students) {
    if (student.walletAddress) {
      const isRegistered = await studentRegistry.isRegistered(student.walletAddress);
      if (!isRegistered) {
        console.log(`📝 Registering student ${student.walletAddress}...`);
        const registerTx = await studentRegistry.registerStudent(student.walletAddress);
        await registerTx.wait();
      }
      candidateAddresses.push(student.walletAddress);
    }
  }

  if (candidateAddresses.length === 0) {
    throw new Error("No students with wallet addresses found");
  }

  // Create exam on blockchain
  const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, wallet);
  const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
  const stakeDeadlineTimestamp = Math.floor(exam.stakeDeadline.getTime() / 1000);
  const feeBps = 250; // 2.5%

  console.log("🔗 Creating exam on blockchain...");
  const createTx = await examContract.createExam(
    examIdBytes,
    verifier.walletAddress,
    candidateAddresses,
    stakeDeadlineTimestamp,
    feeBps
  );
  
  await createTx.wait();
  
  // Update exam as blockchain-created
  exam.blockchainCreated = true;
  exam.status = "staking";
  await exam.save();

  console.log(`✅ Blockchain initialized for exam: ${exam.name}`);
  return { candidateAddresses, contractAddress: CONTRACTS.EXAM_STAKING };
};

// 2. Student Staking
export const stakeOnStudent = async (req, res) => {
  try {
    const { examId, candidateAddress, amount, predictedMarks } = req.body;
    const stakerId = req.user.userId;
    
    console.log("💰 Processing stake request...");
    console.log("  - Exam ID:", examId);
    console.log("  - Candidate:", candidateAddress);
    console.log("  - Amount:", amount);
    console.log("  - Predicted Marks:", predictedMarks);
    console.log("  - Staker ID:", stakerId);

    // 1. Validate input
    if (!predictedMarks || predictedMarks < 0 || predictedMarks > 100) {
      return res.status(400).json({
        success: false,
        message: "Predicted marks must be between 0 and 100"
      });
    }

    // 2. Get exam and validate
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    // Initialize blockchain if not yet created (lazy initialization)
    if (!exam.blockchainCreated) {
      try {
        console.log("🔗 First stake - initializing blockchain...");
        await initializeBlockchainForExam(exam);
        console.log("✅ Blockchain initialized successfully!");
        
        // Refresh exam object
        const updatedExam = await Exam.findById(examId);
        if (!updatedExam.blockchainCreated) {
          throw new Error("Failed to update exam blockchain status");
        }
      } catch (initError) {
        console.error("❌ Blockchain initialization failed:", initError);
        return res.status(500).json({
          success: false,
          message: "Failed to initialize blockchain for staking",
          error: initError.message,
          details: {
            examName: exam.name,
            suggestion: "Please ensure verifier has proper wallet setup"
          }
        });
      }
    }

    // 2. Get staker details
    const staker = await User.findById(stakerId);
    if (!staker || !staker.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Staker wallet address not found"
      });
    }

    // 3. Validate candidate
    const candidate = await User.findOne({ walletAddress: candidateAddress.toLowerCase() });
    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: "Candidate not found"
      });
    }

    // 4. Check if staking is still open
    if (!provider) {
      return res.status(500).json({
        success: false,
        message: "Blockchain provider not configured. Cannot verify staking status."
      });
    }

    try {
      const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, provider);
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
      
      console.log("🔍 Blockchain validation:");
      console.log("  - Exam ID:", exam.blockchainExamId);
      console.log("  - Exam ID Bytes:", examIdBytes);
      console.log("  - Contract Address:", CONTRACTS.EXAM_STAKING);
      
      const stakingOpen = await examContract.isStakingOpen(examIdBytes);
      console.log("  - Staking Open:", stakingOpen);
      
      if (!stakingOpen) {
        console.log("❌ Staking closed - checking exam info...");
        try {
          const examInfo = await examContract.getExamInfo(examIdBytes);
          console.log("  - Exam Info:", {
            stakeDeadline: new Date(Number(examInfo.stakeDeadline) * 1000),
            isActive: examInfo.isActive,
            candidates: examInfo.candidates.length
          });
        } catch (infoError) {
          console.log("  - Could not get exam info:", infoError.message);
        }
        
        return res.status(400).json({
          success: false,
          message: "Staking period has ended for this exam",
          details: {
            examName: exam.name,
            stakeDeadline: exam.stakeDeadline,
            currentTime: new Date(),
            blockchainExamId: exam.blockchainExamId
          }
        });
      }
    } catch (blockchainError) {
      console.error("Blockchain check failed:", blockchainError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify exam status on blockchain",
        details: {
          error: blockchainError.message,
          examId: exam.blockchainExamId
        }
      });
    }

    // 5. Store stake record in MongoDB
    const stakeRecord = new Stake({
      stakeId: Date.now(),
      student: stakerId,
      class: exam.classId,
      exam: examId,
      candidateAddress: candidateAddress.toLowerCase(),
      stakeAmount: parseFloat(amount),
      confidence: 85, // Default confidence
      predictedMarks: parseFloat(predictedMarks),
      isSelfStake: staker.walletAddress.toLowerCase() === candidateAddress.toLowerCase(),
      status: "pending"
    });

    await stakeRecord.save();

    // 6. Return success (frontend will handle blockchain transaction)
    res.json({
      success: true,
      message: `Stake recorded with ${predictedMarks}% predicted score. Win if actual >= predicted!`,
      stake: stakeRecord,
      blockchain: {
        examId: exam.blockchainExamId,
        contractAddress: CONTRACTS.EXAM_STAKING,
        pyusdAddress: CONTRACTS.PYUSD,
        candidateAddress,
        amount: amount,
        predictedScore: predictedMarks
      },
      newLogic: {
        winCondition: "actual_score >= predicted_score",
        description: "You win if your actual score meets or exceeds your prediction"
      }
    });

  } catch (error) {
    console.error("❌ Staking error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process stake",
      error: error.message
    });
  }
};

// 3. Get Exam Info with Stakes
export const getExamInfo = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findById(examId)
      .populate('classId')
      .populate('verifier')
      .populate('stakes.student');

    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    let blockchainInfo = null;
    let stakes = [];

    if (exam.blockchainExamId && exam.blockchainCreated) {
      try {
        const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, provider);
        const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
        
        // Get blockchain exam info
        const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
          await examContract.getExam(examIdBytes);
        const stakingOpen = await examContract.isStakingOpen(examIdBytes);
        
        blockchainInfo = {
          verifier,
          stakeDeadline: Number(stakeDeadline),
          finalized,
          canceled,
          feeBps: Number(feeBps),
          totalStake: ethers.formatUnits(totalStake, 6),
          protocolFee: ethers.formatUnits(protocolFee, 6),
          candidates,
          stakingOpen
        };

        // Get stakes for each candidate
        for (const candidate of candidates) {
          const totalOnCandidate = await examContract.totalOn(examIdBytes, candidate);
          const candidateUser = await User.findOne({ walletAddress: candidate.toLowerCase() });
          
          stakes.push({
            candidateAddress: candidate,
            candidateName: candidateUser?.username || "Unknown",
            totalStaked: ethers.formatUnits(totalOnCandidate, 6),
            isWinner: finalized ? await examContract.isWinner(examIdBytes, candidate) : null,
            score: finalized ? await examContract.getStudentScore(examIdBytes, candidate) : null
          });
        }

      } catch (error) {
        console.error("Failed to get blockchain info:", error);
      }
    }

    // Get MongoDB stakes
    const dbStakes = await Stake.find({ exam: examId }).populate('student');

    res.json({
      success: true,
      exam,
      blockchain: blockchainInfo,
      stakes,
      dbStakes
    });

  } catch (error) {
    console.error("Get exam error:", error);
    res.status(500).json({ success: false, message: "Failed to get exam details" });
  }
};

// 4. Submit Grades and Distribute Rewards
export const submitGrades = async (req, res) => {
  console.log("🔥 submitGrades function called!");
  console.log("🔥 Request body:", req.body);
  console.log("🔥 User:", req.user);
  
  try {
    const { examId, grades } = req.body; // grades = [{ studentAddress, score }, ...]
    const verifierId = req.user.userId;
    
    console.log("📊 Submitting grades and distributing rewards...");
    console.log("  - Exam ID:", examId);
    console.log("  - Grades:", grades);
    console.log("  - Verifier ID:", verifierId);

    // 1. Get exam and validate verifier
    const exam = await Exam.findById(examId);
    if (!exam || !exam.blockchainCreated) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or blockchain not ready"
      });
    }

    if (exam.verifier.toString() !== verifierId) {
      return res.status(403).json({
        success: false,
        message: "Only the exam verifier can submit grades"
      });
    }

    if (exam.rewardsDistributed) {
      return res.status(400).json({
        success: false,
        message: "Grades already submitted and rewards distributed"
      });
    }

    // 2. Prepare blockchain data
    const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, wallet);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
    
    const students = grades.map(g => g.studentAddress);
    const scores = grades.map(g => g.score);

    // 3. Set scores on blockchain (no passing score needed - winners determined by prediction accuracy)
    console.log("📝 Setting scores on blockchain...");
    const setScoresTx = await examContract.setStudentScores(
      examIdBytes, 
      students, 
      scores
    );
    await setScoresTx.wait();
    console.log("✅ Scores set on blockchain");

    // 4. Distribute rewards
    console.log("💎 Distributing rewards...");
    const distributeTx = await examContract.distributeRewards(examIdBytes);
    await distributeTx.wait();
    console.log("✅ Rewards distributed");

    // 5. Update exam status
    exam.status = "graded";
    exam.gradedAt = new Date();
    exam.rewardsDistributed = true;
    exam.distributedAt = new Date();
    
    // Store grades in exam
    for (const grade of grades) {
      const stakeIndex = exam.stakes.findIndex(s => 
        s.student.toString() === grade.studentId || 
        s.candidateAddress === grade.studentAddress.toLowerCase()
      );
      if (stakeIndex !== -1) {
        exam.stakes[stakeIndex].actualGrade = grade.score;
      }
    }
    
    await exam.save();

    // 6. Update stake records in MongoDB
    for (const grade of grades) {
      const isWinner = await examContract.isWinner(examIdBytes, grade.studentAddress);
      
      // Calculate reward amount based on staking logic
      const stakes = await Stake.find({ 
        exam: examId, 
        candidateAddress: grade.studentAddress.toLowerCase() 
      });
      
      for (const stake of stakes) {
        let rewardAmount = 0;
        if (isWinner) {
          // Winner gets their stake back (1:1 ratio for passing students)
          rewardAmount = stake.stakeAmount;
        }
        
        await Stake.findByIdAndUpdate(stake._id, {
          actualScore: grade.score,
          isWinner,
          rewardAmount,
          status: "verified"
        });
      }
    }

    // 7. Determine reward scenario based on prediction accuracy
    const winners = [];
    const winnerDetails = [];
    for (const grade of grades) {
      const isWinner = await examContract.isWinner(examIdBytes, grade.studentAddress);
      if (isWinner) {
        winners.push(grade.studentAddress);
        const predictedScore = await examContract.getPredictedScore(examIdBytes, grade.studentAddress);
        winnerDetails.push({
          address: grade.studentAddress,
          actualScore: grade.score,
          predictedScore: Number(predictedScore),
          successful: grade.score >= Number(predictedScore)
        });
      }
    }

    let scenario;
    if (winners.length === 0) {
      scenario = "nobody_wins_predictions_failed";
    } else if (winners.length === grades.length) {
      scenario = "everyone_wins_predictions_met";
    } else {
      scenario = "mixed_results_some_predictions_met";
    }

    console.log(`🎯 Scenario: ${scenario}, Winners: ${winners.length}/${grades.length}`);
    console.log("🎯 Winner details:", winnerDetails);

    res.json({
      success: true,
      message: "Grades submitted and rewards distributed successfully. Winners determined by prediction accuracy.",
      scenario,
      winners: winners.length,
      totalStudents: grades.length,
      winnerDetails,
      predictionBasedLogic: true,
      exam: {
        id: exam._id,
        name: exam.name,
        blockchainExamId: exam.blockchainExamId
      }
    });

  } catch (error) {
    console.error("❌ Grade submission error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to submit grades and distribute rewards",
      error: error.message,
      details: error.stack
    });
  }
};

// 5. Get User Stakes
export const getUserStakes = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const stakes = await Stake.find({ student: userId })
      .populate('exam')
      .populate('class')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      stakes
    });

  } catch (error) {
    console.error("Get stakes error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get user stakes" 
    });
  }
};

// 6. Claim Rewards (Helper endpoint to track claims)
export const claimReward = async (req, res) => {
  try {
    const { examId } = req.body;
    const userId = req.user.userId;
    
    console.log("🎁 Claiming rewards for user:", userId, "exam:", examId);
    
    const exam = await Exam.findById(examId);
    if (!exam || !exam.rewardsDistributed) {
      return res.status(400).json({
        success: false,
        message: "Exam not found or rewards not yet distributed"
      });
    }

    // Get user's stakes for this exam
    const userStakes = await Stake.find({ 
      exam: examId, 
      student: userId,
      isWinner: true,
      isClaimed: false 
    });

    if (userStakes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No claimable rewards found for this exam"
      });
    }

    // Get user details to find wallet address
    const user = await User.findById(userId);
    if (!user || !user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "User wallet address not found"
      });
    }

    try {
      // Call blockchain claim function
      // NOTE: The backend cannot claim on behalf of users!
      // Users must claim from their own wallets
      console.log("⚠️  Backend cannot claim on behalf of users");
      console.log("   User must claim from their own wallet");
      
      return res.status(400).json({
        success: false,
        message: "Claims must be made from your own wallet",
        requiresUserTransaction: true,
        blockchain: {
          examId: exam.blockchainExamId,
          contractAddress: CONTRACTS.EXAM_STAKING,
          userWallet: user.walletAddress,
          function: "claim",
          parameters: [ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId))]
        }
      });

      // Remove the old backend claiming code since it doesn't work
      // const examContract = new ethers.Contract(CONTRACTS.EXAM_STAKING, EXAM_ABI, wallet);
      // const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
      
      // console.log("🔗 Calling blockchain claim for:", {
      //   examId: exam.blockchainExamId,
      //   userWallet: user.walletAddress,
      //   contract: CONTRACTS.EXAM_STAKING
      // });

      // // First check if exam exists on blockchain
      // try {
      //   const examDetails = await examContract.getExam(examIdBytes);
      //   console.log("✅ Exam found on blockchain");
      // } catch (examCheckError) {
      //   if (examCheckError.message.includes("Exam not found")) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "This exam was not properly created on the blockchain. The stake may have failed initially. Please contact support.",
      //       error: "EXAM_NOT_ON_BLOCKCHAIN"
      //     });
      //   }
      //   throw examCheckError;
      // }

      // // Check if already claimed on blockchain
      // const alreadyClaimed = await examContract.hasClaimed(examIdBytes, user.walletAddress);
      // if (alreadyClaimed) {
      //   // Update database to reflect already claimed status
      //   await Stake.updateMany(
      //     { exam: examId, student: userId },
      //     { isClaimed: true, status: "paid", claimedAt: new Date() }
      //   );
        
      //   return res.status(400).json({
      //     success: false,
      //     message: "Rewards already claimed on blockchain"
      //   });
      // }

      // // Execute blockchain claim
      // const claimTx = await examContract.claim(examIdBytes);
      // await claimTx.wait();
      
      // console.log("✅ Blockchain claim successful");

      // // Update database to mark as claimed
      // const totalRewardAmount = userStakes.reduce((sum, stake) => sum + stake.rewardAmount, 0);
      
      // // Old code that tried to do backend claiming (doesn't work)
      // await Stake.updateMany(...)
      // res.json({ success: true, ... });

    } catch (blockchainError) {
      console.error("❌ Blockchain claim failed:", blockchainError);
      
      // If it's a user-side transaction that needs to be done in frontend
      if (blockchainError.message.includes("CALL_EXCEPTION") || blockchainError.message.includes("execution reverted")) {
        return res.status(400).json({
          success: false,
          message: "Claim must be executed from your wallet",
          requiresUserTransaction: true,
          blockchain: {
            examId: exam.blockchainExamId,
            contractAddress: CONTRACTS.EXAM_STAKING,
            userWallet: user.walletAddress
          }
        });
      }
      
      throw blockchainError;
    }

  } catch (error) {
    console.error("❌ Claim error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim rewards",
      error: error.message
    });
  }
};