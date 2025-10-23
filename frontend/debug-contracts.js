// Quick debug script to verify contract addresses
import { CONTRACT_ADDRESSES } from './src/lib/web3Utils.js';

console.log('Frontend Contract Addresses:');
console.log('EXAM_STAKING:', CONTRACT_ADDRESSES.EXAM_STAKING_ADDRESS);
console.log('PYUSD:', CONTRACT_ADDRESSES.PYUSD_ADDRESS);
console.log('STUDENT_REGISTRY:', CONTRACT_ADDRESSES.STUDENT_REGISTRY_ADDRESS);
console.log('VERIFIER_REGISTRY:', CONTRACT_ADDRESSES.VERIFIER_REGISTRY_ADDRESS);

console.log('\nEnvironment Variables:');
console.log('VITE_EXAM_STAKING_ADDRESS:', import.meta.env.VITE_EXAM_STAKING_ADDRESS);
console.log('VITE_PYUSD_ADDRESS:', import.meta.env.VITE_PYUSD_ADDRESS);