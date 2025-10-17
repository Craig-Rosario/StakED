import { ethers } from "ethers";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/auth";

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
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (err: any) {
    console.error("MetaMask login failed:", err.response?.data || err.message);
    throw new Error(err.response?.data?.message || "Login failed");
  }
};
