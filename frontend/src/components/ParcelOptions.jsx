import { Scale } from 'lucide-react'

const WEIGHT_OPTIONS = [
  {
    value: 'light',
    label: 'Light',
    range: '0-5 kg',
    description: 'Documents, small electronics',
    icon: '📄',
  },
  {
    value: 'medium',
    label: 'Medium',
    range: '5-15 kg',
    description: 'Groceries, clothing, books',
    icon: '📦',
  },
  {
    value: 'heavy',
    label: 'Heavy',
    range: '15-50 kg',
    description: 'Appliances, furniture parts',
    icon: '🏋️',
  },
  {
    value: 'very_heavy',
    label: 'Very Heavy',
    range: '50+ kg',
    description: 'Large equipment, building materials',
    icon: '🏗️',
  },
]

const SIZE_OPTIONS = [
  {
    value: 'small',
    label: 'Small',
    description: 'Fits in hand',
    icon: '✋',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Fits in backpack',
    icon: '🎒',
  },
  {
    value: 'large',
    label: 'Large',
    description: 'Needs carrier',
    icon: '📦',
  },
  {
    value: 'extra_large',
    label: 'Extra Large',
    description: 'Needs vehicle cargo',
    icon: '🚛',
  },
]

export function WeightSelector({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <Scale className="w-4 h-4 inline mr-2" />
        Estimated Weight
      </label>
      <div className="grid grid-cols-2 gap-2">
        {WEIGHT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              p-3 rounded-lg border-2 text-left transition-all
              ${value === option.value
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{option.icon}</span>
              <div>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-gray-500">{option.range}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

export function SizeSelector({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Package Size
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SIZE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              p-3 rounded-lg border-2 text-left transition-all
              ${value === option.value
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{option.icon}</span>
              <div>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-gray-500">{option.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}

export default WeightSelector
