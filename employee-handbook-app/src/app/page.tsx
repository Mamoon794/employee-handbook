/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import {ChatSideBar, MessageThread, InputMessage, Header} from './global_components';

import Image from "next/image";
import ProvincePopup from "../../components/province";

const MAX_HISTORY = 10;

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const [province, setProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<
    { question: string; answer: string }[]
  >([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prov = sessionStorage.getItem('province');
    if (prov) setProvince(prov);

    const hist = sessionStorage.getItem('chatHistory');
    if (hist) setChatHistory(JSON.parse(hist));
  }, []);

  useEffect(() => {
    if (province) sessionStorage.setItem('province', province);
  }, [province]);

  useEffect(() => {
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const appendToHistory = (q: string, a: string) => {
    const next = [...chatHistory, { question: q, answer: a }];
    if (next.length > MAX_HISTORY) {
      setShowLimitModal(true);
    } else {
      setChatHistory(next);
    }
  };

  useEffect(() => {
    console.log(answer);
  }, [answer]);

  const suggestedQuestions = [
    "Do I get paid breaks?",
    "What is the minimum wage?", 
    "Do I get sick days?"
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim() || !province) return;
    try {
      const res = await fetch('/api/public/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province,
          question: searchQuery,
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      if (data.response) {
        setAnswer(data.response);
        appendToHistory(searchQuery, data.response);
      } else {
        setAnswer('Oops, something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setAnswer('Oops, something went wrong.');
    }
  };

  const handleLimitLogin = () => {
    router.push('/LogIn');
  };

  const handleLimitNew = () => {
    setChatHistory([]);
    sessionStorage.removeItem('chatHistory');
    setShowLimitModal(false);
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
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header/>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          { !isSignedIn && !province && (<ProvincePopup onSave={(prov) => setProvince(prov)} />) }

          {/* Message Thread */}
          <MessageThread messageList={messages} />

          {/* Input Bar */}
          <InputMessage setMessages={setMessages} chatId={currChatId}/>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>        
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-4xl mx-auto w-full">

        <div className="min-h-screen bg-white">
          <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 max-w-7xl mx-auto w-full">
            <div
            ref={threadRef}
            className="flex-1 flex flex-col gap-6 py-6 overflow-y-auto"
            >
            {chatHistory.map((entry, i) => (
              <div key={i}>
                <div className="self-end bg-[#f1f2f9] text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
                  {entry.question}
                </div>
                <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm mt-2">
                  {entry.answer.split('\n').map((line, idx) => (
                    <p key={idx} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            ))}
            </div>

            {chatHistory.length === 0 && (
              <h2 className="text-4xl font-medium text-gray-900 mb-12 text-center">
              What can I help you with?
              </h2>
            )}

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
                onKeyDown={handleKeyPress}
                className="w-full px-6 py-4 border border-gray-300 rounded-full text-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14"
              />
              <button
                onClick={handleSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>

          </main>
        </div>
      </main>
    </div>  
  );
}