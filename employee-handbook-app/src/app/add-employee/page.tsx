'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, UserButton } from "@clerk/nextjs";
import { FaEnvelope } from 'react-icons/fa';

interface PendingInvite {
  id: string;
  email: string;
  createdAt: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  
  const companyId = searchParams.get('companyId');
  const companyName = searchParams.get('companyName') || "Your Company";
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const fetchPendingInvites = async () => {
      try {
        const response = await fetch(`/api/get-pending-invites?companyId=${companyId}`);
        if (!response.ok) throw new Error('Failed to fetch invites');
        
        const data = await response.json();
        const formattedData = data.map((invite: any) => ({
          ...invite,
          createdAt: invite.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        setPendingInvites(formattedData);
      } catch (error) {
        console.error('Error fetching pending invites:', error);
        setError('Failed to load pending invites');
      } finally {
        setIsLoadingInvites(false);
      }
    };

    fetchPendingInvites();
  }, [companyId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Date unavailable' 
        : date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
    } catch {
      return 'Date unavailable';
    }
  };

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

  const isAlreadyInvited = pendingInvites.some(
    invite => invite.email.toLowerCase() === formData.email.toLowerCase()
  );
  
  if (isAlreadyInvited) {
    setError('Invite already sent to this email.');
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

    // Show confirmation
    setConfirmedEmail(formData.email);
    setShowConfirmation(true);
    setFormData({ email: '' });
    setIsSubmitting(false); // Also reset here for safety

    // Refresh pending invites
    const invitesResponse = await fetch(`/api/get-pending-invites?companyId=${companyId}`);
    if (invitesResponse.ok) {
      const updatedInvites = await invitesResponse.json();
      setPendingInvites(updatedInvites.map((invite: any) => ({
        ...invite,
        createdAt: invite.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      })));
    }
  } catch (err) {
    const error = err as Error;
    setError(error.message);
    setIsSubmitting(false);
  }
};

const handleAddAnother = () => {
  setShowConfirmation(false);
  setConfirmedEmail('');
  setIsSubmitting(false); // Reset the submitting state
};

  const handleCancel = () => router.push('/dashboard');

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
        <div className="flex gap-4 items-center">
          <button 
            className="px-7 py-3 bg-[#242267] text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-colors shadow-sm" 
            onClick={() => router.push('/chat')}
          >
            Ask a Question
          </button>
          <button 
            className="px-7 py-3 bg-blue-800 text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-colors shadow-sm"
            onClick={() => router.push('/finances')}
          >
            View Finances
          </button>
          <button 
            onClick={() => router.push('/analytics')}
            className="px-7 py-3 bg-[#242267] text-white rounded-xl font-bold text-base hover:bg-blue-900 transition-colors shadow-sm"
          >
            Analytics
          </button>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-15 h-15"
              }
            }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-8 px-4">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Confirmation Message */}
          {showConfirmation ? (
            <div className="bg-[#f5f7fb] p-8 rounded-2xl shadow-sm text-center border border-gray-200">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Invitation Sent!
              </h2>
              <p className="mb-6 text-gray-700">
                An invitation has been sent to{' '}
                <span className="font-bold text-blue-800">{confirmedEmail}</span>. 
                They'll need to accept it before joining your company.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleAddAnother}
                  className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  Add Another Employee
                </button>
                <button 
                  onClick={handleCancel}
                  className="border border-gray-300 px-6 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Add Employee Form */
            <div className="bg-[#f5f7fb] p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">
                Add New Employee
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Employee Email:
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="employee@example.com"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={handleCancel} 
                    className="border border-gray-300 px-6 py-2 rounded-lg font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pending Invites Section */}
          <div className="bg-[#f5f7fb] p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800 text-center">
              <span className="flex items-center justify-center gap-2">
                <FaEnvelope className="text-blue-600" />
                Pending Invitations
              </span>
            </h3>
            
            {isLoadingInvites ? (
              <div className="text-center py-2 text-gray-500 text-sm">
                Loading pending invites...
              </div>
            ) : pendingInvites.length === 0 ? (
              <div className="text-center py-2 text-gray-500 text-sm">
                No pending invitations
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{invite.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Sent: {formatDate(invite.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useUser } from "@clerk/nextjs";
// import { FaTrashAlt, FaEnvelope } from 'react-icons/fa';

// export default function AddEmployeePage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { user } = useUser();
  
//   const companyId = searchParams.get('companyId');
//   const companyName = searchParams.get('companyName') || "Your Company";
  
//   const [formData, setFormData] = useState({
//     email: '',
//   });
//   const [error, setError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setError('');
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!companyId || !companyName) {
//       setError("Company information is missing");
//       return;
//     }
    
//     setIsSubmitting(true);
//     setError('');

//     try {
//       const response = await fetch('/api/send-invitation', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           email: formData.email,
//           companyId,
//           companyName,
//           inviterId: user?.id || '',
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to send invitation');
//       }

//       router.push(`/add-employee/confirmation?email=${encodeURIComponent(formData.email)}`);
//     } catch (err) {
//       const error = err as Error;
//       setError(error.message.includes('Unauthorized') 
//         ? 'Please log in to perform this action'
//         : error.message.includes('already part') 
//           ? error.message 
//           : 'Email is not associated with an account');
//       setIsSubmitting(false);
//     }
//   };

//   const handleCancel = () => router.push('/DashBoard');

//   return (
//     <div className="min-h-screen bg-white flex flex-col font-sans">
//       <header className="flex justify-between items-center px-8 py-6 shadow-sm">
//         <div className="flex items-center gap-4">
//           <h1 className="text-2xl font-extrabold italic text-blue-800">Gail</h1>
//           {companyName && (
//             <span className="text-lg font-medium text-black">| {companyName}</span>
//           )}
//         </div>
//         <div className="flex gap-4 items-center">
//           <button className="px-6 py-2 bg-[#242267] text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
//             Ask a Question
//           </button>
//           <button className="px-6 py-2 bg-blue-800 text-white rounded-xl font-bold text-sm hover:bg-blue-900 transition-colors">
//             View Finances
//           </button>
//           <button className="px-6 py-2 border border-gray-300 text-sm rounded-xl">
//             Log Out
//           </button>
//         </div>
//       </header>

//       <main className="flex-1 flex flex-col items-center justify-center p-6">
//         <h2 className="text-3xl font-extrabold mb-10 text-center text-black">
//           Add a new employee to {companyName}
//         </h2>

//         <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#f5f7fb] p-8 rounded-2xl shadow-sm space-y-6 text-black">
//           {error && (
//             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
//               {error}
//             </div>
//           )}

//           <div>
//             <label className="block text-sm font-semibold mb-1 text-black">
//               Employee Email:
//             </label>
//             <input
//               name="email"
//               type="email"
//               value={formData.email}
//               onChange={handleChange}
//               className="w-full px-4 py-2 rounded-xl border border-gray-300 text-black bg-white"
//               placeholder="employee@example.com"
//               required
//             />
//           </div>

//           <div className="flex justify-center gap-4 pt-2">
//             <button 
//               type="submit" 
//               className="bg-blue-800 text-white px-6 py-2 rounded-xl font-bold"
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? 'Sending...' : 'Send Invitation'}
//             </button>
//             <button 
//               type="button" 
//               onClick={handleCancel} 
//               className="border border-gray-300 px-6 py-2 rounded-xl font-semibold text-black"
//             >
//               Cancel
//             </button>
//           </div>
//         </form>
//       </main>

//       <footer className="w-full h-24 bg-[#294494] mt-auto" />
//     </div>
//   );
// }