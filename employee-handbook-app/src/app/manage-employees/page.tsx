'use client';

import { useRouter } from 'next/navigation';
import { FaTrashAlt } from 'react-icons/fa';
import { UserButton } from '@clerk/nextjs';

// Employee" | "Owner" | "Administrator" | "Financer

const employees = [
  { role: 'Financer', name: 'John Smith' },
  { role: 'Owner', name: 'Jane Doe' },
  { role: 'Administrator', name: 'Ann Ferris' },
  { role: 'Employee', name: 'Eren Yeager' },
  { role: 'Employee', name: 'Bob Smith' },
  { role: 'Financer', name: 'John White' },
  { role: 'Employee', name: 'Stacy Brown' },
  { role: 'Administrator', name: 'Sally Hansen' },
  { role: 'Employee', name: 'Emily Fox' }
];

export default function ManageEmployees() {
  const router = useRouter();

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

      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <h2 className="text-4xl font-extrabold mb-10 text-center">Manage your employees</h2>

        <div className="w-full max-w-3xl max-h-120 bg-[#f5f7fb] p-8 rounded-2xl shadow-sm flex flex-col gap-4 overflow-y-auto">
          {employees.map((emp, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <button className="flex-shrink-0 text-lg text-black bg-white border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100">
                <FaTrashAlt />
              </button>
              <div className="flex-1 flex items-center w-full bg-white">
                <span className="px-10 py-2 w-1/2 bg-[#4e65a4] text-white rounded-xl text-lg font-semibold min-w-[220px] text-center">
                  {emp.role}
                </span>
                <span className="text-xl px-8 py-2 w-1/2 font-bold text-black rounded-xl">{emp.name}</span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="mt-10 px-10 py-3 bg-[#294494] text-white rounded-xl font-bold text-xl"
          onClick={() => router.push('/DashBoard')}
        >
          Back to Dashboard
        </button>
      </main>

      <footer className="w-full h-24 bg-[#294494] mt-auto" />
    </div>
  );
}