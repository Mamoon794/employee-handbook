'use client';

import { useEffect, useState } from 'react';
import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
import { Message } from '../../models/schema'; 
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';

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
  const { isSignedIn, user } = useUser();
  const [titleLoading, setTitleLoading] = useState(false);
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCompany, setWelcomeCompany] = useState('');

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push('/');
    }
  }, [isSignedIn]);

  // checking for welcome message
  useEffect(() => {
    const welcomeParam = searchParams.get('welcome');
    const companyParam = searchParams.get('company');
    
    if (welcomeParam === 'true' && companyParam) {
      setShowWelcome(true);
      setWelcomeCompany(decodeURIComponent(companyParam));

      const showConfetti = () => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#242267', '#294494', '#3a7bd5'],
      });
    };

    setTimeout(showConfetti, 100);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('welcome');
      newUrl.searchParams.delete('company');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* New Welcome Modal */}
      {showWelcome && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Welcome to {welcomeCompany}!
      </h2>
      <p className="text-gray-600 mb-6">
        You can now ask questions specific to your company's policies.
      </p>
      <button 
        onClick={() => setShowWelcome(false)}
        className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mx-auto"
      >
        Get Started
      </button>
    </div>
  </div>
)}

      {/* Sidebar (History) */}
      <ChatSideBar 
        setCurrChatId={setCurrChatId} 
        currChatId={currChatId} 
        setMessages={setMessages} 
        titleLoading={titleLoading} 
        chats={chats} 
        setChats={setChats} 
        setTitleLoading={setTitleLoading} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Now shows company name if available */}
        <Header 
          province={province} 
          setProvince={setProvince}
          companyName={user?.publicMetadata.companyName as string || ''}
        />

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6">
          {/* Message Thread */}
          <MessageThread messageList={messages} error={error} />

          {/* Input Bar */}
          <InputMessage 
            inputValue={inputValue} 
            province={province} 
            setInputValue={setInputValue} 
            isPrivate={true} 
            setMessages={setMessages} 
            chatId={currChatId} 
            setCurrChatId={setCurrChatId} 
            setError={setError} 
            setTitleLoading={setTitleLoading} 
            setChats={setChats} 
            chats={chats}
          />
          
          <p className="text-center text-sm text-gray-500 mt-4">
            Gail can make mistakes. Your privacy is protected.
          </p>
        </main>
      </div>
    </div>
  );
}

// 'use client';

// import { useEffect, useState } from 'react';
// import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
// import { Message } from '../../models/schema'; 
// import { useUser } from '@clerk/nextjs';
// import { useRouter } from 'next/navigation';

// interface Chat {
//   id: string;
//   title: string;
// }


// export default function ChatUI() {
//   const [messages, setMessages] = useState([] as Message[]);
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [error, setError] = useState<string>('')
//   const [currChatId, setCurrChatId] = useState<string>('');
//   const [province, setProvince] = useState<string>('');
//   const [inputValue, setInputValue] = useState<string>('');
//   const router = useRouter();
//   const { isSignedIn } = useUser();
//   const [titleLoading, setTitleLoading] = useState(false); 


  

//   useEffect(() => {
//     if (!isSignedIn && isSignedIn !== undefined) {
//       router.push('/');
//     }

//     }, [isSignedIn]);
  

//   return (
//     <div className="min-h-screen flex bg-white">
//       {/* Sidebar (History) */}
//       <ChatSideBar setCurrChatId={setCurrChatId} currChatId={currChatId} setMessages={setMessages} titleLoading={titleLoading} chats={chats} setChats={setChats} setTitleLoading={setTitleLoading} />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col min-h-screen">
//         {/* Header */}
//         <Header province={province} setProvince={setProvince}/>

//         {/* Chat Area */}
//         <main className="flex-1 flex flex-col justify-between px-6 pb-6">
//           {/* Message Thread */}
//           <MessageThread messageList={messages} error={error} />

//           {/* Input Bar */}
//           <InputMessage inputValue={inputValue} province={province} setInputValue={setInputValue} isPrivate={true} setMessages={setMessages} chatId={currChatId} setCurrChatId={setCurrChatId} setError={setError} setTitleLoading={setTitleLoading} setChats={setChats} chats={chats}/>
          
//           <p className="text-center text-sm text-gray-500 mt-4">
//             Gail can make mistakes. Your privacy is protected.
//           </p>
//         </main>
//       </div>
//     </div>
//   );
// }