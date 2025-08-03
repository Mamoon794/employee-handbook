'use client';

import { useRouter } from 'next/navigation';

export default function InvalidInvitation() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Box */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-[#f5f7fb] p-8 rounded-2xl shadow-sm text-center">
          <h1 className="text-3xl font-extrabold text-blue-800 mb-6">Invalid Invitation</h1>
          
          <div className="space-y-6">
            <p className="text-gray-700">
              The invitation link is expired or invalid.
            </p>
            
            <p className="text-gray-700">
              <a 
                onClick={() => router.push('/chat')} 
                className="text-blue-800 hover:text-blue-600 cursor-pointer underline"
              >
                Return to Gail
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-screen h-24 bg-[#294494]" />
    </div>
  );
}