// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./VerifierRegistry.sol";
import "./StudentRegistry.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract StakEDManager {
    IERC20 public pyusd;
    VerifierRegistry public verifierRegistry;
    StudentRegistry public studentRegistry;

    uint256 public stakeCounter;

    struct Stake {
        uint256 id;
        address staker;
        uint256 amount;
        uint256 classId;
        bool settled;
    }

    mapping(uint256 => Stake) public stakes;

    event StakeCreated(
        uint256 indexed stakeId,
        address indexed staker,
        uint256 amount,
        uint256 classId,
        uint256 timestamp
    );

    event VerificationApproved(
        uint256 indexed stakeId,
        address indexed verifier,
        bool passed,
        uint256 timestamp
    );

    event PayoutExecuted(
        uint256 indexed stakeId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    constructor(
        address _pyusd,
        address _verifierRegistry,
        address _studentRegistry
    ) {
        pyusd = IERC20(_pyusd);
        verifierRegistry = VerifierRegistry(_verifierRegistry);
        studentRegistry = StudentRegistry(_studentRegistry);
    }

    // ----------- STAKE -----------

    function stake(uint256 classId, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(studentRegistry.isRegistered(msg.sender), "Staker not registered");

        // Transfer PYUSD from user to contract
        pyusd.transferFrom(msg.sender, address(this), amount);

        stakeCounter++;
        stakes[stakeCounter] = Stake(stakeCounter, msg.sender, amount, classId, false);

        emit StakeCreated(stakeCounter, msg.sender, amount, classId, block.timestamp);
    }

    // ----------- VERIFICATION & PAYOUT -----------

    function verifierApprove(uint256 stakeId, bool passed) external {
        require(verifierRegistry.isVerifier(msg.sender), "Not an authorized verifier");
        Stake storage s = stakes[stakeId];
        require(!s.settled, "Stake already settled");

        if (passed) {
            uint256 payout = s.amount; // payout = original stake
            s.settled = true;
            pyusd.transfer(s.staker, payout);
            emit PayoutExecuted(stakeId, s.staker, payout, block.timestamp);
        }

        emit VerificationApproved(stakeId, msg.sender, passed, block.timestamp);
    }
}
