import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, History, AlertCircle } from 'lucide-react';
import businessAPI from '../../services/businessAPI';

const CreditManagement = ({ creditId }) => {
  const [credit, setCredit] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchCreditData();
  }, [creditId]);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      const [creditRes, transRes] = await Promise.all([
        businessAPI.getCreditDetails(creditId),
        businessAPI.getCreditTransactions(creditId)
      ]);
      
      setCredit(creditRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching credit data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setPurchasing(true);
      await businessAPI.purchaseCredit(creditId, parseFloat(amount));
      
      // Refresh data
      await fetchCreditData();
      setAmount('');
      setShowPurchaseForm(false);
    } catch (err) {
      console.error('Error purchasing credit:', err);
      alert('Error purchasing credit: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error loading credit: {error}</p>
      </div>
    );
  }

  const CREDIT_PACKAGES = [
    { amount: 5000, discount: 0, savings: 0 },
    { amount: 10000, discount: 5, savings: 500 },
    { amount: 25000, discount: 10, savings: 2500 },
    { amount: 50000, discount: 15, savings: 7500 },
  ];

  return (
    <div className="space-y-6">
      {/* Current Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Current Balance</h2>
          <CreditCard size={32} />
        </div>
        <p className="text-blue-100 text-sm mb-2">Available Credit</p>
        <p className="text-4xl font-bold mb-4">KES {credit?.balance?.toFixed(2) || 0}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-100">Total Purchased</p>
            <p className="font-semibold">KES {credit?.total_purchased?.toFixed(2) || 0}</p>
          </div>
          <div>
            <p className="text-blue-100">Total Used</p>
            <p className="font-semibold">KES {credit?.total_used?.toFixed(2) || 0}</p>
          </div>
        </div>
      </div>

      {/* Purchase Credit Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Purchase Credit</h3>
          <Plus size={20} className="text-gray-400" />
        </div>

        {showPurchaseForm ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (KES)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.amount}
                  onClick={() => setAmount(pkg.amount)}
                  className="p-3 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
                >
                  <p className="font-semibold text-gray-900">KES {pkg.amount.toLocaleString()}</p>
                  {pkg.discount > 0 && (
                    <p className="text-xs text-green-600 font-semibold">Save {pkg.discount}%</p>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePurchaseCredit}
                disabled={purchasing}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
              >
                {purchasing ? 'Processing...' : 'Confirm Purchase'}
              </button>
              <button
                onClick={() => {
                  setShowPurchaseForm(false);
                  setAmount('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPurchaseForm(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Add Credit
          </button>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <History size={20} className="text-gray-400" />
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount > 0 ? '+' : ''} KES {transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Balance: KES {transaction.balance_after.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditManagement;
