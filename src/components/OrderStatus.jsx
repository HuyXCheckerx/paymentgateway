import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowLeft,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import { getOrderById } from '../utils/cryptoUtils';

const OrderStatus = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'confirmed': return 'text-green-400 bg-green-400/10';
      case 'expired': return 'text-red-400 bg-red-400/10';
      case 'failed': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'expired': 
      case 'failed': return <AlertTriangle className="w-5 h-5" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-cyber gradient-text">Loading Order...</h2>
        </motion.div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-cyber text-red-400 mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The order ID "{orderId}" could not be found in our system.
          </p>
          <Link
            to="/"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-cyber gradient-text mb-2">Order Status</h1>
          <p className="text-muted-foreground">Track your payment and order progress</p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="payment-card rounded-2xl p-8 mb-6"
        >
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-cyber text-primary mb-1">#{order.orderId}</h2>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="capitalize font-mono font-medium">{order.status}</span>
            </div>
          </div>

          {/* Order Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-cyber text-primary">Payment Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount (USD):</span>
                  <span className="font-mono">${order.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-mono">{order.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crypto Amount:</span>
                  <span className="font-mono">{order.cryptoAmount?.toFixed(8)} {order.currency}</span>
                </div>
                {order.txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{order.txHash.substring(0, 16)}...</span>
                      <button
                        onClick={() => copyToClipboard(order.txHash)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        {copySuccess ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-cyber text-primary">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono">{order.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telegram:</span>
                  <span className="font-mono">{order.telegram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-mono">{order.userCountry?.country || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Address */}
          {order.paymentAddress && (
            <div className="mb-6">
              <h3 className="text-lg font-cyber text-primary mb-2">Payment Address</h3>
              <div className="flex items-center gap-2 bg-input border border-border rounded-lg p-3">
                <code className="flex-1 text-sm font-mono break-all">{order.paymentAddress}</code>
                <button
                  onClick={() => copyToClipboard(order.paymentAddress)}
                  className="p-2 hover:bg-secondary rounded transition-colors"
                >
                  {copySuccess ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          <div className="mb-6">
            {order.status === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="text-yellow-400 font-medium mb-2">⏳ Payment Pending</h4>
                <p className="text-sm text-muted-foreground">
                  We're waiting for your payment to be confirmed on the blockchain. 
                  This usually takes a few minutes but can take longer during network congestion.
                </p>
              </div>
            )}

            {order.status === 'confirmed' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="text-green-400 font-medium mb-2">✅ Payment Confirmed</h4>
                <p className="text-sm text-muted-foreground">
                  Your payment has been successfully confirmed! Your order is being processed 
                  and you will receive delivery details via Telegram shortly.
                </p>
              </div>
            )}

            {order.status === 'expired' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">⏰ Payment Expired</h4>
                <p className="text-sm text-muted-foreground">
                  The payment window for this order has expired. If you sent payment, 
                  please contact support with your transaction hash.
                </p>
              </div>
            )}

            {order.status === 'failed' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h4 className="text-red-400 font-medium mb-2">❌ Payment Failed</h4>
                <p className="text-sm text-muted-foreground">
                  There was an issue with your payment. Please contact support for assistance.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              New Payment
            </Link>
            
            <a
              href="https://cryoner.store"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Store
            </a>
          </div>
        </motion.div>

        {/* Support Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p className="mb-2">Need help with your order?</p>
          <p>Contact us on Telegram: <span className="text-primary font-mono">{order.telegram}</span></p>
          <p className="mt-2">Please include your Order ID: <span className="text-primary font-mono">#{order.orderId}</span></p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderStatus;
