import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, AlertCircle } from 'lucide-react';
import businessAPI from '../../services/businessAPI';

const BulkOrdersList = ({ onOrderSelect }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getBulkOrders();
      setOrders(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCouriers = async (orderId) => {
    try {
      await businessAPI.assignCouriers(orderId);
      // Refresh orders
      fetchOrders();
    } catch (err) {
      console.error('Error assigning couriers:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      partial: 'bg-orange-100 text-orange-800',
      assigned: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        <p className="text-red-700">Error loading orders: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-600">No bulk orders yet. Start by uploading a CSV file.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{order.order_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{order.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {order.assigned_items}/{order.total_items} assigned
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(order.assigned_items / order.total_items) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{order.total_items}</p>
                  <p className="text-xs text-gray-600">Total Items</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{order.assigned_items}</p>
                  <p className="text-xs text-gray-600">Assigned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{order.completed_items}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    KES {order.estimated_cost?.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-600">Est. Cost</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetails(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  View Details
                </button>

                {order.status === 'processing' && (
                  <button
                    onClick={() => handleAssignCouriers(order.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Assign Couriers
                  </button>
                )}

                <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <Edit2 size={18} />
                </button>
              </div>

              {/* Date Info */}
              <p className="text-xs text-gray-500 mt-3">
                Created: {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">{selectedOrder.order_name}</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedOrder.items.length} items</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Recipient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.customer_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        KES {item.estimated_cost?.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDetails(false)}
                className="w-full bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOrdersList;
