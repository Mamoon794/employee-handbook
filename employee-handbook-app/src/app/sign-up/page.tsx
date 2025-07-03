'use client';

import { Users, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LogIn } from '../global_components';


export default function SignUp() {
  const router = useRouter(); 

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h2 className="text-2xl sm:text-3xl font-semibold text-blue-800 mb-10 text-center">
          Register to get started
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Employee */}
          <button 
            onClick={() => router.push('/sign-up/employee/[...rest]')} 
            className="w-64 h-36 border rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Users size={48} className="mb-2 text-black" />
            <span className="text-lg font-medium text-black">Continue as Employee</span>
          </button>

          {/* Employer */}
          <button 
            onClick={() => router.push('/sign-up/employer/[...rest]')}
            className="w-64 h-36 border rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <User size={48} className="mb-2 text-black" />
            <span className="text-lg font-medium text-black">Continue as Employer</span>
          </button>
        </div>
        
        <p className="text-gray-700 text-md mb-3">Already have an account?</p>
        
        {/* Login button with navigation */}
        <button 
          onClick={() => router.push('/log-in/[...rest]')}
          className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          Log in
        </button>
      </main>
    </div>
  );
}