// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

import "./VerifierRegistry.sol";
import "./StudentRegistry.sol";

contract ExamStaking is Ownable, ReentrancyGuard, Pausable {
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
    }

    mapping(bytes32 => Exam) private exams; // examId → Exam

    event ExamCreated(bytes32 indexed examId, address verifier, uint64 stakeDeadline, uint16 feeBps);
    event ExamCanceled(bytes32 indexed examId);
    event Staked(bytes32 indexed examId, address indexed staker, address indexed candidate, uint256 amount);
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


    function stake(bytes32 examId, address candidate, uint256 amount)
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

        pyusd.safeTransferFrom(msg.sender, address(this), amount);
        e.totalStake += amount;
        e.totalOnCandidate[candidate] += amount;
        e.stakeOf[msg.sender][candidate] += amount;

        emit Staked(examId, msg.sender, candidate, amount);
    }

    /// @notice Finalize results. Only the assigned verifier can finalize.
    function finalizeExam(bytes32 examId, address[] calldata winners)
        external
        nonReentrant
    {
        Exam storage e = exams[examId];
        require(e.verifier != address(0), "Exam not found");
        require(msg.sender == e.verifier, "Not verifier");
        require(!e.finalized && !e.canceled, "Closed");
        require(block.timestamp >= e.stakeDeadline, "Too early");
        require(winners.length > 0, "No winners");

        for (uint256 i = 0; i < winners.length; i++) {
            require(_isCandidate(e, winners[i]), "Bad winner");
            e.isWinner[winners[i]] = true;
        }

        e.finalized = true;
        emit ExamFinalized(examId, winners);
    }

    /// @notice Claim payout after finalization. One-time per staker per exam.
    function claim(bytes32 examId) external nonReentrant {
        Exam storage e = exams[examId];
        require(e.finalized, "Not finalized");
        require(!e.canceled, "Exam canceled");
        require(!e.hasClaimed[msg.sender], "Already claimed");

        (uint256 winnersTotal, uint256 userOnWinners) = _winnerTotals(e, msg.sender);
        require(userOnWinners > 0, "No winning stake");

        uint256 losers = e.totalStake - winnersTotal;
        uint256 fee = (losers * e.feeBps) / 10_000;
        uint256 pool = losers - fee;

        e.hasClaimed[msg.sender] = true;
        e.protocolFee += fee;

        uint256 payout = userOnWinners + (pool * userOnWinners) / winnersTotal;

        pyusd.safeTransfer(msg.sender, payout);
        emit Claimed(examId, msg.sender, payout);
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
}
