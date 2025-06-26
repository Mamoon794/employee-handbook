'use client';

import { useState } from 'react';
import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
import { Message } from '../../models/schema'; 



export default function ChatUI() {
  const [messages, setMessages] = useState([] as Message[]);
  const [error, setError] = useState<string>('')
  const [currChatId, setCurrChatId] = useState<string>('');
  const [province, setProvince] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar (History) */}
      <ChatSideBar setCurrChatId={setCurrChatId} setMessages={setMessages} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header province={province} setProvince={setProvince}/>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <MessageThread messageList={messages} error={error} />

          {/* Input Bar */}
          <InputMessage inputValue={inputValue} setInputValue={setInputValue} isPrivate={true} setMessages={setMessages} chatId={currChatId} setError={setError} threadId=""/>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>
      </div>
    </div>
  );
}