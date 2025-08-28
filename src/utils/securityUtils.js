// Security utilities for payment gateway - matches the main site

/**
 * Simple hash function for creating order tokens
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Create a secure token for order data
 */
export const createOrderToken = (orderData, secretKey = 'CRYONER_SECRET_2024') => {
  const dataString = [
    orderData.orderId,
    orderData.finalTotal,
    orderData.paymentMethod.ticker,
    orderData.telegramHandle,
    orderData.timestamp,
    secretKey
  ].join('|');
  
  return simpleHash(dataString);
};

/**
 * Verify order token to ensure data hasn't been tampered with
 */
export const verifyOrderToken = (orderData, token, secretKey = 'CRYONER_SECRET_2024') => {
  const expectedToken = createOrderToken(orderData, secretKey);
  return expectedToken === token;
};

/**
 * Decrypt order data from URL
 */
export const decryptOrderData = (encryptedData) => {
  try {
    const jsonString = atob(encryptedData);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decrypt order data:', error);
    return null;
  }
};
