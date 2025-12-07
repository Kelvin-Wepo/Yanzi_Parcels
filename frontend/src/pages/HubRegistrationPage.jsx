import React from 'react';
import { useNavigate } from 'react-router-dom';
import HubRegistration from '../components/hub/HubRegistration';

const HubRegistrationPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to hub partner portal after successful registration
    setTimeout(() => {
      navigate('/hub/partner');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <HubRegistration onSuccess={handleSuccess} />
    </div>
  );
};

export default HubRegistrationPage;
