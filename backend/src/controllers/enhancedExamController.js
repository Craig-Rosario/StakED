// Enhanced exam creation that syncs MongoDB with blockchain
// Add this to your backend API

import { ethers } from "ethers";

// Contract addresses and ABI
const EXAM_STAKING_ADDRESS = "0xf87A667f85e5CFB406cb5851Ecf6e92Dec7929ad";
const VERIFIER_REGISTRY_ADDRESS = "0xea9DA664E4282B0ca32C14c154B28850d7b1bf51";

const EXAM_ABI = [
  "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external"
];

const VERIFIER_ABI = [
  "function addVerifier(address verifier) external",
  "function isVerifier(address verifier) external view returns (bool)"
];

// Environment setup
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, provider);

// Enhanced exam creation endpoint
export const createExamWithBlockchain = async (req, res) => {
  try {
    const { name, description, examDate, stakeDeadline, maxMarks, classId } = req.body;
    const verifierId = req.user.userId; // From auth middleware
    
    // 1. First create exam in MongoDB as usual
    const newExam = new Exam({
      name,
      description,
      examDate: new Date(examDate),
      stakeDeadline: new Date(stakeDeadline),
      maxMarks,
      classId,
      verifierId,
      status: "upcoming"
    });
    
    const savedExam = await newExam.save();
    
    // 2. Get class details and students
    const classDetails = await Class.findById(classId).populate('students');
    if (!classDetails || !classDetails.students.length) {
      return res.status(400).json({
        success: false,
        message: "Class not found or no students enrolled"
      });
    }

    // 3. Get verifier details
    const verifier = await User.findById(verifierId);
    if (!verifier || !verifier.walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Verifier wallet address not found"
      });
    }

    // 4. Create blockchain exam
    try {
      // Ensure verifier is registered on blockchain
      const verifierRegistry = new ethers.Contract(VERIFIER_REGISTRY_ADDRESS, VERIFIER_ABI, wallet);
      const isVerifier = await verifierRegistry.isVerifier(verifier.walletAddress);
      
      if (!isVerifier) {
        console.log("Registering verifier on blockchain...");
        const registerTx = await verifierRegistry.addVerifier(verifier.walletAddress);
        await registerTx.wait();
      }

      // Prepare blockchain data
      const examIdForBlockchain = `exam-${savedExam._id}`;
      const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examIdForBlockchain));
      
      const candidateAddresses = classDetails.students
        .filter(student => student.walletAddress)
        .map(student => student.walletAddress);
      
      if (candidateAddresses.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No students with wallet addresses found"
        });
      }

      const stakeDeadlineTimestamp = Math.floor(new Date(stakeDeadline).getTime() / 1000);
      const feeBps = 250; // 2.5% fee

      // Create exam on blockchain
      const examContract = new ethers.Contract(EXAM_STAKING_ADDRESS, EXAM_ABI, wallet);
      const createTx = await examContract.createExam(
        examIdBytes,
        verifier.walletAddress,
        candidateAddresses,
        stakeDeadlineTimestamp,
        feeBps
      );
      
      await createTx.wait();
      
      // 5. Update MongoDB exam with blockchain info
      savedExam.blockchainExamId = examIdForBlockchain;
      savedExam.blockchainCreated = true;
      await savedExam.save();

      console.log(`✅ Exam created: DB ID ${savedExam._id}, Blockchain ID ${examIdForBlockchain}`);

      res.status(201).json({
        success: true,
        message: "Exam created successfully with blockchain integration",
        exam: savedExam,
        blockchain: {
          examId: examIdForBlockchain,
          candidates: candidateAddresses.length,
          stakeDeadline: new Date(stakeDeadlineTimestamp * 1000)
        }
      });

    } catch (blockchainError) {
      console.error("Blockchain creation failed:", blockchainError);
      
      // Keep the MongoDB exam but mark blockchain as failed
      savedExam.blockchainCreated = false;
      savedExam.blockchainError = blockchainError.message;
      await savedExam.save();

      res.status(201).json({
        success: true,
        message: "Exam created in database, but blockchain integration failed",
        exam: savedExam,
        blockchainError: blockchainError.message
      });
    }

  } catch (error) {
    console.error("Exam creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message
    });
  }
};

// Get exam details including blockchain info
export const getExamWithBlockchainInfo = async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findById(examId).populate('classId').populate('verifierId');
    if (!exam) {
      return res.status(404).json({ success: false, message: "Exam not found" });
    }

    let blockchainInfo = null;
    if (exam.blockchainExamId) {
      try {
        // Get blockchain exam info
        const examContract = new ethers.Contract(EXAM_STAKING_ADDRESS, [
          "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
          "function isStakingOpen(bytes32 examId) external view returns (bool)"
        ], provider);
        
        const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(exam.blockchainExamId));
        const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = await examContract.getExam(examIdBytes);
        const stakingOpen = await examContract.isStakingOpen(examIdBytes);
        
        blockchainInfo = {
          verifier,
          stakeDeadline: Number(stakeDeadline),
          finalized,
          canceled,
          feeBps: Number(feeBps),
          totalStake: ethers.formatUnits(totalStake, 6),
          protocolFee: ethers.formatUnits(protocolFee, 6),
          candidates: candidates.length,
          stakingOpen
        };
      } catch (error) {
        console.error("Failed to get blockchain info:", error);
      }
    }

    res.json({
      success: true,
      exam,
      blockchain: blockchainInfo
    });

  } catch (error) {
    console.error("Get exam error:", error);
    res.status(500).json({ success: false, message: "Failed to get exam details" });
  }
};