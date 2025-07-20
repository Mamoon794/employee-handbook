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
      router.push(res.data.url); // Redirect to Stripe Checkout
    } catch (err) {
      console.error(err);
      setError('Failed to start checkout session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gail logo header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Subscribe to Access Premium Features
        </h1>
        <p className="mb-6 text-center text-gray-600 max-w-md">
          To use private features of the Employee Handbook App, you need to subscribe. Your payment supports secure data access and AI tools.
        </p>
        <button
          onClick={handleSubscribe}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Redirecting...' : 'Subscribe Now'}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </main>
    </div>
  );
}
