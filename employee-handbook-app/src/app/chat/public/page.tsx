"use client"

import { useState } from "react"
import { Menu, Pencil, Plus, Search } from "lucide-react"

export default function PublicChatUI() {
  const [inputValue, setInputValue] = useState("")

  return (
    <div className="min-h-screen flex bg-white">
      {/* Icon-Only Sidebar */}
      <aside className="w-16 bg-[#1F2251] text-white flex flex-col justify-between items-center py-6">
        <div className="flex flex-col gap-6 items-center">
          <Menu className="text-gray-400" />
          <Pencil className="text-gray-400" />
        </div>
        <button className="bg-gray-300 rounded-full p-2 hover:bg-gray-400">
          <Plus className="text-[#1F2251]" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl font-extrabold italic text-blue-800">Gail</h1>
          <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm border rounded-full text-gray-700 hover:bg-gray-50">
            Log Out
          </button>
        </header>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-4 sm:px-6 pb-6">
          {/* Message Thread */}
          <div className="flex flex-col gap-6 py-6">
            {/* User message */}
            <div className="self-end bg-[#f1f2f9] text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
              Am I entitled to get paid breaks?
            </div>

            {/* Assistant message */}
            <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
              <p className="mb-4">
                Yes, depending on your jurisdiction, you may be entitled to paid
                breaks.
              </p>
              <p className="mb-4">
                In many provinces (e.g., Ontario), employees are entitled to a
                30-minute unpaid break after 5 consecutive hours of work.
                However, paid rest breaks (like two 15-minute coffee breaks) are
                not mandatory under the law — they are often provided by the
                employer as part of company policy.
              </p>
              <a href="#" className="font-bold text-blue-800 underline">
                Learn more from the Canadian Department of Labour.
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
  )
}
