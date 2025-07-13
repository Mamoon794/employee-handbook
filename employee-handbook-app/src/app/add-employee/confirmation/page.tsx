'use client';

import { useRouter } from 'next/navigation';

export default function ConfirmationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-8 py-6 shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button className="px-6 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">Ask a Question</button>
          <button className="px-6 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">View Finances</button>
          <button className="px-6 py-2 border border-gray-300 text-sm rounded-xl">Log Out</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-3xl font-extrabold mb-10 text-center">Add a new employee</h2>

        <div className="w-full max-w-xl bg-[#f5f7fb] p-6 rounded-2xl space-y-6">
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Added employees:</p>
            <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-sm">
              <span className="font-medium">John Smith</span>
              <span className="text-gray-500">johnsmith@rivvi.ca</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/add-employee')}
            className="border px-6 py-2 rounded-xl font-semibold bg-white hover:bg-gray-100 transition-colors"
          >
            Add another
          </button>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="mt-8 bg-blue-800 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-900 transition-colors"
        >
          Back to Dashboard
        </button>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}
