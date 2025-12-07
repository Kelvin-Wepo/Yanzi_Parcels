import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Phone, Navigation, Package } from 'lucide-react';
import hubAPI from '../../services/hubAPI';

const HubFinder = ({ onSelectHub, userLocation }) => {
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHub, setSelectedHub] = useState(null);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lng) {
      findNearbyHubs();
    }
  }, [userLocation, radius]);

  const findNearbyHubs = async () => {
    if (!userLocation?.lat || !userLocation?.lng) return;

    try {
      setLoading(true);
      const response = await hubAPI.getNearbyHubs(
        userLocation.lat,
        userLocation.lng,
        radius
      );
      setHubs(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error finding hubs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getHubTypeIcon = (type) => {
    const icons = {
      shop: '🏪',
      kiosk: '🏠',
      pharmacy: '💊',
      petrol_station: '⛽',
      supermarket: '🛒',
      other: '📍'
    };
    return icons[type] || icons.other;
  };

  const handleSelectHub = (hub) => {
    setSelectedHub(hub);
    if (onSelectHub) {
      onSelectHub(hub);
    }
  };

  if (!userLocation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <MapPin className="mx-auto text-yellow-600 mb-2" size={32} />
        <p className="text-yellow-800">Please enable location to find nearby hubs</p>
      </div>
    );
  }

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
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={findNearbyHubs}
          className="mt-2 text-red-600 hover:text-red-700 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Radius Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Radius
        </label>
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={2}>Within 2 km</option>
          <option value={5}>Within 5 km</option>
          <option value={10}>Within 10 km</option>
          <option value={20}>Within 20 km</option>
        </select>
      </div>

      {/* Hubs List */}
      {hubs.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Package className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-600">No hubs found within {radius}km</p>
          <p className="text-sm text-gray-500 mt-2">Try increasing the search radius</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hubs.map((hub) => (
            <div
              key={hub.id}
              onClick={() => handleSelectHub(hub)}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition ${
                selectedHub?.id === hub.id
                  ? 'ring-2 ring-blue-600 border-blue-600'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-3xl">{getHubTypeIcon(hub.hub_type)}</div>

                {/* Hub Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{hub.hub_name}</h3>
                      <p className="text-sm text-gray-600">{hub.hub_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Navigation size={14} className="text-blue-600" />
                        <span className="font-semibold text-blue-600">
                          {hub.distance} km
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{hub.address}, {hub.area}</span>
                  </div>

                  {/* Operating Hours */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock size={16} className="text-gray-400" />
                    <span>
                      {hub.opening_time} - {hub.closing_time}
                      {hub.operates_weekends && ' (7 days)'}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Phone size={16} className="text-gray-400" />
                    <span>{hub.contact_phone}</span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="font-semibold">{hub.average_rating.toFixed(1)}</span>
                      <span className="text-gray-500">({hub.total_ratings})</span>
                    </div>
                    
                    <div className="text-gray-600">
                      {hub.total_deliveries} deliveries
                    </div>

                    {/* Availability */}
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      hub.is_available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {hub.is_available ? 'Available' : 'Full'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HubFinder;
