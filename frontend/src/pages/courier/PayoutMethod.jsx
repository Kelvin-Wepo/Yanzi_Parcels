import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Wallet, Mail, Save, CheckCircle } from 'lucide-react'
import { courierAPI } from '../../services/api'

export default function PayoutMethod() {
  const [paypalEmail, setPaypalEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPayoutMethod()
  }, [])

  const loadPayoutMethod = async () => {
    try {
      const response = await courierAPI.getPayoutMethod()
      setPaypalEmail(response.data.paypal_email || '')
    } catch (error) {
      toast.error('Failed to load payout method')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await courierAPI.updatePayoutMethod({ paypal_email: paypalEmail })
      toast.success('Payout method updated')
    } catch (error) {
      toast.error('Failed to update payout method')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payout Method</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">PayPal</h2>
            <p className="text-sm text-gray-500">Receive earnings to your PayPal account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PayPal Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="your-email@example.com"
              />
            </div>
          </div>

          {paypalEmail && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700">
                Earnings will be sent to this PayPal account
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Payout Method'}
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">How payouts work</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• You earn 80% of each job's total price</li>
          <li>• Earnings are calculated after job completion</li>
          <li>• Payouts are processed weekly to your PayPal</li>
          <li>• Minimum payout threshold: $10</li>
        </ul>
      </div>
    </div>
  )
}
