'use client';

import { useState } from 'react';
import { Search, Plus, Menu, Pencil } from 'lucide-react';

export default function ChatUI() {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar (History) */}
      <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
        <div className="flex justify-between items-center p-4">
          <Menu className="text-gray-400" />
          <Pencil className="text-gray-400" />
        </div>
        <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
        <button className="bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f]">Paid breaks</button>

        {/* New Chat Button */}
        <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
          <Plus className="text-[#1F2251]" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
          <button className="px-4 py-2 text-sm border rounded-full text-gray-700 hover:bg-gray-50">Log Out</button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <div className="flex flex-col gap-6 py-6">
            <div className="self-end bg-[#f1f2f9] text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
              Am I entitled to get paid breaks?
            </div>

            <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
              <p>
                In Ontario, employees are entitled to a 30-minute unpaid break after 5 consecutive hours of work.
                However, paid rest breaks (like two 15-minute coffee breaks) are not mandatory under the law —
                they are often provided by the employer as part of company policy.
              </p>
              <p className="mt-4">
                <strong>According to Rivvi’s policy</strong>, yes — you are entitled to two 15-minute paid breaks during a standard 8-hour shift.
              </p>
              <p className="mt-4">
                These breaks are in addition to your unpaid 30-minute lunch break. Paid breaks are considered part
                of your working hours and do not reduce your total pay.
              </p>
              <a
                href="#"
                className="mt-4 inline-block font-bold text-blue-800 underline"
              >
                View Company Break Policy → HR Handbook → Section 2.3
              </a>
            </div>
          </div>

          {/* Input Bar */}
          <div className="relative w-full max-w-3xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything"
              className="w-full px-6 py-4 border border-gray-300 rounded-full text-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <Search className="w-6 h-6" />
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>
      </div>
    </div>
  );
}