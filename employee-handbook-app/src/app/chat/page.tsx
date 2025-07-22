'use client';

import { useEffect, useState } from 'react';
import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
import { Message } from '../../models/schema'; 
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Chat {
  id: string;
  title: string;
}


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

  const handleRetry = async () => {
    setError("");

    const lastUserMessage = [...messages].reverse().find((msg) => msg.isFromUser === true);
    if (!lastUserMessage) return;

    setMessages((prev) => [...prev, lastUserMessage]);

    try {
      const res = await fetch('/api/public/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province,
          query: lastUserMessage.content,
          threadId: currChatId,
        }),
      });

      if (!res.ok) throw new Error('Network response was not ok');

      const data = await res.json();
      if (data.response) {
        const botMessage: Message = {
          content: data.response,
          isFromUser: false,
          createdAt: new Date(),
          sources: data.citations?.map((citation: any) => ({
            title: citation.title,
            url: citation.fragmentUrl || citation.originalUrl,
          })),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        setError('Oops, something went wrong. Want to try again?');
      }
    } catch (err) {
      console.error(err);
      setError('Oops, something went wrong. Want to try again?');
    }
  };

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push('/');
    }

    }, [isSignedIn]);
  

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar (History) */}
      <ChatSideBar setCurrChatId={setCurrChatId} currChatId={currChatId} setMessages={setMessages} titleLoading={titleLoading} chats={chats} setChats={setChats} setTitleLoading={setTitleLoading} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header province={province} setProvince={setProvince}/>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <MessageThread messageList={messages} error={error} onRetry={handleRetry} />

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
