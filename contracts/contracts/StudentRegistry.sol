// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract StudentRegistry {
    address public admin;
    mapping(address => bool) public registered;

    event StudentRegistered(address indexed student);
    event StudentDeregistered(address indexed student);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function registerStudent(address _student) external onlyAdmin {
        registered[_student] = true;
        emit StudentRegistered(_student);
    }

    function deregisterStudent(address _student) external onlyAdmin {
        registered[_student] = false;
        emit StudentDeregistered(_student);
    }

    function isRegistered(address _student) external view returns (bool) {
        return registered[_student];
    }
}
