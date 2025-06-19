/* eslint-disable */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';

import Image from "next/image";
import ProvincePopup from "../../components/province";

export default function Home() {
  const [province, setProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { isSignedIn } = useUser();

  const suggestedQuestions = [
    "Do I get paid breaks?",
    "What is the minimum wage?", 
    "Do I get sick days?"
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // can call the api routes here for backend 
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setSearchQuery(question);
    handleSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  const handleLogIn = () => {
    router.push('/LogIn/[...rest]');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
          <div className="flex gap-3 items-center">
            {!isSignedIn ? (
              <>
                <button 
                  onClick={handleLogIn}
                  className="px-6 py-2 bg-blue-800 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={handleSignUp}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </header>
      </div>

      <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 max-w-7xl mx-auto w-full">
        {/* <ProvincePopup onSave={(prov) => setProvince(prov)} /> */}
        {!isSignedIn && <ProvincePopup onSave={(prov) => setProvince(prov)} />}
        
        <h2 className="text-4xl font-medium text-gray-900 mb-12 text-center">
          What can I help you with?
        </h2>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedQuestion(question)}
              className="px-6 py-3 bg-blue-800 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>

        <div className="w-full max-w-2xl relative">
          <input
            type="text"
            placeholder="Ask anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-6 py-4 border border-gray-300 rounded-full text-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14"
          />
          <button
            onClick={handleSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-500 text-sm mt-8 text-center">
          Gail can make mistakes. Your privacy is protected.
        </p>
      </main>
    </div>
  );
}