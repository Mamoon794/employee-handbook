'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default function AddEmployeePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/add-employee/confirmation');
  };

  const handleCancel = () => router.back();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm" onClick={()=>{router.push('/chat');}}>Ask a Question</button>
          <button className="px-5 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm" onClick={() => router.push('/finances')}>View Finances</button>
          <button onClick={() => router.push('/analytics')} className="px-5 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors shadow-sm">Analytics</button>
          <UserButton appearance={{ elements: { avatarBox: "w-15 h-15" } }} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-extrabold mb-10 text-center">Add a new employee</h2>

        <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#f5f7fb] p-8 rounded-2xl shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">First name:</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Last name:</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border"
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Email:</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border"
              placeholder="johnsmith@rivvi.ca"
              required
            />
          </div>

          <div className="flex justify-center gap-4 pt-2">
            <button type="submit" className="bg-blue-800 text-white px-6 py-2 rounded-xl font-bold">Save</button>
            <button type="button" onClick={handleCancel} className="border px-6 py-2 rounded-xl font-semibold">Cancel</button>
          </div>
        </form>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}