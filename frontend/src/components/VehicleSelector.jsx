import { useState, useEffect } from 'react'
import { 
  Check, 
  Clock, 
  Star,
  Zap,
  Shield,
  Package,
  AlertCircle
} from 'lucide-react'

// Vehicle type icons mapping
const VEHICLE_ICONS = {
  boda_boda: '🏍️',
  tuk_tuk: '🛺',
  car: '🚗',
  van: '🚐',
  pickup: '🛻',
}

// Vehicle type colors
const VEHICLE_COLORS = {
  boda_boda: 'from-orange-400 to-amber-500',
  tuk_tuk: 'from-green-400 to-emerald-500',
  car: 'from-blue-400 to-indigo-500',
  van: 'from-purple-400 to-violet-500',
  pickup: 'from-red-400 to-rose-500',
}

export default function VehicleSelector({ 
  options = [], 
  selectedVehicle, 
  onSelect,
  isPeakHour = false,
  loading = false 
}) {
  const [expandedVehicle, setExpandedVehicle] = useState(null)

  // Auto-select recommended vehicle
  useEffect(() => {
    if (!selectedVehicle && options.length > 0) {
      const recommended = options.find(o => o.is_recommended && o.can_handle)
      if (recommended) {
        onSelect(recommended.vehicle_type)
      }
    }
  }, [options])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24" />
        ))}
      </div>
    )
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No vehicle options available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Peak hour notice */}
      {isPeakHour && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="text-amber-800">
            Peak hour pricing active (25% surge)
          </span>
        </div>
      )}

      {/* Vehicle options */}
      {options.map((option) => {
        const isSelected = selectedVehicle === option.vehicle_type
        const isExpanded = expandedVehicle === option.vehicle_type
        const canSelect = option.can_handle
        
        return (
          <div
            key={option.vehicle_type}
            className={`
              relative rounded-xl border-2 transition-all duration-200 overflow-hidden
              ${isSelected 
                ? 'border-amber-500 bg-amber-50 shadow-lg' 
                : canSelect 
                  ? 'border-gray-200 bg-white hover:border-amber-300 cursor-pointer'
                  : 'border-gray-100 bg-gray-50 opacity-60'
              }
            `}
            onClick={() => canSelect && onSelect(option.vehicle_type)}
          >
            {/* Recommended badge */}
            {option.is_recommended && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Recommended
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center gap-4">
                {/* Vehicle Icon */}
                <div className={`
                  w-16 h-16 rounded-xl flex items-center justify-center text-3xl
                  bg-gradient-to-br ${VEHICLE_COLORS[option.vehicle_type] || 'from-gray-400 to-gray-500'}
                  text-white shadow-lg
                `}>
                  {option.icon || VEHICLE_ICONS[option.vehicle_type] || '🚗'}
                </div>

                {/* Vehicle Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800">
                      {option.vehicle_name}
                    </h3>
                    {isSelected && (
                      <span className="bg-amber-500 text-white p-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {option.description}
                  </p>
                  
                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {option.estimated_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Max {option.max_weight_kg}kg
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">
                    KSh {option.price?.toLocaleString()}
                  </p>
                  {canSelect ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedVehicle(isExpanded ? null : option.vehicle_type)
                      }}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                  ) : (
                    <p className="text-xs text-red-500">
                      {option.reason || 'Unavailable'}
                    </p>
                  )}
                </div>
              </div>

              {/* Cannot handle reason */}
              {!canSelect && option.reason && (
                <div className="mt-3 bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {option.reason}
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && canSelect && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {option.features?.map((feature, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  {option.price_breakdown && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Base fare</span>
                        <span>KSh {option.price_breakdown.base_fare}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Distance ({option.price_breakdown.distance_km} km)
                        </span>
                        <span>KSh {option.price_breakdown.distance_cost}</span>
                      </div>
                      {option.price_breakdown.size_multiplier !== 1 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Size adjustment</span>
                          <span>×{option.price_breakdown.size_multiplier}</span>
                        </div>
                      )}
                      {option.price_breakdown.weight_multiplier !== 1 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Weight adjustment</span>
                          <span>×{option.price_breakdown.weight_multiplier}</span>
                        </div>
                      )}
                      {option.price_breakdown.surcharges?.length > 0 && (
                        <>
                          {option.price_breakdown.surcharges.map((surcharge, idx) => (
                            <div key={idx} className="flex justify-between text-amber-600">
                              <span>{surcharge.name}</span>
                              <span>×{surcharge.multiplier}</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-amber-600">
                          KSh {option.price_breakdown.final_price?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Best for */}
                  {option.best_for && (
                    <p className="mt-3 text-xs text-gray-500">
                      <span className="font-medium">Best for:</span> {option.best_for}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Selected vehicle summary */}
      {selectedVehicle && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <p className="font-medium">Selected Vehicle</p>
                <p className="text-sm text-white/80">
                  {options.find(o => o.vehicle_type === selectedVehicle)?.vehicle_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                KSh {options.find(o => o.vehicle_type === selectedVehicle)?.price?.toLocaleString()}
              </p>
              <p className="text-xs text-white/80">
                {options.find(o => o.vehicle_type === selectedVehicle)?.estimated_time}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
