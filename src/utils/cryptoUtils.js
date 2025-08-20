// Crypto payment utilities

/**
 * Generate unique order ID
 */
export const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CRY-${year}${month}${day}-${hours}${minutes}${seconds}-${randomChars}`;
};

/**
 * Get user's IP address
 */
export const getUserIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return 'Unknown';
  }
};

/**
 * Get user's country based on IP
 */
export const getUserCountry = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get country:', error);
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
      region: 'Unknown'
    };
  }
};

/**
 * Get current crypto prices
 */
export const getCryptoPrices = async () => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price');
    const data = await response.json();
    
    const prices = {};
    data.forEach(item => {
      if (item.symbol === 'SOLUSDT') prices.SOL = parseFloat(item.price);
      if (item.symbol === 'BTCUSDT') prices.BTC = parseFloat(item.price);
      if (item.symbol === 'ETHUSDT') prices.ETH = parseFloat(item.price);
    });
    
    prices.USDT = 1; // USDT is always 1 USD
    return prices;
  } catch (error) {
    console.error('Failed to get crypto prices:', error);
    return { SOL: 100, BTC: 45000, ETH: 2500, USDT: 1 }; // Fallback prices
  }
};

/**
 * Calculate crypto amount from USD
 */
export const calculateCryptoAmount = (usdAmount, cryptoPrice) => {
  return usdAmount / cryptoPrice;
};

/**
 * Generate crypto wallet addresses (mock - replace with real wallet generation)
 */
export const generateWalletAddress = (crypto) => {
  const addresses = {
    SOL: 'CryonerSol' + Math.random().toString(36).substring(2, 15),
    BTC: '1CryonerBtc' + Math.random().toString(36).substring(2, 15),
    ETH: '0xCryonerEth' + Math.random().toString(36).substring(2, 15),
    USDT: 'TCryonerUsdt' + Math.random().toString(36).substring(2, 15)
  };
  
  return addresses[crypto] || 'InvalidAddress';
};

/**
 * Send Discord webhook notification
 */
export const sendDiscordWebhook = async (webhookUrl, orderData) => {
  const embed = {
    title: "💳 Payment Processing Started",
    color: 0x00FFFF,
    fields: [
      {
        name: "📋 Order ID",
        value: orderData.orderId,
        inline: true
      },
      {
        name: "💰 Amount",
        value: `$${orderData.amount} USD`,
        inline: true
      },
      {
        name: "💎 Payment Method",
        value: orderData.currency,
        inline: true
      },
      {
        name: "📧 Contact",
        value: `**Email:** ${orderData.email || 'Not provided'}\n**Telegram:** ${orderData.telegram}`,
        inline: false
      },
      {
        name: "🌍 Location",
        value: `**IP:** ${orderData.userIP}\n**Country:** ${orderData.userCountry}`,
        inline: false
      },
      {
        name: "🏦 Payment Address",
        value: orderData.paymentAddress,
        inline: false
      }
    ],
    footer: {
      text: "Cryoner Payment Processor",
      icon_url: "https://cryoner.store/log0.png"
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
    return false;
  }
};

/**
 * Check payment status (mock - replace with real blockchain checking)
 */
export const checkPaymentStatus = async (address, expectedAmount, currency) => {
  // Mock payment checking - replace with real blockchain API calls
  return new Promise((resolve) => {
    setTimeout(() => {
      const random = Math.random();
      if (random > 0.7) {
        resolve({ status: 'confirmed', amount: expectedAmount });
      } else if (random > 0.3) {
        resolve({ status: 'pending', amount: 0 });
      } else {
        resolve({ status: 'not_found', amount: 0 });
      }
    }, 2000);
  });
};

/**
 * Store order in database (mock - replace with real database)
 */
export const storeOrder = async (orderData) => {
  try {
    // Mock storage - replace with real database
    const orders = JSON.parse(localStorage.getItem('paymentOrders') || '[]');
    orders.push({
      ...orderData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('paymentOrders', JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error('Failed to store order:', error);
    return false;
  }
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  try {
    const orders = JSON.parse(localStorage.getItem('paymentOrders') || '[]');
    return orders.find(order => order.orderId === orderId);
  } catch (error) {
    console.error('Failed to get order:', error);
    return null;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status, txHash = null) => {
  try {
    const orders = JSON.parse(localStorage.getItem('paymentOrders') || '[]');
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();
      if (txHash) orders[orderIndex].txHash = txHash;
      
      localStorage.setItem('paymentOrders', JSON.stringify(orders));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to update order status:', error);
    return false;
  }
};
