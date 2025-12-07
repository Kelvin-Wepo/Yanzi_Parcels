import { Banknote, Check } from 'lucide-react';

export default function CashOnDelivery({ enabled, amount, onToggle, onAmountChange }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Banknote className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Cash on Delivery (COD)</h4>
            <p className="text-xs text-gray-500">Collect payment from recipient</p>
          </div>
        </div>
        
        <button
          onClick={onToggle}
          className={`w-14 h-8 rounded-full transition relative ${
            enabled ? 'bg-green-500' : 'bg-gray-200'
          }`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow absolute top-1 transition-all ${
            enabled ? 'right-1' : 'left-1'
          }`} />
        </button>
      </div>

      {enabled && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Collect
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">KSh</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            The courier will collect this amount from the recipient and transfer it to your wallet.
          </p>
        </div>
      )}
    </div>
  );
}
