/* eslint-disable */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquareCode, Search } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import {ChatSideBar, MessageThread, InputMessage, Header} from './global_components';

import Image from "next/image";
import ProvincePopup from "../../components/province";
import { Message } from '@/models/schema';

const MAX_HISTORY = 10;

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const [province, setProvince] = useState<string>('');
  const [messages, setMessages] = useState([] as Message[]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const prov = sessionStorage.getItem('province');
    if (prov) setProvince(prov);

    const storedMessages = sessionStorage.getItem('messages');
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
        sessionStorage.removeItem('messages');
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    if (province) sessionStorage.setItem('province', province);
    console.log(province);
  }, [province]);

  useEffect(() => {
    sessionStorage.setItem('messages', JSON.stringify(messages));
  }, [messages]);

  // const appendToHistory = (q: string, a: string) => {
  //   const next = [...chatHistory, { question: q, answer: a }];
  //   if (next.length > MAX_HISTORY) {
  //     setShowLimitModal(true);
  //   } else {
  //     setChatHistory(next);
  //   }
  // };

  useEffect(() => {
    console.log(province);
  }, []);

  const suggestedQuestions = [
    "Do I get paid breaks?",
    "What is the minimum wage?", 
    "Do I get sick days?"
  ];

  const handleLimitLogin = () => {
    router.push('/LogIn');
  };

  // const handleLimitNew = () => {
  //   setChatHistory([]);
  //   sessionStorage.removeItem('chatHistory');
  //   setShowLimitModal(false);
  // };

  // const handleSuggestedQuestion = (question: string) => {
  //   setSearchQuery(question);
  //   handleSearch();
  // };

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  const handleLogIn = () => {
    router.push('/LogIn/[...rest]');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header province={province} setProvince={setProvince} />
  
      <div className="flex flex-col flex-1 overflow-hidden px-6 pb-2">
        {!isSignedIn && !province && (
          <ProvincePopup onSave={(prov) => setProvince(prov)} />
        )}
  
        <div className="flex-1 overflow-y-auto">
          <MessageThread messageList={messages} error={error} />
        </div>
  
        <InputMessage
          isPrivate={false}
          setError={setError}
          setMessages={setMessages}
          province={province}
        />
  
        <p className="text-center text-sm text-gray-500 mt-2">
          Gail can make mistakes. Your privacy is protected.
        </p>
      </div>
    </div>
  );
  
}