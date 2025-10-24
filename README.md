# StakED - The On-Chain Confidence Market 🏆

### A Web3 Platform for Academic Performance Staking

**StakED** is a decentralized application (dApp) built to **gamify academic motivation** and ensure integrity in grading. Students stake tokens on their predicted academic performance, while verifiers (teachers/examiners) commit and reveal grades on-chain using a verifiable process. Winners earn a proportional share of the forfeited stakes from those who failed to meet their goals.

---

## 🏅 Partner Tracks & Prizes

StakED leverages cutting-edge technologies from our amazing partners to deliver a seamless Web3 experience:

| Partner | Integration | Track/Prize |
| :--- | :--- | :--- |
| **🔍 Blockscout** | **Analytics SDK** - Real-time blockchain analytics, transaction tracking, and user insights for comprehensive platform monitoring | **Blockscout Track** |
| **🤖 Autoscout** | **Payment & Transaction Synchronization** - Automated payment processing, smart contract interaction optimization, and seamless transaction management | **Autoscout Track** |
| **⚒️ Hardhat** | **Smart Contract Deployment** - Professional-grade development environment for testing, deploying, and managing Solidity contracts | **Hardhat Track** |
| **💰 PayPal PYUSD** | **Staking Token** - PayPal USD as the primary payment token for all staking, rewards, and transactions, providing stability and regulatory compliance | **PayPal PYUSD Track** |

*These integrations showcase how modern Web3 development can leverage enterprise-grade tools and stablecoins to create production-ready decentralized applications.*

### 🤝 Detailed Partner Implementations

#### 🔍 Blockscout Analytics SDK Integration
- **Real-time transaction monitoring** for all staking and claim activities across the platform
- **Comprehensive user analytics dashboard** showing individual staking history, success rates, and total earnings
- **Contract interaction tracking** providing detailed insights into platform usage patterns
- **Implementation**: Integrated throughout frontend analytics components and backend monitoring systems for complete visibility

#### 🤖 Autoscout Payment & Transaction Synchronization
- **Automated payment processing pipeline** ensuring seamless PYUSD transfers between users
- **Smart contract interaction optimization** reducing gas costs and eliminating failed transaction scenarios
- **Advanced transaction synchronization** maintaining consistency between on-chain events and off-chain database records
- **Implementation**: Core backend API middleware managing all payment flows and transaction lifecycle management

#### ⚒️ Hardhat Professional Development Environment
- **Enterprise-grade smart contract development** with comprehensive testing suites and deployment automation
- **Sepolia testnet deployment infrastructure** featuring automated contract verification and configuration management
- **Contract upgradeability frameworks** enabling seamless updates and migration scripts for production deployments
- **Implementation**: Complete development workflow from local testing to production deployment with full CI/CD integration

#### 💰 PayPal PYUSD Stablecoin Integration
- **Regulatory-compliant USD stablecoin** providing price stability for all academic staking activities
- **Enterprise-grade financial infrastructure** backed by PayPal's industry-leading payment processing capabilities
- **Seamless fiat on/off ramp integration** enabling easy user onboarding without complex crypto acquisition
- **Implementation**: Primary transaction token for all platform operations including staking, rewards distribution, and fee collection

---

## 🚀 Key Features

| Feature | Description | On-Chain/Off-Chain |
| :--- | :--- | :--- |
| **Self-Staking** | Students lock tokens to bet on their own success (e.g., scoring $\ge 75\%$ on an exam). | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Peer Staking** | Students can stake on the expected performance of their classmates, creating a dynamic, peer-driven confidence market. | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Verifier Integrity** | Verifiers can create exams, set deadlines, and manage classes. The platform uses a **commit-reveal** process for grading to prevent results tampering. | On-Chain (Verifier Registry, Exam Management) |
| **Prediction-Based Payout** | Winners are determined by accuracy: **actual score $\ge$ predicted score**. Forfeited stakes from losers are distributed among winning stakers. | On-Chain (Calculated in `ExamStaking.claim()`) |
| **PYUSD as Staking Token** | **PayPal USD (PYUSD)** is used as the base staking and reward token, providing a stable, regulated asset for financial incentives. | On-Chain (via `IERC20` interface) |

---

## 🛠️ Technology Stack

| Component | Technology | Description | Partner Integration |
| :--- | :--- | :--- | :--- |
| **Frontend** | **React**, **TypeScript**, **Vite**, ShadCN UI | Student and Verifier Dashboards | - |
| **Backend (API)** | **Node.js**, **Express**, **MongoDB** | Off-chain data (user profiles, class/exam metadata), and API for the frontend | **🤖 Autoscout** - Transaction sync |
| **Smart Contracts** | **Solidity** (`0.8.28`), **Hardhat v3** | Core logic for staking, prediction-based winner determination, and payout distribution | **⚒️ Hardhat** - Deployment & testing |
| **Web3 Integration** | **Ethers.js** | Handles wallet connections, transaction signing, and contract calls | - |
| **Analytics** | **Blockscout SDK** | Real-time blockchain analytics and transaction monitoring | **🔍 Blockscout** - Analytics integration |
| **Payment Token** | **PayPal USD (PYUSD)** | Stable, regulated USD token for all staking and rewards | **💰 PayPal PYUSD** - Primary token |

---

## 🏗️ Smart Contract Architecture

The core functionality is managed by modular Solidity contracts, emphasizing separation of concerns for clarity and security.

| Contract | Purpose | Key Roles |
| :--- | :--- | :--- |
| `ExamStaking.sol` | Main interaction point for staking, grading, and reward payout. | `Owner`, `Verifier`, `Student` |
| `VerifierRegistry.sol` | Manages the list of authorized teacher/examiner wallet addresses. | `onlyAdmin`, `isVerifier` |
| `StudentRegistry.sol` | Manages registration of student wallet addresses. | `onlyAdmin`, `isRegistered` |

### Key Functions (in `ExamStaking.sol`)

| Function | Purpose | On-Chain Action |
| :--- | :--- | :--- |
| `stake(..., uint256 predictedScore)` | Transfers PYUSD and records the stake on-chain along with the expected score. | `pyusd.safeTransferFrom(msg.sender, address(this), amount)` |
| `setStudentScores(..., uint256[] scores)` | **Verifier** submits final scores. The contract determines winners based on `actual_score >= predicted_score`. | Sets `e.actualScores` and `e.isWinner` |
| `distributeRewards(bytes32 examId)` | Finalizes the exam and initiates the reward pool distribution logic. | Sets `e.finalized = true` |
| `claim(bytes32 examId)` | Calculates and sends the appropriate reward (original stake + proportional share of loser pool) to the staker. | `pyusd.safeTransfer(msg.sender, finalAmount)` |

---

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
    # Recommended: npm run deploy:final to use the final prediction-based contract
    ```

### 2. Backend Setup (`backend/`)

1.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
2.  **Configure**: Create a `.env` file for **`MONGO_URI`**, `JWT_SECRET`, `PORT`, and your Sepolia RPC/Private Key.
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
2.  **Configure**: Update environment variables (`.env` file) with deployed contract addresses and the backend API URL.
3.  **Run**: Start the React application.
    ```bash
    npm run dev
    ```