// log in page for app

'use client';
import { SignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeLogin() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSignedIn) return;
      try {
        const res = await fetch('/api/check-subscription');
        const data = await res.json();
        if (data.subscribed) {
          router.push('/chat');
        } else {
          router.push('/paywall');
        }
      } catch (err) {
        console.error('Subscription check failed:', err);
        router.push('/paywall');
      }
    };
    checkSubscription();
  }, [isSignedIn]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Log Into Clerk</h1>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✔️</span>
                Access your employee dashboard
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✔️</span>
                View company policies and your rights
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✔️</span>
                Manage your work profile and documents
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 w-full">
            <SignIn 
              routing="path"
              path="/log-in/[...rest]"
              fallbackRedirectUrl="/"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full shadow-none border-0',
                  headerTitle: 'text-lg font-medium text-gray-900',
                  headerSubtitle: 'text-sm text-gray-600',
                  formFieldInput: 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
                  formButtonPrimary: 'bg-blue-800 hover:bg-blue-700',
                  footerActionLink: 'text-blue-800 hover:text-blue-700'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
