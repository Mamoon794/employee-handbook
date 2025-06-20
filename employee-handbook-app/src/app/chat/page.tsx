'use client';

import { useState } from 'react';
import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';



export default function ChatUI() {
  const [messages, setMessages] = useState([] as { type: "user" | "bot"; content: string; links?: { title: string; url: string }[] }[]);
  
  const dummyMessages: { type: "user" | "bot"; content: string; links?: { title: string; url: string }[] }[] = [
    {type: 'user', content: 'Am I entitled to get paid breaks?'},
    {
      type: 'bot',
      content: `In Ontario, employees are entitled to a 30-minute unpaid break after 5 consecutive hours of work. However, paid rest breaks (like two 15-minute coffee breaks) are not mandatory under the law — they are often provided by the employer as part of company policy.
      
      According to Rivvi’s policy, yes — you are entitled to two 15-minute paid breaks during a standard 8-hour shift.

      These breaks are in addition to your unpaid 30-minute lunch break. Paid breaks are considered part of your working hours and do not reduce your total pay.`,
      links: [
        { title: 'Rivvi’s Policy', url: '#'}
      ]
    }
  ];

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar (History) */}
      <ChatSideBar setMessages={setMessages} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header/>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <MessageThread messageList={dummyMessages} />

          {/* Input Bar */}
          <InputMessage/>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>
      </div>
    </div>
  );
}