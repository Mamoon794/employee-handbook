'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="flex justify-between items-center px-8 py-6 shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
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
        <div className="w-full max-w-2xl bg-white p-12 rounded-2xl shadow-md space-y-6 text-center border border-gray-200">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-900">
            Invitation Sent!
          </h2>
          <p className="mb-8 text-gray-700 text-lg">
            An invitation has been sent to{' '}
            <span className="font-bold text-blue-800">{email}</span>. They'll need
            to accept it before they can join your company.
          </p>
          <button
            onClick={() => router.push('/DashBoard')}
            className="bg-blue-800 hover:bg-blue-900 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}