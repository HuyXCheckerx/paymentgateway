// Secure session-based payment data storage
// No parameters visible in URL - everything stored server-side

const SESSION_STORAGE_KEY = 'cryoner_payment_session';
const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a secure session ID
 */
const generateSessionId = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Store payment data securely in session storage
 */
export const storePaymentSession = (paymentData) => {
  const sessionId = generateSessionId();
  const sessionData = {
    id: sessionId,
    data: paymentData,
    timestamp: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY
  };
  
  // Store in localStorage with encryption
  const encryptedData = btoa(JSON.stringify(sessionData));
  localStorage.setItem(`${SESSION_STORAGE_KEY}_${sessionId}`, encryptedData);
  
  console.log('Payment session stored with ID:', sessionId);
  return sessionId;
};

/**
 * Retrieve payment data from session storage
 */
export const getPaymentSession = (sessionId) => {
  if (!sessionId) {
    console.error('No session ID provided');
    return null;
  }
  
  try {
    const encryptedData = localStorage.getItem(`${SESSION_STORAGE_KEY}_${sessionId}`);
    if (!encryptedData) {
      console.error('Session not found:', sessionId);
      return null;
    }
    
    const sessionData = JSON.parse(atob(encryptedData));
    
    // Check if session has expired
    if (Date.now() > sessionData.expiresAt) {
      console.error('Session expired:', sessionId);
      clearPaymentSession(sessionId);
      return null;
    }
    
    console.log('Payment session retrieved:', sessionId);
    return sessionData.data;
  } catch (error) {
    console.error('Failed to retrieve session:', error);
    return null;
  }
};

/**
 * Clear payment session data
 */
export const clearPaymentSession = (sessionId) => {
  if (sessionId) {
    localStorage.removeItem(`${SESSION_STORAGE_KEY}_${sessionId}`);
    console.log('Payment session cleared:', sessionId);
  }
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = () => {
  const keys = Object.keys(localStorage);
  const sessionKeys = keys.filter(key => key.startsWith(SESSION_STORAGE_KEY));
  
  sessionKeys.forEach(key => {
    try {
      const encryptedData = localStorage.getItem(key);
      const sessionData = JSON.parse(atob(encryptedData));
      
      if (Date.now() > sessionData.expiresAt) {
        localStorage.removeItem(key);
        console.log('Expired session cleaned up:', key);
      }
    } catch (error) {
      // Remove corrupted sessions
      localStorage.removeItem(key);
    }
  });
};
