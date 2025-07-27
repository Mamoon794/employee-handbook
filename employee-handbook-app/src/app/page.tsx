'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {MessageThread, InputMessage, Header, PublicChatSideBar } from './global_components';
import { useRouter } from 'next/navigation';
import axiosInstance from './axios_config';

import ProvincePopup from "../../components/province";
import { Message } from '@/models/schema';
import { Chat } from './global_components';

function generateThreadId(): string {
  return Date.now().toString();
}

export default function Home() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  const [inputValue, setInputValue] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [province, setProvince] = useState<string>('');
  const [messages, setMessages] = useState([] as Message[]);
  const [error, setError] = useState<string>('');
  const [currChatId, setCurrChatId] = useState<string>('');
  // const [sidebarOpen, setSidebarOpen] = useState(true);

  const threadIdRef = useRef<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("currPublicChatId");
    if (storedId) {
      threadIdRef.current = storedId;
    } else {
      const newId = generateThreadId();
      threadIdRef.current = newId;
      localStorage.setItem("currPublicChatId", newId);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && user) {
      axiosInstance.get(`/api/users/${user.id}?isClerkID=true`)
        .then(response => {
          const userData = response.data[0];
          if (userData) {
            if (userData.userType === 'Employee') {
              router.push('/chat');
            } else if (userData.userType === 'Owner') {
              router.push('/dashboard');
              console.log('Redirecting to dashboard');
            } else {
              router.push('/chat');
            }
          }
        })
        .catch(error => {
          console.error('Error fetching user data for redirect:', error);
          router.push('/chat');
        });
    }
  }, [isSignedIn, user, router]);


  useEffect(() => {
    const prov = localStorage.getItem('province');
    if (prov) setProvince(prov);
  }, []);

  useEffect(() => {
    if (province) localStorage.setItem('province', province);
    console.log(province);
  }, [province]);

  return (
    <div className="min-h-screen flex bg-white flex-row">
      <PublicChatSideBar setCurrChatId={setCurrChatId} currChatId={currChatId} setMessages={setMessages} chats={chats} setChats={setChats}/>
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header province={province} setProvince={setProvince} />
    
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
        <div className="flex flex-col flex-1 px-6 pb-2 overflow-hidden">
          {!isSignedIn && !province && (
            <ProvincePopup onSave={(prov) => setProvince(prov)} />
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
            threadId={threadIdRef.current}
            chats={chats}
            setChats={setChats}
            chatId={currChatId}
          />
    
          <p className="text-center text-sm text-gray-500 mt-2">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </div>
        </main>
      </div>
    </div>
  );
}