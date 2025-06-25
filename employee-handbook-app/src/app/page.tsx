/* eslint-disable */

// The main development branch
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {MessageThread, InputMessage, Header} from './global_components';
import { useRouter } from 'next/navigation';

import ProvincePopup from "../../components/province";
import { Message } from '@/models/schema';

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [inputValue, setInputValue] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [messages, setMessages] = useState([] as Message[]);
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isSignedIn){
      router.push('/chat');
    }
      
    }, [isSignedIn]);

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

  useEffect(() => {
    console.log(province);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header province={province} setProvince={setProvince} />
  
      <div className="flex flex-col flex-1 px-6 pb-2 overflow-hidden">
        {!isSignedIn && !province && (
          <ProvincePopup onSave={(prov) => setProvince(prov)} />
        )}

      {messages.length === 0 && (
        <div className="flex flex-col justify-center items-center text-center h-full">
          <h2 className="text-5xl font-bold text-blue-800 mb-2">Welcome to Gail!</h2>
          <h3 className="text-xl font-medium text-blue-800">
            Your workplace rights & regulations chatbot
          </h3>
        </div>
      )}
  
        <div className="flex-1 overflow-y-auto">
          <MessageThread messageList={messages} error={error} />
        </div>

        {messages.length === 0 && (
          <div className="flex justify-center gap-4 pb-4">
            {[
              "Do I get paid breaks?",
              "What is the minimum wage?",
              "Do I get sick days?",
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => setInputValue(q)}
                className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <InputMessage
          inputValue={inputValue}
          setInputValue={setInputValue}
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