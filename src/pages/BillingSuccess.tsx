import React from 'react';
import { CheckCircleIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BillingSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription activated!
        </h1>
        <p className="text-gray-600 mb-8">
          Your plan is now active. You have full access to all features included
          in your tier.
        </p>
        <button
          onClick={() => navigate('/chat')}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Start using Karios AI
        </button>
      </div>
    </div>
  );
};

export default BillingSuccess;
