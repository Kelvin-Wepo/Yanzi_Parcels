import { Shield, Check } from 'lucide-react';

const INSURANCE_TIERS = [
  {
    id: 'none',
    name: 'No Insurance',
    coverage: 0,
    premium: 0,
    description: 'Standard delivery protection',
    color: 'bg-gray-100 border-gray-300',
    textColor: 'text-gray-600',
  },
  {
    id: 'basic',
    name: 'Basic',
    coverage: 5000,
    premium: 50,
    description: 'Up to KSh 5,000 coverage',
    color: 'bg-blue-50 border-blue-300',
    textColor: 'text-blue-600',
  },
  {
    id: 'standard',
    name: 'Standard',
    coverage: 20000,
    premium: 150,
    description: 'Up to KSh 20,000 coverage',
    color: 'bg-purple-50 border-purple-300',
    textColor: 'text-purple-600',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    coverage: 50000,
    premium: 350,
    description: 'Up to KSh 50,000 coverage',
    color: 'bg-amber-50 border-amber-300',
    textColor: 'text-amber-600',
  },
];

export default function InsuranceSelector({ selectedTier, onSelect }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">Delivery Insurance</h3>
      </div>
      
      <p className="text-sm text-gray-500">
        Protect your valuable items with optional insurance coverage
      </p>

      <div className="grid grid-cols-2 gap-3">
        {INSURANCE_TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => onSelect(tier.id)}
            className={`relative p-4 rounded-xl border-2 text-left transition ${
              selectedTier === tier.id
                ? `${tier.color} border-2`
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                Popular
              </span>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <span className={`font-semibold ${selectedTier === tier.id ? tier.textColor : 'text-gray-800'}`}>
                {tier.name}
              </span>
              {selectedTier === tier.id && (
                <Check className={`w-5 h-5 ${tier.textColor}`} />
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-2">{tier.description}</p>
            
            {tier.premium > 0 ? (
              <p className="text-lg font-bold text-gray-800">
                +KSh {tier.premium}
              </p>
            ) : (
              <p className="text-sm text-gray-400">Free</p>
            )}
          </button>
        ))}
      </div>

      {selectedTier && selectedTier !== 'none' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Coverage: KSh {INSURANCE_TIERS.find(t => t.id === selectedTier)?.coverage.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Your package will be insured against loss, damage, or theft during transit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
