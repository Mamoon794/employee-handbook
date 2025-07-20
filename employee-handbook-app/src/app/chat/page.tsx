'use client';

import { useEffect, useState } from 'react';
import {PrivateChatSideBar, MessageThread, InputMessage, Header, Chat} from '../global_components';
import { Message } from '../../models/schema'; 
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ChatUI() {
  const [messages, setMessages] = useState([] as Message[]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string>('')
  const [currChatId, setCurrChatId] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [titleLoading, setTitleLoading] = useState(false); 

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push('/');
    }

    }, [isSignedIn]);
  

  return (
    <div className="min-h-screen flex bg-white flex-row">
      {/* Sidebar (History) */}
      <PrivateChatSideBar setCurrChatId={setCurrChatId} currChatId={currChatId} setMessages={setMessages} titleLoading={titleLoading} chats={chats} setChats={setChats} setTitleLoading={setTitleLoading} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header province={province} setProvince={setProvince}/>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <MessageThread messageList={messages} error={error} />

          {/* Input Bar */}
          <InputMessage inputValue={inputValue} province={province} setInputValue={setInputValue} isPrivate={true} setMessages={setMessages} chatId={currChatId} setCurrChatId={setCurrChatId} setError={setError} setTitleLoading={setTitleLoading} setChats={setChats} chats={chats}/>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>
      </div>
    </div>
  );
}