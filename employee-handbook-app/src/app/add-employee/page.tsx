'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from "@clerk/nextjs";

export default function AddEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('companyName') || "Your Company";
  
  const [formData, setFormData] = useState({
    email: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId || !companyName) {
      setError("Company information is missing");
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          companyId,
          companyName,
          inviterId: user?.id || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      router.push(`/add-employee/confirmation?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      const error = err as Error;
      setError(error.message.includes('Unauthorized') 
        ? 'Please log in to perform this action'
        : error.message.includes('already part') 
          ? error.message 
          : 'Email is not associated with an account');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-8 py-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
          {companyName && (
            <span className="text-lg font-medium text-black">| {companyName}</span>
          )}
        </div>
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
            Ask a Question
          </button>
          <button className="px-6 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
            View Finances
          </button>
          <button className="px-6 py-2 border border-gray-300 text-sm rounded-xl">
            Log Out
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-extrabold mb-10 text-center text-black">
          Add a new employee to {companyName}
        </h2>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#f5f7fb] p-8 rounded-2xl shadow-sm space-y-6 text-black">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1 text-black">
              Employee Email:
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-black bg-white"
              placeholder="employee@example.com"
              required
            />
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button 
              type="submit" 
              className="bg-blue-800 text-white px-6 py-2 rounded-xl font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              className="border border-gray-300 px-6 py-2 rounded-xl font-semibold text-black"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}