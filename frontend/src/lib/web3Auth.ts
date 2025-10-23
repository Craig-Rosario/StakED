import { ethers } from "ethers";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_AUTH_URL || "http://localhost:4000/api/auth";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const loginWithMetaMask = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();

  try {
    const nonceRes = await axios.post(`${API_BASE}/nonce`, { walletAddress });
    const { nonce, isNewUser } = nonceRes.data;

    const message = `StakED Login Nonce: ${nonce}`;
    const signature = await signer.signMessage(message);

    const verifyRes = await axios.post(`${API_BASE}/verify`, {
      walletAddress,
      signature,
      nonce,
      ...(isNewUser && { username: walletAddress.slice(0, 6), role: "student" }),
    });

    const { token, user } = verifyRes.data;
    localStorage.setItem("token", token);
    return user;
  } catch (error: any) {
    console.error("MetaMask login failed:", error.response?.data?.message || error.message);
    throw new Error("Login failed");
  }
};

export const loginWithMetaMaskAsVerifier = async () => {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();

  try {
    const nonceRes = await axios.post(`${API_BASE}/nonce`, { walletAddress });
    const { nonce, isNewUser } = nonceRes.data;

    const message = `StakED Login Nonce: ${nonce}`;
    const signature = await signer.signMessage(message);

    const verifyRes = await axios.post(`${API_BASE}/verify`, {
      walletAddress,
      signature,
      nonce,
      ...(isNewUser && { username: walletAddress.slice(0, 6), role: "verifier" }),
    });

    const { token, user } = verifyRes.data;
    localStorage.setItem("token", token);
    return user;
  } catch (error: any) {
    console.error("MetaMask login failed:", error.response?.data?.message || error.message);
    throw new Error("Login failed");
  }
};
