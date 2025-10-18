// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract VerifierRegistry {
    address public admin;
    mapping(address => bool) public verifiers;

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function addVerifier(address _verifier) external onlyAdmin {
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyAdmin {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    function isVerifier(address _verifier) external view returns (bool) {
        return verifiers[_verifier];
    }
}
