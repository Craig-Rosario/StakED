// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import "./VerifierRegistry.sol";
import "./StudentRegistry.sol";

contract ExamStakingFixed is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable pyusd;
    VerifierRegistry public immutable verifierRegistry;
    StudentRegistry public immutable studentRegistry;

    struct Exam {
        address verifier;
        uint64 stakeDeadline;
        bool finalized;
        bool canceled;
        address[] candidates;
        mapping(address => uint256) totalOnCandidate;           
        uint256 totalStake;    
        mapping(address => mapping(address => uint256)) stakeOf; 
        mapping(address => bool) isWinner;                    
        mapping(address => bool) hasClaimed;                     
        uint16 feeBps;
        uint256 protocolFee;
        mapping(address => uint256) actualScores;               // Actual scores after grading
        mapping(address => uint256) predictedScores;            // Predicted scores before exam
    }

    mapping(bytes32 => Exam) private exams; // examId → Exam

    event ExamCreated(bytes32 indexed examId, address verifier, uint64 stakeDeadline, uint16 feeBps);
    event ExamCanceled(bytes32 indexed examId);
    event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount, uint256 predictedScore);
    event ExamFinalized(bytes32 indexed examId, address[] winners);
    event Claimed(bytes32 indexed examId, address indexed staker, uint256 payout);
    event FeesWithdrawn(bytes32 indexed examId, address indexed to, uint256 amount);

    constructor(
        address _pyusd,
        address _verifierRegistry,
        address _studentRegistry
    ) Ownable(msg.sender) {
        require(_pyusd != address(0), "Invalid PYUSD address");
        require(_verifierRegistry != address(0), "Invalid verifier registry");
        require(_studentRegistry != address(0), "Invalid student registry");

        pyusd = IERC20(_pyusd);
        verifierRegistry = VerifierRegistry(_verifierRegistry);
        studentRegistry = StudentRegistry(_studentRegistry);
    }


    function createExam(
        bytes32 examId,
        address verifier,
        address[] calldata candidates,
        uint64 stakeDeadline,
        uint16 feeBps
    ) external onlyOwner {
        require(verifierRegistry.isVerifier(verifier), "Not authorized verifier");
        require(candidates.length > 0, "No candidates");
        require(feeBps <= 10_000, "feeBps > 100%");
        Exam storage e = exams[examId];
        require(e.verifier == address(0), "Exam exists");

        e.verifier = verifier;
        e.stakeDeadline = stakeDeadline;
        e.feeBps = feeBps;

        for (uint256 i = 0; i < candidates.length; i++) {
            require(studentRegistry.isRegistered(candidates[i]), "Invalid student");
            e.candidates.push(candidates[i]);
        }

        emit ExamCreated(examId, verifier, stakeDeadline, feeBps);
    }

    function cancelExam(bytes32 examId) external onlyOwner {
        Exam storage e = exams[examId];
        require(e.verifier != address(0), "Exam not found");
        require(!e.finalized, "Already finalized");
        require(!e.canceled, "Already canceled");
        e.canceled = true;
        emit ExamCanceled(examId);
    }

    /// @notice Refund stakes for a canceled exam
    function refund(bytes32 examId, address candidate) external nonReentrant {
        Exam storage e = exams[examId];
        require(e.canceled, "Exam not canceled");
        require(!e.hasClaimed[msg.sender], "Already refunded");
        
        uint256 stakeAmount = e.stakeOf[msg.sender][candidate];
        require(stakeAmount > 0, "No stake to refund");
        
        e.hasClaimed[msg.sender] = true;
        e.stakeOf[msg.sender][candidate] = 0;
        e.totalOnCandidate[candidate] -= stakeAmount;
        e.totalStake -= stakeAmount;
        
        pyusd.safeTransfer(msg.sender, stakeAmount);
        emit Claimed(examId, msg.sender, stakeAmount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice withdraw protocol fees accumulated for a specific exam
    function withdrawFees(bytes32 examId, address to) external onlyOwner nonReentrant {
        require(to != address(0), "bad to");
        Exam storage e = exams[examId];
        uint256 amt = e.protocolFee;
        require(amt > 0, "no fees");
        e.protocolFee = 0;
        pyusd.safeTransfer(to, amt);
        emit FeesWithdrawn(examId, to, amt);
    }


    function stake(bytes32 examId, address candidate, uint256 amount, uint256 predictedScore)
        external
        nonReentrant
        whenNotPaused
    {
        Exam storage e = exams[examId];
        require(e.verifier != address(0), "Exam not found");
        require(!e.canceled && !e.finalized, "Exam closed");
        require(block.timestamp < e.stakeDeadline, "Staking closed");
        require(studentRegistry.isRegistered(msg.sender), "Not student");
        require(_isCandidate(e, candidate), "Invalid candidate");
        require(amount > 0, "Zero amount");
        require(predictedScore <= 100, "Invalid predicted score");

        // Store predicted score for the candidate (only if staking on themselves)
        if (msg.sender == candidate) {
            e.predictedScores[candidate] = predictedScore;
        }

        pyusd.safeTransferFrom(msg.sender, address(this), amount);
        e.totalStake += amount;
        e.totalOnCandidate[candidate] += amount;
        e.stakeOf[msg.sender][candidate] += amount;

        emit Staked(examId, msg.sender, candidate, amount, predictedScore);
    }

    /// @notice Finalize results manually (deprecated - use setStudentScores + distributeRewards instead)
    function finalizeExam(bytes32 examId, address[] calldata winners)
        external
        nonReentrant
    {
        Exam storage e = exams[examId];
        require(e.verifier != address(0), "Exam not found");
        require(msg.sender == e.verifier, "Not verifier");
        require(!e.finalized && !e.canceled, "Closed");
        require(block.timestamp >= e.stakeDeadline, "Too early");

        for (uint256 i = 0; i < winners.length; i++) {
            require(_isCandidate(e, winners[i]), "Bad winner");
            e.isWinner[winners[i]] = true;
        }

        e.finalized = true;
        emit ExamFinalized(examId, winners);
    }

    /// @notice Claim payout after finalization with proportional reward distribution - FIXED VERSION
    function claim(bytes32 examId) external nonReentrant {
        Exam storage e = exams[examId];
        require(e.finalized, "Not finalized");
        require(!e.canceled, "Exam canceled");
        require(!e.hasClaimed[msg.sender], "Already claimed");

        e.hasClaimed[msg.sender] = true;

        uint256 userStake = _getTotalUserStake(e, msg.sender);
        require(userStake > 0, "No stake to claim");

        address[] memory winners = _getWinners(e);
        
        // If no winners, all stakes already sent to staked bank in distributeRewards
        if (winners.length == 0) {
            revert("No winners - stakes sent to staked bank");
        }
        
        // Check if user is a winner (for self-staking claims)
        bool isUserWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == msg.sender) {
                isUserWinner = true;
                break;
            }
        }
        
        // Calculate user's stake on winning candidates (for multistaking)
        uint256 userWinnerStake = _getUserWinnerStake(e, msg.sender);
        
        // User can claim if they are a winner OR if they have stakes on winning candidates
        require(isUserWinner || userWinnerStake > 0, "No winning stake or not a winner");
        
        // Calculate user's proportional reward
        (uint256 totalWinnerStake, uint256 totalLoserStake) = _calculateStakeTotals(e);
        
        uint256 finalAmount;
        
        if (isUserWinner) {
            // User won - they get their full stake back plus proportional rewards
            if (totalLoserStake == 0) {
                // Everyone won - just return original stake
                finalAmount = userStake;
            } else {
                // Proportional distribution: finalAmount = userStake + reward_share
                uint256 rewardShare = (userWinnerStake * totalLoserStake) / totalWinnerStake;
                finalAmount = userWinnerStake + rewardShare;
            }
        } else if (userWinnerStake > 0) {
            // User didn't win but has stakes on winners (multistaking)
            if (totalLoserStake == 0) {
                // Everyone won - return just the winning stakes
                finalAmount = userWinnerStake;
            } else {
                // Proportional distribution for multistaking
                uint256 rewardShare = (userWinnerStake * totalLoserStake) / totalWinnerStake;
                finalAmount = userWinnerStake + rewardShare;
            }
        } else {
            revert("No valid claim");
        }

        pyusd.safeTransfer(msg.sender, finalAmount);
        emit Claimed(examId, msg.sender, finalAmount);
    }

    /// @notice Get total stake amount for a user across all candidates in an exam
    function _getTotalUserStake(Exam storage e, address user) internal view returns (uint256 total) {
        for (uint256 i = 0; i < e.candidates.length; i++) {
            total += e.stakeOf[user][e.candidates[i]];
        }
    }

    /// @notice Set student scores and determine winners based on prediction accuracy
    function setStudentScores(bytes32 examId, address[] calldata students, uint256[] calldata scores) external {
        Exam storage e = exams[examId];
        require(verifierRegistry.isVerifier(msg.sender), "Not authorized verifier");
        require(!e.finalized, "Already finalized");
        require(students.length == scores.length, "Array length mismatch");
        
        // Set actual scores and determine winners based on prediction accuracy
        for (uint256 i = 0; i < students.length; i++) {
            e.actualScores[students[i]] = scores[i];
            uint256 predictedScore = e.predictedScores[students[i]];
            
            // Win condition: actual score >= predicted score
            if (scores[i] >= predictedScore) {
                e.isWinner[students[i]] = true;
            }
        }
    }

    /// @notice Distribute rewards using proportional redistribution logic
    function distributeRewards(bytes32 examId) external {
        Exam storage e = exams[examId];
        require(verifierRegistry.isVerifier(msg.sender), "Not authorized verifier");
        require(!e.finalized, "Already finalized");
        
        address[] memory winners = _getWinners(e);
        address stakedBank = 0x6D41680267986408E5e7c175Ee0622cA931859A4;
        
        // If nobody wins, send entire pool to staked bank
        if (winners.length == 0) {
            uint256 totalAmount = e.totalStake;
            if (totalAmount > 0) {
                pyusd.safeTransfer(stakedBank, totalAmount);
            }
            e.finalized = true;
            emit ExamFinalized(examId, winners);
            return;
        }
        
        // Calculate protocol fee on total stake
        uint256 protocolFee = (e.totalStake * e.feeBps) / 10_000;
        e.protocolFee += protocolFee;
        
        // If everyone wins, no redistribution - winners can claim their original stakes
        if (winners.length == e.candidates.length) {
            e.finalized = true;
            emit ExamFinalized(examId, winners);
            return;
        }
        
        // Mixed results: Winners get proportional share of losers' stakes
        // The actual redistribution math is handled in the claim() function
        // Here we just finalize the exam to enable claiming
        e.finalized = true;
        emit ExamFinalized(examId, winners);
    }

    /// @notice Get student actual score for an exam
    function getStudentScore(bytes32 examId, address student) external view returns (uint256) {
        return exams[examId].actualScores[student];
    }
    
    /// @notice Get student predicted score for an exam
    function getPredictedScore(bytes32 examId, address student) external view returns (uint256) {
        return exams[examId].predictedScores[student];
    }

    /// @notice Check if staking is still open for an exam
    function isStakingOpen(bytes32 examId) external view returns (bool) {
        Exam storage e = exams[examId];
        return !e.finalized && !e.canceled && block.timestamp < e.stakeDeadline;
    }

    function getExam(
        bytes32 examId
    )
        external
        view
        returns (
            address verifier,
            uint64 stakeDeadline,
            bool finalized,
            bool canceled,
            uint16 feeBps,
            uint256 totalStake,
            uint256 protocolFee,
            address[] memory candidates
        )
    {
        Exam storage e = exams[examId];
        require(e.verifier != address(0), "Exam not found");
        verifier = e.verifier;
        stakeDeadline = e.stakeDeadline;
        finalized = e.finalized;
        canceled = e.canceled;
        feeBps = e.feeBps;
        totalStake = e.totalStake;
        protocolFee = e.protocolFee;
        candidates = e.candidates;
    }

    function totalOn(bytes32 examId, address candidate) external view returns (uint256) {
        Exam storage e = exams[examId];
        return e.totalOnCandidate[candidate];
    }

    function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256) {
        Exam storage e = exams[examId];
        return e.stakeOf[staker][candidate];
    }

    function hasClaimed(bytes32 examId, address staker) external view returns (bool) {
        Exam storage e = exams[examId];
        return e.hasClaimed[staker];
    }

    function isWinner(bytes32 examId, address candidate) external view returns (bool) {
        Exam storage e = exams[examId];
        return e.isWinner[candidate];
    }


    function _isCandidate(Exam storage e, address cand) internal view returns (bool) {
        for (uint256 i = 0; i < e.candidates.length; i++) {
            if (e.candidates[i] == cand) return true;
        }
        return false;
    }

    function _winnerTotals(Exam storage e, address staker)
        internal
        view
        returns (uint256 winnersTotal, uint256 userOnWinners)
    {
        for (uint256 i = 0; i < e.candidates.length; i++) {
            address c = e.candidates[i];
            if (e.isWinner[c]) {
                winnersTotal += e.totalOnCandidate[c];
                userOnWinners += e.stakeOf[staker][c];
            }
        }
    }

    function _calculateStakeTotals(Exam storage e) internal view returns (uint256 winnersTotal, uint256 losersTotal) {
        for (uint256 i = 0; i < e.candidates.length; i++) {
            address c = e.candidates[i];
            if (e.isWinner[c]) {
                winnersTotal += e.totalOnCandidate[c];
            } else {
                losersTotal += e.totalOnCandidate[c];
            }
        }
    }
    
    function _getUserWinnerStake(Exam storage e, address user) internal view returns (uint256 userWinnerStake) {
        for (uint256 i = 0; i < e.candidates.length; i++) {
            address c = e.candidates[i];
            if (e.isWinner[c]) {
                userWinnerStake += e.stakeOf[user][c];
            }
        }
    }

    function _getWinners(Exam storage e) internal view returns (address[] memory) {
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < e.candidates.length; i++) {
            if (e.isWinner[e.candidates[i]]) {
                winnerCount++;
            }
        }
        
        address[] memory winners = new address[](winnerCount);
        uint256 index = 0;
        for (uint256 i = 0; i < e.candidates.length; i++) {
            if (e.isWinner[e.candidates[i]]) {
                winners[index] = e.candidates[i];
                index++;
            }
        }
        return winners;
    }
}