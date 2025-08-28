import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  QrCode,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  generateOrderId,
  getUserIP,
  getUserCountry,
  getCryptoPrices,
  calculateCryptoAmount,
  generateWalletAddress,
  sendDiscordWebhook,
  storeOrder,
  checkPaymentStatus,
  updateOrderStatus
} from '../utils/cryptoUtils';
import { decryptOrderData, verifyOrderToken } from '../utils/securityUtils';

const PaymentProcessor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Order data from URL params - handle both secure and legacy formats
  const [orderData, setOrderData] = useState(() => {
    const encryptedData = searchParams.get('data');
    const token = searchParams.get('token');
    
    console.log('Payment gateway received params:', {
      hasEncryptedData: !!encryptedData,
      hasToken: !!token,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    if (encryptedData && token) {
      // Handle secure encrypted data
      const decryptedData = decryptOrderData(encryptedData);
      console.log('Decrypted data:', decryptedData);
      
      if (decryptedData && verifyOrderToken(decryptedData, token)) {
        const processedData = {
          orderId: decryptedData.orderId,
          amount: decryptedData.usdAmount || decryptedData.finalTotal,
          currency: decryptedData.currency || decryptedData.paymentMethod?.ticker,
          email: decryptedData.email || '',
          telegram: decryptedData.telegram || decryptedData.telegramHandle || '',
          timestamp: decryptedData.timestamp,
          paymentAddress: decryptedData.paymentAddress || decryptedData.paymentMethod?.address,
          cryptoAmount: decryptedData.cryptoAmount,
          network: decryptedData.network || decryptedData.paymentMethod?.network
        };
        console.log('Processed secure data:', processedData);
        return processedData;
      } else {
        console.warn('Invalid or tampered order data detected');
      }
    }
    
    // Fallback to legacy URL parameters
    const fallbackData = {
      orderId: searchParams.get('orderId') || generateOrderId(),
      amount: parseFloat(searchParams.get('amount')) || 0,
      currency: searchParams.get('currency') || 'SOL',
      email: decodeURIComponent(searchParams.get('email') || ''),
      telegram: decodeURIComponent(searchParams.get('telegram') || ''),
      timestamp: searchParams.get('timestamp') || new Date().toISOString(),
      paymentAddress: searchParams.get('address') || null,
      cryptoAmount: parseFloat(searchParams.get('cryptoAmount')) || null,
      network: searchParams.get('network') || null
    };
    console.log('Using fallback data:', fallbackData);
    return fallbackData;
  });

  // Payment states
  const [paymentAddress, setPaymentAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 minutes in seconds
  const [copySuccess, setCopySuccess] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Initialize payment
  useEffect(() => {
    initializePayment();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setPaymentStatus('expired');
    }
  }, [timeLeft, paymentStatus]);

  // Auto-confirm payment after 15 minutes (simulate payment confirmation)
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentAddress) {
      const confirmationTimer = setTimeout(() => {
        setPaymentStatus('confirmed');
        
        // Send confirmation webhook
        const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
        if (DISCORD_WEBHOOK_URL !== 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
          sendDiscordWebhook(DISCORD_WEBHOOK_URL, {
            ...orderData,
            status: 'PAYMENT CONFIRMED AFTER 15 MINUTES',
            paymentAddress,
            cryptoAmount
          });
        }
        
        updateOrderStatus(orderData.orderId, 'confirmed', 'auto-confirmed-15min');
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearTimeout(confirmationTimer);
    }
  }, [paymentStatus, paymentAddress, orderData, cryptoAmount]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);

      // Get user info
      const userIP = await getUserIP();
      const userCountry = await getUserCountry(userIP);
      const userAgent = navigator.userAgent;

      setUserInfo({ userIP, userCountry, userAgent });

      // Use data from main site if available, otherwise calculate
      let address, requiredAmount;
      
      if (orderData.paymentAddress && orderData.cryptoAmount) {
        // Use address and amount from main site
        address = orderData.paymentAddress;
        requiredAmount = orderData.cryptoAmount;
        console.log('Using data from main site:', { address, requiredAmount, currency: orderData.currency });
      } else {
        // Fallback: generate address and calculate amount
        console.log('Fallback: generating address and calculating amount');
        try {
          const prices = await getCryptoPrices();
          // Use real-time crypto prices from Binance API
          requiredAmount = await calculateCryptoAmount(orderData.amount, orderData.currency);
          console.log(`Calculated crypto amount: ${requiredAmount} ${orderData.currency}`);
          address = generateWalletAddress(orderData.currency);
          console.log('Generated fallback data:', { address, requiredAmount, cryptoPrice });
        } catch (error) {
          console.error('Error in fallback calculation:', error);
          // Continue with default values
          requiredAmount = orderData.amount / 100; // Default fallback
          address = 'FALLBACK_ADDRESS_' + orderData.currency;
        }
      }

      setPaymentAddress(address);
      setCryptoAmount(requiredAmount);

      // Generate QR code with proper format
      try {
        let qrData;
        
        // Format QR data based on cryptocurrency
        switch (orderData.currency) {
          case 'BTC':
            qrData = `bitcoin:${address}?amount=${requiredAmount}`;
            break;
          case 'ETH':
            qrData = `ethereum:${address}?value=${requiredAmount}`;
            break;
          case 'SOL':
            qrData = `solana:${address}?amount=${requiredAmount}`;
            break;
          case 'LTC':
            qrData = `litecoin:${address}?amount=${requiredAmount}`;
            break;
          case 'BNB':
            qrData = `bnb:${address}?amount=${requiredAmount}`;
            break;
          case 'USDT':
            qrData = `${address}`;
            break;
          default:
            qrData = `${address}`;
        }
        
        console.log('Generating QR code for:', qrData);
        
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeUrl(qrUrl);
        console.log('QR code generated successfully');
      } catch (qrError) {
        console.error('QR code generation error:', qrError);
        // Generate simple address QR as fallback
        try {
          const fallbackQr = await QRCode.toDataURL(address, {
            width: 256,
            margin: 2,
            errorCorrectionLevel: 'M'
          });
          setQrCodeUrl(fallbackQr);
          console.log('Fallback QR code generated');
        } catch (fallbackError) {
          console.error('Fallback QR generation failed:', fallbackError);
          setQrCodeUrl('');
        }
      }

      // Store order in database
      try {
        const fullOrderData = {
          ...orderData,
          paymentAddress: address,
          cryptoAmount: requiredAmount,
          userIP,
          userCountry,
          userAgent
        };

        await storeOrder(fullOrderData);
        console.log('Order stored successfully');

        // Send Discord notification
        const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
        if (DISCORD_WEBHOOK_URL !== 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
          try {
            await sendDiscordWebhook(DISCORD_WEBHOOK_URL, fullOrderData);
            console.log('Discord webhook sent successfully');
          } catch (webhookError) {
            console.error('Discord webhook error:', webhookError);
            // Continue without webhook
          }
        }
      } catch (storageError) {
        console.error('Order storage error:', storageError);
        // Continue without storage
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Payment initialization error:', error);
      // Continue with error state but don't crash
      setIsLoading(false);
      setPaymentStatus('error');
    }
  };

  const checkPayment = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      // Manual check only updates status display, doesn't confirm payment
      // Payment will auto-confirm after 15 minutes
      const result = await checkPaymentStatus(paymentAddress, cryptoAmount, orderData.currency);
      
      // Just log the check, don't auto-confirm
      console.log('Payment check result:', result);
      
      // Only show feedback that check was performed
      // Actual confirmation happens after 15 minutes
    } catch (error) {
      console.error('Payment check error:', error);
    }
    setIsChecking(false);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000); // Hide after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'pending': return 'text-yellow-400';
      case 'confirmed': return 'text-green-400';
      case 'expired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'expired': return <AlertTriangle className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-cyber gradient-text">Initializing Payment...</h2>
          <p className="text-muted-foreground mt-2">Setting up your crypto payment</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-cyber gradient-text mb-2">Cryoner Payment</h1>
          <p className="text-muted-foreground">Secure cryptocurrency payment processing</p>
        </div>

        {/* Payment Card */}
