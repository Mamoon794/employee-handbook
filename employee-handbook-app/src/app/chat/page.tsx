'use client';

import { useEffect, useState, Suspense } from 'react';
import { PrivateChatSideBar, MessageThread, InputMessage, Header, Disclaimer, PopularQuestions } from '../global_components';
import { type Message } from '../../models/schema'; 
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface Chat {
  id: string;
  title: string;
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState('');
  const [currChatId, setCurrChatId] = useState('');
  const [province, setProvince] = useState('');
  const [inputValue, setInputValue] = useState('');
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [titleLoading, setTitleLoading] = useState(false);
  const [totalChatsLength, setTotalChatsLength] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCompany, setWelcomeCompany] = useState('');

  // Handle authentication
  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push('/');
    }
  }, [isSignedIn, router]);

  // Handle welcome message and confetti
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const welcomeParam = params.get('welcome');
    const companyParam = params.get('company');
    
    if (welcomeParam === 'true' && companyParam) {
      setShowWelcome(true);
      setWelcomeCompany(decodeURIComponent(companyParam));

      const triggerConfetti = () => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#242267', '#294494', '#3a7bd5'],
        });
      };

      const timer = setTimeout(triggerConfetti, 100);
      
      const cleanUrl = () => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('welcome');
        newUrl.searchParams.delete('company');
        window.history.replaceState({}, '', newUrl.toString());
      };

      const urlTimer = setTimeout(cleanUrl, 1000);

      return () => {
        clearTimeout(timer);
        clearTimeout(urlTimer);
      };
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Welcome to {welcomeCompany}!
            </h2>
            <p className="text-gray-600 mb-6">
              You can now ask questions specific to your company&apos;s policies.
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

      {/* Chat Sidebar with all props */}
      <PrivateChatSideBar
        setCurrChatId={setCurrChatId}
        currChatId={currChatId}
        setMessages={setMessages}
        titleLoading={titleLoading}
        chats={chats}
        setChats={setChats}
        totalChatsLength={totalChatsLength}
        setTotalChatsLength={setTotalChatsLength}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          province={province} 
          setProvince={setProvince}
          companyName={user?.publicMetadata.companyName as string || ''}
        />

        <main className="flex-1 flex flex-col justify-between px-6 pb-6 relative">
          <MessageThread messageList={messages} error={error} />

          <div className="absolute bottom-6 left-0 right-0 mx-10">
            {messages.length === 0 && (
              <PopularQuestions setInputValue={setInputValue} />
            )}

            <InputMessage 
              inputValue={inputValue} 
              province={province} 
              setInputValue={setInputValue} 
              isPrivate={true} 
              setMessages={setMessages} 
              chatId={currChatId} 
              setCurrChatId={setCurrChatId} 
              setError={setError}  
              setChats={setChats} 
              chats={chats}
            />

            <Disclaimer/>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-blue-800">Loading chat interface...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

// TRYING TO FIX MERGE ISSUES

// <<<<<<< HEAD
// 'use client';

// import { useEffect, useState } from 'react';
// import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
// import { Message } from '../../models/schema'; 
// import { useUser } from '@clerk/nextjs';
// import { useRouter, useSearchParams } from 'next/navigation';
// import confetti from 'canvas-confetti';

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
//   const { isSignedIn, user } = useUser();
//   const [titleLoading, setTitleLoading] = useState(false);
//   const searchParams = useSearchParams();
//   const [showWelcome, setShowWelcome] = useState(false);
//   const [welcomeCompany, setWelcomeCompany] = useState('');
// =======
// "use client"

// import { useEffect, useState } from "react"
// import {
//   PrivateChatSideBar,
//   MessageThread,
//   InputMessage,
//   Header,
//   Chat,
//   Disclaimer,
//   PopularQuestions,
// } from "../global_components"
// import { Message } from "../../models/schema"
// import { useUser } from "@clerk/nextjs"
// import { useRouter } from "next/navigation"

