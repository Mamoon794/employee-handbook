'use client';
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function PostLoginRedirect() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
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
        } else if (userType === 'Financer') {
          router.push('/chat')
        } else {
          // Employers/Owners go to dashboard which will handle trial/paywall logic
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Post-login redirect failed:', err);
        // Default to /chat on error
        router.push('/chat');
      }
    };
    handlePostLogin();
  }, [isSignedIn, user, router, redirectUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-gray-400">Redirecting...</span>
    </div>
  );
}