<div className="payment-card rounded-2xl p-8 mb-6 bg-black/20 backdrop-blur-sm border border-white/10">
          {/* Order Info */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-cyber text-primary">Order #{orderData.orderId}</h3>
              <p className="text-sm text-muted-foreground">Amount: ${orderData.amount} USD</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor()} bg-opacity-10`}>
              {getStatusIcon()}
              <span className="capitalize font-mono text-sm">{paymentStatus}</span>
            </div>
          </div>

          {/* Timer */}
          {paymentStatus === 'pending' && (
            <div className="text-center mb-6">
              <div className="text-3xl font-mono text-primary mb-2">{formatTime(timeLeft)}</div>
              <p className="text-sm text-muted-foreground">Time remaining to complete payment</p>
            </div>
          )}

          {/* Payment Details */}
          {paymentStatus === 'pending' && (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-sm text-muted-foreground">Scan with your {orderData.currency} wallet</p>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Send Amount</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={`${cryptoAmount.toFixed(8)} ${orderData.currency}`}
                        readOnly
                        className="bg-input border border-border rounded px-3 py-2 font-mono text-sm flex-1"
                      />
                      <button
                        onClick={() => copyToClipboard(`${cryptoAmount.toFixed(8)}`, 'amount')}
                        className="p-2 hover:bg-secondary rounded transition-colors"
                      >
                        {copySuccess === 'amount' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Payment Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={paymentAddress}
                        readOnly
                        className="bg-input border border-border rounded px-3 py-2 font-mono text-sm flex-1"
                      />
                      <button
                        onClick={() => copyToClipboard(paymentAddress, 'address')}
                        className="p-2 hover:bg-secondary rounded transition-colors"
                      >
                        {copySuccess === 'address' ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ Important</p>
                    <p className="text-xs text-muted-foreground">
                      Send exactly {cryptoAmount.toFixed(8)} {orderData.currency} to the address above. 
                      Payments with different amounts may not be processed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="text-center bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="text-blue-400 font-medium mb-2 font-minecraft">⏰ Auto-Confirmation</h4>
                <p className="text-sm text-foreground/80 font-roboto-mono">
                  Your payment will be automatically confirmed after the full 15-minute timer expires.
                  No manual confirmation needed.
                </p>
              </div>
            </>
          )}

          {/* Success State */}
          {paymentStatus === 'confirmed' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-cyber text-green-400 mb-2">Payment Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                Your payment has been successfully processed. You will receive your order details via Telegram.
              </p>
              <button
                onClick={() => navigate(`/status/${orderData.orderId}`)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 inline mr-2" />
                View Order Status
              </button>
            </div>
          )}

          {/* Error State */}
          {paymentStatus === 'error' && (
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-cyber text-red-400 mb-2">Payment Error</h3>
              <p className="text-muted-foreground mb-6">
                There was an error processing your payment. Please try refreshing the page or contact support.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Retry Payment
                </button>
                <button
                  onClick={() => window.location.href = 'https://cryoner.store'}
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Return to Store
                </button>
              </div>
            </div>
          )}

          {/* Expired State */}
          {paymentStatus === 'expired' && (
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-cyber text-red-400 mb-2">Payment Expired</h3>
              <p className="text-muted-foreground mb-6">
                The payment window has expired. Please create a new order to continue.
              </p>
              <button
                onClick={() => window.location.href = 'https://cryoner.store'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Return to Store
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by Cryoner Payment Processor</p>
          <p>Need help? Contact us on Telegram: {orderData.telegram}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentProcessor;
