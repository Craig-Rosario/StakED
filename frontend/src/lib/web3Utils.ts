import { ethers } from "ethers";

export const CONTRACTS = {
  PYUSD_ADDRESS: "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9",
  EXAM_STAKING_ADDRESS: "0xEe41CA98C7E2f2050127111edf3bac094dE24029",
  STUDENT_REGISTRY_ADDRESS: "0xda43a6b8f99F804B1455109388DC363443478b90",
  VERIFIER_REGISTRY_ADDRESS: "0xAAB09f246A15C56370d3Bc2f1F9f8765156E5EB5"
};

export const ABIS = {
  PYUSD: [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function transfer(address to, uint256 amount) external returns (bool)"
  ],
  
  EXAM_STAKING: [
    "function stake(bytes32 examId, address candidate, uint256 amount) external",
    "function claim(bytes32 examId) external",
    "function refund(bytes32 examId, address candidate) external",
    "function createExam(bytes32 examId, address verifier, address[] candidates, uint64 stakeDeadline, uint16 feeBps) external",
    "function setStudentScores(bytes32 examId, address[] students, uint256[] scores, uint256 passingScore) external",
    "function distributeRewards(bytes32 examId) external",
    "function getExam(bytes32 examId) external view returns (address verifier, uint64 stakeDeadline, bool finalized, bool canceled, uint16 feeBps, uint256 totalStake, uint256 protocolFee, address[] memory candidates)",
    "function stakeOf(bytes32 examId, address staker, address candidate) external view returns (uint256)",
    "function totalOn(bytes32 examId, address candidate) external view returns (uint256)",
    "function getStudentScore(bytes32 examId, address student) external view returns (uint256)",
    "function isStakingOpen(bytes32 examId) external view returns (bool)",
    "function isWinner(bytes32 examId, address candidate) external view returns (bool)",
    "function hasClaimed(bytes32 examId, address staker) external view returns (bool)"
  ],
  
  STUDENT_REGISTRY: [
    "function registerStudent(address student) external",
    "function isRegistered(address student) external view returns (bool)"
  ]
};

// Utility functions
export class Web3Utils {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    
    return await this.signer.getAddress();
  }

  async checkNetwork(): Promise<void> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const network = await this.provider.getNetwork();
    if (network.chainId !== 11155111n) {
      throw new Error("Please switch to Sepolia testnet");
    }
  }

  async getPyusdBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.PYUSD_ADDRESS, ABIS.PYUSD, this.provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 6); 
  }

  async approvePyusd(amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.PYUSD_ADDRESS, ABIS.PYUSD, this.signer);
    const amountWei = ethers.parseUnits(amount, 6);
    
    return await contract.approve(CONTRACTS.EXAM_STAKING_ADDRESS, amountWei);
  }

  async checkPyusdAllowance(owner: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.PYUSD_ADDRESS, ABIS.PYUSD, this.provider);
    const allowance = await contract.allowance(owner, CONTRACTS.EXAM_STAKING_ADDRESS);
    return ethers.formatUnits(allowance, 6);
  }

  async stakeOnExam(examId: string, candidateAddress: string, amount: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    const amountWei = ethers.parseUnits(amount, 6);
    
    return await contract.stake(examIdBytes, candidateAddress, amountWei);
  }

  async getExamInfo(examId: string): Promise<any> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.provider);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    const [verifier, stakeDeadline, finalized, canceled, feeBps, totalStake, protocolFee, candidates] = 
      await contract.getExam(examIdBytes);
    
    return {
      verifier,
      stakeDeadline: Number(stakeDeadline),
      finalized,
      canceled,
      feeBps: Number(feeBps),
      totalStake: ethers.formatUnits(totalStake, 6),
      protocolFee: ethers.formatUnits(protocolFee, 6),
      candidates
    };
  }

  async getUserStake(examId: string, userAddress: string, candidateAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.provider);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    const stake = await contract.stakeOf(examIdBytes, userAddress, candidateAddress);
    return ethers.formatUnits(stake, 6);
  }

  async getTotalStakeOnCandidate(examId: string, candidateAddress: string): Promise<string> {
    if (!this.provider) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.provider);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    const total = await contract.totalOn(examIdBytes, candidateAddress);
    return ethers.formatUnits(total, 6);
  }

  async claimRewards(examId: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    return await contract.claim(examIdBytes);
  }

  async refundStake(examId: string, candidateAddress: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    return await contract.refund(examIdBytes, candidateAddress);
  }

  // Verifier functions
  async setStudentScores(examId: string, students: string[], scores: number[], passingScore: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    return await contract.setStudentScores(examIdBytes, students, scores, passingScore);
  }

  async distributeRewards(examId: string): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    return await contract.distributeRewards(examIdBytes);
  }

  async createExam(examId: string, verifier: string, candidates: string[], stakeDeadline: number, feeBps: number): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error("Wallet not connected");
    }

    const contract = new ethers.Contract(CONTRACTS.EXAM_STAKING_ADDRESS, ABIS.EXAM_STAKING, this.signer);
    const examIdBytes = ethers.keccak256(ethers.toUtf8Bytes(examId));
    
    return await contract.createExam(examIdBytes, verifier, candidates, stakeDeadline, feeBps);
  }
}

export const web3Utils = new Web3Utils();

export const getExamIdBytes = (examId: string): string => {
  return ethers.keccak256(ethers.toUtf8Bytes(examId));
};

export const formatPyusd = (amount: string, decimals: number = 2): string => {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
};