import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
networks: {
  hardhat: {
    type: "edr-simulated", // 👈 required for Hardhat 3 internal node
    chainType: "l1",
  },
  localhost: {
    type: "http",          
    chainType: "l1",
    url: "http://127.0.0.1:8545",
  },
  sepolia: {
    type: "http",           
    chainType: "l1",
    url: process.env.SEPOLIA_RPC_URL || "",
    accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
  },
},

};

export default config;
