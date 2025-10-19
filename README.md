##  StakED - The On-Chain Confidence Market

### A Web3 Platform for Academic Performance Staking

StakED is a decentralized application (dApp) built to gamify academic motivation and ensure integrity in grading. Students stake tokens on their predicted academic performance, while verifiers (teachers/examiners) commit and reveal grades on-chain using a verifiable process. Winners earn a proportional share of the forfeited stakes from those who failed to meet their goals.

***

## 🚀 Key Features

| Feature | Description | On-Chain/Off-Chain |
| :--- | :--- | :--- |
| **Self-Staking** | Students lock tokens to bet on their own success (e.g., scoring $\ge 75\%$ on an exam). | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Peer Staking** | Students can stake on the expected performance of their classmates, creating a dynamic, peer-driven confidence market. | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Verifier Integrity** | Verifiers can create exams, set deadlines, and manage classes. The platform uses a **commit-reveal** process for grading to prevent results tampering. | On-Chain (Verifier Registry, Exam Management) |
| **Stake-Weighted Payout** | Forfeited stakes from losers are distributed among winners in proportion to their initial stake amount. | On-Chain (Calculated in `ExamStaking.claim()`) |
| **PYUSD as Staking Token** | **PayPal USD (PYUSD)** is used as the base staking and reward token, providing a stable, regulated asset for financial incentives. | On-Chain (via `IERC20` interface) |

***

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite, ShadCN UI | Student and Verifier Dashboards. |
| **Backend (API)** | Node.js, Express, MongoDB | Off-chain data (user profiles, class/exam metadata), and API for the frontend. |
| **Smart Contracts** | Solidity (`0.8.17+`), **Hardhat v3** | Core logic for staking, commit-reveal, and payout distribution. |
| **Web3 Integration** | Ethers.js | Handles wallet connections, transaction signing, and contract calls. |

***

## 🏗️ Smart Contract Architecture

The core functionality is managed by modular Solidity contracts, emphasizing separation of concerns for clarity and security.

### 1. `ExamStaking.sol` / `StakEDManager.sol`

This is the main interaction point for staking, verification, and payout logic.

| Function | Purpose | On-Chain Action |
| :--- | :--- | :--- |
| `stake(bytes32 examId, address candidate, uint256 amount, uint256 targetScore)` | Transfers PYUSD and records the stake on-chain. | `pyusd.safeTransferFrom(msg.sender, address(this), amount)` |
| `commitGrades(bytes32 examId, bytes32 commitHash)` | **Verifier** locks a cryptographic hash of the final grades to prevent post-factum manipulation. | Stores `commitHash` |
| `revealGrades(bytes32 examId, uint256[] scores, ...)` | **Verifier** reveals the actual grades, which the contract then uses to determine winners. | Calls `recordRevealedScore` for each student |
| `claim(bytes32 examId)` | Calculates and sends the original stake plus proportional share of the loser pool to the winning staker. | `pyusd.safeTransfer(msg.sender, payout)` |

### 2. Utility Contracts

| Contract | Purpose | Key Roles |
| :--- | :--- | :--- |
| `VerifierRegistry.sol` | Manages the list of authorized teacher/examiner wallet addresses. | `onlyAdmin`, `isVerifier` |
| `StudentRegistry.sol` | Maps wallet addresses to student profiles and manages class enrollments. | `onlyAdmin`, `isStudent` |

***

## 🧑‍💻 Getting Started (Development)

The project is structured into three main directories: `contracts`, `backend`, and `frontend`.

### 1. Smart Contracts Setup (`contracts/`)

1.  **Install Dependencies**:
    ```bash
    cd contracts
    npm install
    ```
2.  **Configure**: Set up your `.env` file with your **Sepolia RPC URL** and private key for deployment.
3.  **Deployment**: Deploy the core contracts, including `VerifierRegistry`, `StudentRegistry`, and `ExamStaking`, to the Sepolia testnet.
    ```bash
    npm run deploy:sepolia
    ```

### 2. Backend Setup (`backend/`)

1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
2.  **Configure**: Create a `.env` file for **`MONGO_URI`**, `JWT_SECRET`, and `PORT`.
3.  **Run**: Start the API server.
    ```bash
    npm run dev
    ```

### 3. Frontend Setup (`frontend/`)

1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Configure**: Update environment variables with deployed contract addresses and the backend API URL.
3.  **Run**: Start the React application.
    ```bash
    npm run dev
    ```