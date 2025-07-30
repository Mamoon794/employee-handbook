'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {MessageThread, InputMessage, Header, PublicChatSideBar, Disclaimer, PopularQuestions } from './global_components';
import { useRouter } from 'next/navigation';
import axiosInstance from './axios_config';

import ProvincePopup from "../../components/province";
import { Message } from '@/models/schema';
import { Chat } from './global_components';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  const [inputValue, setInputValue] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [province, setProvince] = useState<string>('');
  const [messages, setMessages] = useState([] as Message[]);
  const [error, setError] = useState<{message: string, chatId: string}>({message: '', chatId: ''});
  const [currChatId, setCurrChatId] = useState<string>('');
  const [titleLoading, setTitleLoading] = useState(false)

  useEffect(() => {
    const storedChats = localStorage.getItem("publicChats")
    if (storedChats) {
      try {
        setChats(JSON.parse(storedChats))
      } catch {
        setChats([])
      }
    }

    const storedChatId = localStorage.getItem("currPublicChatId")
    if (storedChatId) setCurrChatId(storedChatId)
  }, [])

  useEffect(() => {
    localStorage.setItem("publicChats", JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem("currPublicChatId", currChatId)
  }, [currChatId])

  useEffect(() => {
    const stored = localStorage.getItem("publicChats")
    if (stored) {
      const parsed = JSON.parse(stored)
      const chat = parsed.find((c: Chat) => c.id === currChatId)
      if (chat) setMessages(chat.messages || [])
    }
  }, [currChatId])

  useEffect(() => {
    if (isSignedIn && user) {
      axiosInstance.get(`/api/users/${user.id}?isClerkID=true`)
        .then(response => {
          const userData = response.data[0];
          if (userData) {
            if (userData.userType === 'Employee') {
              // Employees get free access to chat
              router.push('/chat');
            } else if (userData.userType === 'Owner') {
              // Check subscription status for owners/employers
              if (userData.isSubscribed) {
                router.push('/dashboard');
              } else {
                router.push('/dashboard'); // Show dashboard with paywall popup
              }
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
      <PublicChatSideBar 
        setCurrChatId={setCurrChatId} 
        currChatId={currChatId} 
        setMessages={setMessages} 
        chats={chats} 
        setChats={setChats}
        titleLoading={titleLoading}
      />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header province={province} setProvince={setProvince} />
    
        <main className="flex-1 flex flex-col justify-between px-6 pb-6 relative">
          {!isSignedIn && !province && (
            <ProvincePopup onSave={(prov) => setProvince(prov)} />
          )}

          <MessageThread messageList={messages} error={error} chatId={currChatId} />
          <div
            className="absolute bottom-6 left-0 right-0 mx-10"
          >
            {messages.length === 0 && (
              <PopularQuestions setInputValue={setInputValue} />
            )}

            <InputMessage
              inputValue={inputValue}
              setInputValue={setInputValue}
              isPrivate={false}
              setError={setError}
              setMessages={setMessages}
              province={province}
              chats={chats}
              setTitleLoading={setTitleLoading}
              setChats={setChats}
              chatId={currChatId}
              setCurrChatId={setCurrChatId}
            />
            
            <Disclaimer/>
          </div>
        </main>
      </div>
    </div>
  );
}