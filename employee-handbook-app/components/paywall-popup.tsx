import { useState } from "react";
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface PaywallModalProps {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
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
          <h3 className="text-base font-bold text-gray-800 mb-3 text-center">One-Time Payment:</h3>
          <div className="flex justify-center">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border-2 border-blue-200 w-full">
              <span className="font-medium text-gray-700 text-sm">Premium Access</span>
              <span className="font-bold text-blue-800 text-sm">$99</span>
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