// export default function ChatUI() {
//   const [messages, setMessages] = useState([] as Message[])
//   const [chats, setChats] = useState<Chat[]>([])
//   const [error, setError] = useState<string>("")
//   const [currChatId, setCurrChatId] = useState<string>("")
//   const [province, setProvince] = useState<string>("")
//   const [inputValue, setInputValue] = useState<string>("")
//   const router = useRouter()
//   const { isSignedIn } = useUser()
//   const [titleLoading, setTitleLoading] = useState(false)
//   const [totalChatsLength, setTotalChatsLength] = useState<number>(0)
// >>>>>>> 955ccfd29a21d67c2a6b9e47610d9bd889f0e284

//   useEffect(() => {
//     if (!isSignedIn && isSignedIn !== undefined) {
//       router.push("/")
//     }
// <<<<<<< HEAD
//   }, [isSignedIn]);

//   // checking for welcome message
//   useEffect(() => {
//     const welcomeParam = searchParams.get('welcome');
//     const companyParam = searchParams.get('company');
    
//     if (welcomeParam === 'true' && companyParam) {
//       setShowWelcome(true);
//       setWelcomeCompany(decodeURIComponent(companyParam));

//       const showConfetti = () => {
//       confetti({
//         particleCount: 150,
//         spread: 70,
//         origin: { y: 0.6 },
//         colors: ['#242267', '#294494', '#3a7bd5'],
//       });
//     };

//     setTimeout(showConfetti, 100);
      
//       const newUrl = new URL(window.location.href);
//       newUrl.searchParams.delete('welcome');
//       newUrl.searchParams.delete('company');
//       window.history.replaceState({}, '', newUrl.toString());
//     }
//   }, [searchParams]);

//   return (
//     <div className="min-h-screen flex bg-white">
//       {/* New Welcome Modal */}
//       {showWelcome && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//     <div className="bg-white rounded-lg shadow-md p-8 w-[95%] max-w-md text-center">
//       <h2 className="text-2xl font-semibold mb-6 text-gray-800">
//         Welcome to {welcomeCompany}!
//       </h2>
//       <p className="text-gray-600 mb-6">
//         You can now ask questions specific to your company's policies.
//       </p>
//       <button 
//         onClick={() => setShowWelcome(false)}
//         className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-700 transition-colors mx-auto"
//       >
//         Get Started
//       </button>
//     </div>
//   </div>
// )}

//       {/* Sidebar (History) */}
//       <ChatSideBar 
//         setCurrChatId={setCurrChatId} 
//         currChatId={currChatId} 
//         setMessages={setMessages} 
//         titleLoading={titleLoading} 
//         chats={chats} 
//         setChats={setChats} 
//         setTitleLoading={setTitleLoading} 
// =======
//   }, [isSignedIn])

//   return (
//     <div className="min-h-screen flex bg-white flex-row">
//       {/* Sidebar (History) */}
//       <PrivateChatSideBar
//         setCurrChatId={setCurrChatId}
//         currChatId={currChatId}
//         setMessages={setMessages}
//         titleLoading={titleLoading}
//         chats={chats}
//         setChats={setChats}
//         setTitleLoading={setTitleLoading}
//         totalChatsLength={totalChatsLength}
//         setTotalChatsLength={setTotalChatsLength}
// >>>>>>> 955ccfd29a21d67c2a6b9e47610d9bd889f0e284
//       />

//       {/* Main Content */}
//       <div className="flex-1 flex flex-col min-h-screen">
// <<<<<<< HEAD
//         {/* Header - Now shows company name if available */}
//         <Header 
//           province={province} 
//           setProvince={setProvince}
//           companyName={user?.publicMetadata.companyName as string || ''}
//         />
// =======
//         {/* Header */}
//         <Header province={province} setProvince={setProvince} />
// >>>>>>> 955ccfd29a21d67c2a6b9e47610d9bd889f0e284

