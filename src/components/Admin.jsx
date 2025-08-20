import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Copy
} from 'lucide-react';

const Admin = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = () => {
    try {
      const storedOrders = JSON.parse(localStorage.getItem('paymentOrders') || '[]');
      setOrders(storedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.telegram?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    try {
      const updatedOrders = orders.map(order => 
        order.orderId === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      );
      
      setOrders(updatedOrders);
      localStorage.setItem('paymentOrders', JSON.stringify(updatedOrders));
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
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

  const exportOrders = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryoner-orders-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'expired': 
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-cyber gradient-text mb-2">Payment Admin</h1>
          <p className="text-muted-foreground">Manage and monitor cryptocurrency payments</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="payment-card rounded-xl p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-input border border-border rounded-lg pl-10 pr-4 py-2 w-full md:w-64 focus:border-primary outline-none transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-input border border-border rounded-lg pl-10 pr-8 py-2 focus:border-primary outline-none transition-colors appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="expired">Expired</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={loadOrders}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportOrders}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-cyber text-primary">{orders.length}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-cyber text-yellow-400">
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-cyber text-green-400">
                {orders.filter(o => o.status === 'confirmed').length}
              </div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-cyber text-primary">
                ${orders.filter(o => o.status === 'confirmed').reduce((sum, o) => sum + o.amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="payment-card rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-cyber text-primary">Order ID</th>
                  <th className="text-left p-4 font-cyber text-primary">Amount</th>
                  <th className="text-left p-4 font-cyber text-primary">Currency</th>
                  <th className="text-left p-4 font-cyber text-primary">Contact</th>
                  <th className="text-left p-4 font-cyber text-primary">Status</th>
                  <th className="text-left p-4 font-cyber text-primary">Created</th>
                  <th className="text-left p-4 font-cyber text-primary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.orderId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-border/50 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-mono text-sm">{order.orderId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono">${order.amount}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono">{order.currency}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div>{order.email || 'No email'}</div>
                        <div className="text-muted-foreground">{order.telegram}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="capitalize text-xs font-medium">{order.status}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-secondary rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.orderId, 'confirmed')}
                            className="p-2 hover:bg-green-500/20 text-green-400 rounded transition-colors"
                            title="Mark as Confirmed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">No orders found</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="payment-card rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-cyber text-primary">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Order ID</label>
                    <div className="font-mono">{selectedOrder.orderId}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className={`flex items-center gap-2 mt-1 ${getStatusColor(selectedOrder.status)} w-fit px-2 py-1 rounded`}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="capitalize">{selectedOrder.status}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Amount (USD)</label>
                    <div className="font-mono">${selectedOrder.amount}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Currency</label>
                    <div className="font-mono">{selectedOrder.currency}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Payment Address</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-input border border-border rounded px-2 py-1 text-xs flex-1 break-all">
                      {selectedOrder.paymentAddress}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedOrder.paymentAddress, 'address')}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                    >
                      {copySuccess === 'address' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <div>{selectedOrder.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Telegram</label>
                    <div className="font-mono">{selectedOrder.telegram}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">IP Address</label>
                    <div className="font-mono">{selectedOrder.userIP}</div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Country</label>
                    <div>{selectedOrder.userCountry?.country || 'Unknown'}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">User Agent</label>
                  <div className="text-xs bg-input border border-border rounded p-2 break-all">
                    {selectedOrder.userAgent}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Created</label>
                    <div className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                  </div>
                  {selectedOrder.updatedAt && (
                    <div>
                      <label className="text-sm text-muted-foreground">Updated</label>
                      <div className="text-sm">{new Date(selectedOrder.updatedAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {selectedOrder.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.orderId, 'confirmed');
                        setSelectedOrder({ ...selectedOrder, status: 'confirmed' });
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Confirmed
                    </button>
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.orderId, 'failed');
                        setSelectedOrder({ ...selectedOrder, status: 'failed' });
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Mark as Failed
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Admin;
