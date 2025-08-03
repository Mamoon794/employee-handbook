'use client';
import { SignIn, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeeLogin() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitationId');
  const redirectUrl = searchParams.get('redirect_url') || '/chat';

  useEffect(() => {
    const handlePostLogin = async () => {
      if (!isSignedIn || !user) return;
      
      try {
        // Check user type from metadata
        const userType = user.unsafeMetadata?.userType as string;
        
        if (userType === 'Employee') {
          // Employees go directly to chat
          router.push(redirectUrl);
        } else {
          // Employers/Owners go to dashboard which will handle trial/paywall logic
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Post-login redirect failed:', err);
        // Default to dashboard on error
        router.push('/dashboard');
      }
    };
    handlePostLogin();
  }, [isSignedIn, user, router, redirectUrl]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-6 py-4">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full flex flex-col md:flex-row gap-12 items-center">
          
          {/* Left side - Benefits list */}
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {invitationId ? 'Accept Your Invitation' : 'Log Into Your Account'}
            </h1>
            <ul className="mt-4 space-y-3 text-gray-600">
              {invitationId ? (
                <>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Join your company&apos;s employee portal and access exclusive resources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>View company policies, documents, and your employment details</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Access your dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Review company policies and understand your workplace rights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">✓</span>
                    <span>Manage your work profile and important documents</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* Right side - SignIn component */}
          <div className="md:w-1/2 w-full">
            <SignIn 
              routing="path"
              path="/log-in/[...rest]"
              afterSignInUrl={redirectUrl}
              afterSignUpUrl="/onboarding"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full shadow-none border-0 bg-white',
                  headerTitle: 'text-lg font-medium text-gray-900',
                  headerSubtitle: 'text-sm text-gray-600',
                  formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500',
                  formButtonPrimary: 'bg-blue-800 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
                  footerActionLink: 'text-blue-800 hover:text-blue-700 font-medium',
                  socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-500'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
