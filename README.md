# StakED - The On-Chain Confidence Market 🏆

### Stake on Performance. Earn on Results.

**StakED** is a decentralized, gamified platform that lets students stake on academic performance using **PayPal’s PYUSD stablecoin** and earn rewards based on real, verified results. It brings the transparency of **Blockscout**, the stability of **PYUSD**, and the reliability of **Hardhat 3** into one on-chain ecosystem that rewards learning through incentives.

---

## 🚀 Live Links

- **Deployed:** [[staked.vercel.app](https://stak-ed.vercel.app/)]
- **Autoscout Explorer:** [staked.cloud.blockscout.com](https://staked.cloud.blockscout.com/)

---

### 🧪 For Judging Access

For the judging process, we’ve provided **verifier access** inside the app.
You will need **two MetaMask accounts**:
- One to log in as a **student**
- One to log in as a **verifier**

A quick-access button for the **Verifier Dashboard** is available on the landing page for easy testing.

---

## 🧩 Partner Integrations

Below are the hackathon partner tracks StakED integrates with — **PayPal (PYUSD)**, **Blockscout**, and **Hardhat 3**

### 💠 **PayPal USD (PYUSD)**

| Criteria | Description | How StakED Satisfies |
|-----------|--------------|----------------------|
| **About** | PayPal USD (PYUSD) is a stablecoin enabling secure digital paymentss. | StakED uses PYUSD as the **core staking and reward currency**, ensuring stable and transparent academic rewards. |
| **Functionality** | How well does the project work technically? | Fully functional staking, claiming, and reward logic using `SafeERC20` transfers of PYUSD on Sepolia Testnet. |
| **Payments Applicability** | How does it address real-world payment challenges? | PYUSD eliminates volatility, allowing students worldwide to earn real-value incentives for performance, bridging **DeFi** and **education**. |
| **Novelty** | How unique is the concept? | StakED introduces an on-chain education staking platform that uses a stablecoin (PYUSD) to enable transparent, performance-based academic rewards. |
| **UX** | Is the experience intuitive? | Clean ShadCN + Tailwind with a neo-brutalism styled interface with transparent staking flow and Blockscout-linked transaction views. |
| **Open-Source** | Public and composable code? | 100% open-source on GitHub. |
| **Business Plan** | Can this evolve into a viable business? | StakED can scale into a **learning incentive platform** for schools or edtechs using PYUSD-based micro-rewards to incentivze studying. |

> 🧠 **In essence:** “PYUSD brings PayPal’s trust and stability into DeFi staking, finally making real-world, dollar-backed incentives possible for education.”

---

### 🟣 **Blockscout**

| Criteria | Description | How StakED Satisfies |
|-----------|--------------|----------------------|
| **Autoscout Use** | Did we deploy a custom explorer? | Yes — [staked.cloud.blockscout.com](https://staked.cloud.blockscout.com) on Sepolia, tracking all contract transactions. |
| **SDK Integration** | Did the app use Blockscout’s SDK meaningfully? | Yes — real-time transaction history, win-rate tracking, toast notifications, and on-chain analytics powered by the SDK & API (v2). |
| **Transparency** | Are transactions verifiable? | All staking, claim, and exam interactions link directly to Blockscout explorer pages. |
| **Originality** | How unique is the use case? | Combining education, staking, and on-chain analytics. |

> 🔍 **“Blockscout makes StakED fully transparent — users can verify every stake, payout, and result.”**

---

### 🛠️ **Hardhat 3**

| Criteria | Description | How StakED Satisfies |
|-----------|--------------|----------------------|
| **Version Compliance** | Uses Hardhat 3.0.0+? | Yes — explicitly built with v3 and its new compiler/runtime. |
| **Testing** | Are tests implemented with Hardhat 3? | Yes — smart contract deployment and staking flow tested using Solidity test framework. |
| **Performance** | Uses Hardhat’s new features? | Verified faster compile & local simulation with Hardhat Network. |
| **Reliability** | Is Hardhat integral to the build process? | Entire contract lifecycle — from compilation to testnet deployment — runs through Hardhat scripts. |

> 🧱 **“Every contract in StakED was built and validated with Hardhat 3 — ensuring stable, production-grade deployment.”**

---

## 🚀 Key Features

| Feature | Description | On-Chain/Off-Chain |
| :--- | :--- | :--- |
| **Self-Staking** | Students lock tokens to bet on their own success (e.g., scoring $\ge 75\%$ on an exam). | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Peer Staking** | Students can stake on the expected performance of their classmates, creating a dynamic, peer-driven confidence market. | Hybrid (Token Transfer $\rightarrow$ On-Chain Stake) |
| **Verifier Integrity** | Verifiers can create exams, set deadlines, and manage classes. The platform uses a **commit-reveal** process for grading to prevent results tampering. | On-Chain (Verifier Registry, Exam Management) |
| **Prediction-Based Payout** | Winners are determined by accuracy: **actual score $\ge$ predicted score**. Forfeited stakes from losers are distributed among winning stakers. | On-Chain |
| **PYUSD as Staking Token** | **PayPal USD (PYUSD)** is used as the base staking and reward token, providing a stable, regulated asset for financial incentives. | On-Chain |

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
