'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function PaywallPage() {
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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Gail logo header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full flex flex-col items-center">
          <h2 className="text-3xl font-extrabold text-blue-800 mb-4 text-center">Subscribe to Access Premium Features</h2>
          <p className="mb-8 text-center text-gray-600 text-base font-medium">
            To use private features of the Employee Handbook App, you need to subscribe. Your payment supports secure data access and AI tools.
          </p>
          <button
            onClick={handleSubscribe}
            className="w-full bg-blue-800 text-white font-bold py-3 rounded-xl text-lg hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Subscribe Now'}
          </button>
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
        </div>
      </main>
    </div>
  );
}
