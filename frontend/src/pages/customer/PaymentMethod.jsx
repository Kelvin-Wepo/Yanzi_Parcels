import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { CreditCard, Plus, Trash2, Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { customerAPI } from '../../services/api'

// Initialize Stripe - replace with your publishable key
const stripePromise = loadStripe('pk_test_51OLxrMIhECL0gCBjDJkMCCpbtdvIehnp30mZ8cYfjZgeXV2QsP7uAoisaOK8qSg1epcC9iBWFopI7G8gqv3iCVPV00MkrKBcuE')

function AddCardForm({ clientSecret, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)

    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      })

      if (error) {
        toast.error(error.message)
      } else if (setupIntent.status === 'succeeded') {
        toast.success('Card added successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to add card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        {loading ? 'Adding...' : 'Add Card'}
      </button>
    </form>
  )
}

export default function PaymentMethod() {
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    loadPaymentMethod()
  }, [])

  const loadPaymentMethod = async () => {
    setLoading(true)
    try {
      const response = await customerAPI.getPaymentMethod()
      setPaymentInfo(response.data)
    } catch (error) {
      toast.error('Failed to load payment method')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this card?')) return

    setRemoving(true)
    try {
      await customerAPI.removePaymentMethod()
      toast.success('Card removed')
      loadPaymentMethod()
    } catch (error) {
      toast.error('Failed to remove card')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Method</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {paymentInfo?.has_payment_method ? (
          <div>
            <div className="flex items-center gap-4 p-4 border border-green-200 bg-green-50 rounded-lg mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {paymentInfo.card_brand?.toUpperCase()} •••• {paymentInfo.card_last4}
                </p>
                <p className="text-sm text-gray-500">Your default payment method</p>
              </div>
            </div>

            <button
              onClick={handleRemove}
              disabled={removing}
              className="w-full py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              {removing ? 'Removing...' : 'Remove Card'}
            </button>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No payment method</h3>
              <p className="text-gray-500 text-sm">Add a card to create jobs</p>
            </div>

            {paymentInfo?.client_secret && (
              <Elements stripe={stripePromise}>
                <AddCardForm
                  clientSecret={paymentInfo.client_secret}
                  onSuccess={loadPaymentMethod}
                />
              </Elements>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Your payment information is securely processed by Stripe
      </p>
    </div>
  )
}
