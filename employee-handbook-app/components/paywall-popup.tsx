import { useState } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';

const pricingTiers = [
  { min: 1, max: 9, price: 1.00 },
  { min: 10, max: 49, price: 0.90 },
  { min: 50, max: 99, price: 0.80 },
  { min: 100, max: 499, price: 0.70 },
  { min: 500, max: 999, price: 0.60 },
  { min: 1000, max: 4999, price: 0.50 },
  { min: 5000, max: 9999, price: 0.40 },
  { min: 10000, max: 19999, price: 0.35 },
  { min: 20000, max: 49999, price: 0.30 },
  { min: 50000, max: 99999, price: 0.25 },
];

export default function PaywallModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/stripe/checkout');
      router.push(res.data.url); 
    } catch (err) {
      console.error(err);
      setError('Failed to start checkout session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-6 max-w-md w-full text-center relative">
        <h2 className="text-2xl font-extrabold text-blue-800 mb-6 text-center pl-4">
          Unlock Premium Features
        </h2>
        
        <div className="mb-6 pl-4">
          <h3 className="text-base font-bold text-gray-800 mb-3 text-center">Premium Features:</h3>
          <ul className="text-left space-y-2 text-gray-700 text-sm pl-4">
            <li>• AI-powered document analysis and Q&A</li>
            <li>• Advanced analytics and insights</li>
            <li>• Priority customer support</li>
          </ul>
        </div>

        <div className="mb-6 p-3 bg-[#f5f7fb] rounded-lg pl-4">
          <h3 className="text-base font-bold text-gray-800 mb-3 text-center">Monthly Pricing:</h3>
          
          {/* Employee Count Display */}
          <div className="mb-4">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Your Number of Employees:</span>
              <span className="text-lg font-bold text-blue-800">10</span>
              <span className="text-sm text-gray-600">employees</span>
            </div>
          </div>

          {/* Pricing Tiers List */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3 text-center">Pricing Tiers:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pricingTiers.map((tier, index) => {
                const isCurrentTier = 10 >= tier.min && 10 <= tier.max;
                return (
                  <div key={index} className={`flex justify-between items-center p-2 rounded-lg shadow-sm text-sm ${
                    isCurrentTier ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white'
                  }`}>
                    <span className={`${isCurrentTier ? 'font-bold text-blue-800' : 'text-gray-700'}`}>
                      {tier.min.toLocaleString()}-{tier.max.toLocaleString()} employees
                    </span>
                    <span className={`${isCurrentTier ? 'font-bold text-blue-800' : 'font-bold text-blue-800'}`}>
                      ${tier.price}/month per employee
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          onClick={handleSubscribe}
          className="w-full bg-[#294494] text-white font-extrabold py-3 rounded-xl text-base hover:bg-blue-900 transition-colors shadow-md disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Subscribe Now'}
        </button>
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
} 