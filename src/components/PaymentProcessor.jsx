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

const PaymentProcessor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Order data from URL params
  const [orderData, setOrderData] = useState({
    orderId: searchParams.get('orderId') || generateOrderId(),
    amount: parseFloat(searchParams.get('amount')) || 0,
    currency: searchParams.get('currency') || 'SOL',
    email: searchParams.get('email') || '',
    telegram: searchParams.get('telegram') || '',
    timestamp: searchParams.get('timestamp') || new Date().toISOString()
  });

  // Payment states
  const [paymentAddress, setPaymentAddress] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  const [copySuccess, setCopySuccess] = useState('');
  const [isChecking, setIsChecking] = useState(false);

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

  // Auto-check payment status
  useEffect(() => {
    if (paymentStatus === 'pending' && paymentAddress) {
      const interval = setInterval(() => {
        checkPayment();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [paymentStatus, paymentAddress]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);

      // Get user info
      const userIP = await getUserIP();
      const userCountry = await getUserCountry(userIP);
      const userAgent = navigator.userAgent;

      setUserInfo({ userIP, userCountry, userAgent });

      // Get crypto prices and calculate amount
      const prices = await getCryptoPrices();
      const cryptoPrice = prices[orderData.currency];
      const requiredAmount = calculateCryptoAmount(orderData.amount, cryptoPrice);
      setCryptoAmount(requiredAmount);

      // Generate payment address
      const address = generateWalletAddress(orderData.currency);
      setPaymentAddress(address);

      // Generate QR code
      const qrData = `${orderData.currency}:${address}?amount=${requiredAmount}`;
      const qrUrl = await QRCode.toDataURL(qrData);
      setQrCodeUrl(qrUrl);

      // Store order in database
      const fullOrderData = {
        ...orderData,
        paymentAddress: address,
        cryptoAmount: requiredAmount,
        cryptoPrice,
        userIP,
        userCountry,
        userAgent
      };

      await storeOrder(fullOrderData);

      // Send Discord notification
      const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
      if (DISCORD_WEBHOOK_URL !== 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
        await sendDiscordWebhook(DISCORD_WEBHOOK_URL, fullOrderData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsLoading(false);
    }
  };

  const checkPayment = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      const result = await checkPaymentStatus(paymentAddress, cryptoAmount, orderData.currency);
      
      if (result.status === 'confirmed') {
        setPaymentStatus('confirmed');
        await updateOrderStatus(orderData.orderId, 'confirmed', result.txHash);
        
        // Send confirmation webhook
        const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';
        if (DISCORD_WEBHOOK_URL !== 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
          await sendDiscordWebhook(DISCORD_WEBHOOK_URL, {
            ...orderData,
            status: 'PAYMENT CONFIRMED',
            txHash: result.txHash
          });
        }
      }
    } catch (error) {
      console.error('Payment check error:', error);
    }
    setIsChecking(false);
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
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
        <div className="payment-card rounded-2xl p-8 mb-6">
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
                        className="bg-input border border-border rounded px-3 py-2 font-mono text-xs flex-1"
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

              {/* Manual Check Button */}
              <div className="text-center">
                <button
                  onClick={checkPayment}
                  disabled={isChecking}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 inline mr-2" />
                  )}
                  Check Payment Status
                </button>
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
