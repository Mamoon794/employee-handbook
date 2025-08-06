'use client';
import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function EmployeeLogin() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get('invitationId');


  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-extrabold italic text-blue-800">Gail</h1>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
          
          {/* Left side - Benefits list */}
          <div className="lg:w-1/2 space-y-4 sm:space-y-6 w-full">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center lg:text-left">
              {invitationId ? 'Accept Your Invitation' : 'Log Into Your Account'}
            </h1>
            <ul className="mt-4 space-y-3 text-sm sm:text-base text-gray-600">
              {invitationId ? (
                <>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✓</span>
                    <span>Join your company&apos;s employee portal and access exclusive resources</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✓</span>
                    <span>View company policies, documents, and your employment details</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✓</span>
                    <span>Access your dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✓</span>
                    <span>Review company policies and understand your workplace rights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1 flex-shrink-0">✓</span>
                    <span>Manage your work profile and important documents</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* Right side - SignIn component */}
          <div className="lg:w-1/2 w-full max-w-sm sm:max-w-md mx-auto">
            <SignIn 
              routing="path"
              path="/log-in/[...rest]"
              afterSignInUrl="/log-in/post-redirect"
              afterSignUpUrl="/onboarding"
              signUpUrl="/sign-up"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full shadow-none border-0 bg-white',
                  headerTitle: 'text-base sm:text-lg font-medium text-gray-900',
                  headerSubtitle: 'text-sm text-gray-600',
                  formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base',
                  formButtonPrimary: 'bg-blue-800 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm sm:text-base',
                  footerActionLink: 'text-blue-800 hover:text-blue-700 font-medium text-sm sm:text-base',
                  socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50 text-sm sm:text-base',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-500 text-sm sm:text-base'
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
