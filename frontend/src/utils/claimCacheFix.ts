/**
 * Quick fix for "Already Claimed" errors
 * Add this to your frontend components to prevent caching issues
 */

// 1. Add this function to your utils
export const clearClaimCache = () => {
  // Clear localStorage cache for claims
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('claim') || key.includes('stake') || key.includes('exam'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage as well
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('claim') || key.includes('stake') || key.includes('exam'))) {
      sessionKeysToRemove.push(key);
    }
  }
  sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
};


// 3. Add this meta tag to your HTML head (if possible)
// <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
// <meta http-equiv="Pragma" content="no-cache">
// <meta http-equiv="Expires" content="0">

console.log("✅ Cache clearing utilities loaded");
console.log("Use clearClaimCache() before attempting claims to avoid 'already claimed' errors");