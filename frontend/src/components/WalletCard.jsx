import { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { walletAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export default function WalletCard() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topping, setTopping] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await walletAPI.getWallet();
      setWallet(response.data);
    } catch (error) {
      console.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum top-up is KSh 100');
      return;
    }

    // For now, show a message as top-up functionality needs M-Pesa integration
    toast.success('M-Pesa integration coming soon!');
    setShowTopUp(false);
    setTopUpAmount('');
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-24 mb-4" />
        <div className="h-8 bg-white/20 rounded w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Yanzi Wallet</span>
          </div>
          <button
            onClick={fetchWallet}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <p className="text-emerald-100 text-sm">Available Balance</p>
        <p className="text-3xl font-bold">
          KSh {(wallet?.balance || 0).toLocaleString()}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setShowTopUp(!showTopUp)}
            className="flex-1 py-2.5 bg-white text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </button>
        </div>
      </div>

      {/* Top Up Form */}
      {showTopUp && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Top Up via M-Pesa</h3>
          
          <div className="flex gap-2 mb-4">
            {[100, 500, 1000, 2000].map((amount) => (
              <button
                key={amount}
                onClick={() => setTopUpAmount(amount.toString())}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  topUpAmount === amount.toString()
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {amount}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Amount (KSh)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleTopUp}
              disabled={topping}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50"
            >
              {topping ? '...' : 'Pay'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You'll receive an M-Pesa STK push to complete the payment
          </p>
        </div>
      )}

      {/* Recent Transactions */}
      {wallet?.transactions && wallet.transactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {wallet.transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {tx.type === 'credit' ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`font-semibold ${
                  tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}KSh {tx.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {wallet && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500">Total Earned</p>
            <p className="text-lg font-bold text-green-600">
              KSh {(wallet.total_earned || 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500">Total Spent</p>
            <p className="text-lg font-bold text-gray-800">
              KSh {(wallet.total_spent || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