//         {/* Chat Area */}
//         <main className="flex-1 flex flex-col justify-between px-6 pb-6 relative">
//           {/* Message Thread */}
//           <MessageThread messageList={messages} error={error} />

// <<<<<<< HEAD
//           {/* Input Bar */}
//           <InputMessage 
//             inputValue={inputValue} 
//             province={province} 
//             setInputValue={setInputValue} 
//             isPrivate={true} 
//             setMessages={setMessages} 
//             chatId={currChatId} 
//             setCurrChatId={setCurrChatId} 
//             setError={setError} 
//             setTitleLoading={setTitleLoading} 
//             setChats={setChats} 
//             chats={chats}
//           />
          
//           <p className="text-center text-sm text-gray-500 mt-4">
//             Gail can make mistakes. Your privacy is protected.
//           </p>
//         </main>
//       </div>
//     </div>
//   );
// }

// // 'use client';

// // import { useEffect, useState } from 'react';
// // import {ChatSideBar, MessageThread, InputMessage, Header} from '../global_components';
// // import { Message } from '../../models/schema'; 
// // import { useUser } from '@clerk/nextjs';
// // import { useRouter } from 'next/navigation';

// // interface Chat {
// //   id: string;
// //   title: string;
// // }


// // export default function ChatUI() {
// //   const [messages, setMessages] = useState([] as Message[]);
// //   const [chats, setChats] = useState<Chat[]>([]);
// //   const [error, setError] = useState<string>('')
// //   const [currChatId, setCurrChatId] = useState<string>('');
// //   const [province, setProvince] = useState<string>('');
// //   const [inputValue, setInputValue] = useState<string>('');
// //   const router = useRouter();
// //   const { isSignedIn } = useUser();
// //   const [titleLoading, setTitleLoading] = useState(false); 


  

// //   useEffect(() => {
// //     if (!isSignedIn && isSignedIn !== undefined) {
// //       router.push('/');
// //     }

// //     }, [isSignedIn]);
  

// //   return (
// //     <div className="min-h-screen flex bg-white">
// //       {/* Sidebar (History) */}
// //       <ChatSideBar setCurrChatId={setCurrChatId} currChatId={currChatId} setMessages={setMessages} titleLoading={titleLoading} chats={chats} setChats={setChats} setTitleLoading={setTitleLoading} />

// //       {/* Main Content */}
// //       <div className="flex-1 flex flex-col min-h-screen">
// //         {/* Header */}
// //         <Header province={province} setProvince={setProvince}/>

// //         {/* Chat Area */}
// //         <main className="flex-1 flex flex-col justify-between px-6 pb-6">
// //           {/* Message Thread */}
// //           <MessageThread messageList={messages} error={error} />

// //           {/* Input Bar */}
// //           <InputMessage inputValue={inputValue} province={province} setInputValue={setInputValue} isPrivate={true} setMessages={setMessages} chatId={currChatId} setCurrChatId={setCurrChatId} setError={setError} setTitleLoading={setTitleLoading} setChats={setChats} chats={chats}/>
          
// //           <p className="text-center text-sm text-gray-500 mt-4">
// //             Gail can make mistakes. Your privacy is protected.
// //           </p>
// //         </main>
// //       </div>
// //     </div>
// //   );
// // }
// =======
//           <div
//             className="absolute bottom-6 left-0 right-0 mx-10"
//           >
//             {messages.length === 0 && (
//               <PopularQuestions setInputValue={setInputValue} />
//             )}

//             {/* Input Bar */}
//             <InputMessage
//               inputValue={inputValue}
//               province={province}
//               setInputValue={setInputValue}
//               isPrivate={true}
//               setMessages={setMessages}
//               chatId={currChatId}
//               setCurrChatId={setCurrChatId}
//               setError={setError}
//               setTitleLoading={setTitleLoading}
//               setChats={setChats}
//               chats={chats}
//             />

//             <Disclaimer/>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }
// >>>>>>> 955ccfd29a21d67c2a6b9e47610d9bd889f0e284
