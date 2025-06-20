'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Menu, Pencil } from 'lucide-react';
import axiosInstance from './axios_config';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

interface message{
    type: 'user' | 'bot';
    content: string;
    links?: { title: string; url: string }[];
}

interface Chat {
    id: string;
    title: string;
};

function ChatSideBar({setMessages}: {setMessages: (messages: message[]) => void}) {
    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    useEffect(() => {
      async function fetchChats() {
        const allChats = await axiosInstance.get('/chats');
        const chatData = allChats.data.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
        }));
        setChats(chatData);
        if (chatData.length > 0) {
          setSelectedChat(chatData[0]);
          // Fetch messages for the first chat
          const firstChatMessages = await axiosInstance.get(`/chat/${chatData[0].id}/messages`);
          setMessages(firstChatMessages.data);
        }
      }
      fetchChats();
    }, []);

    async function handleChatChange(currChat: Chat){
        setSelectedChat(currChat);
        const currMessages = await axiosInstance.get(`/chat/${currChat.id}/messages`)
        setMessages(currMessages.data);
    }


    return(
        <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
        <div className="flex justify-between items-center p-4">
          <Menu className="text-gray-400" />
        </div>
        <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
        {chats.map((chat) => (
          <button
            key={chat.id}
            className="bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f]"
            onClick={() => {
              handleChatChange(chat);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{chat.title}</span>
              {selectedChat?.id === chat.id && (
                <Pencil className="text-gray-400" />
              )}
            </div>
          </button>
        ))}

        {/* New Chat Button */}
        <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
          <Plus className="text-[#1F2251]" />
        </button>
      </aside>
    )
}

type Links = {
    title: string;
    url: string;
}

type Message = {
    type: 'user' | 'bot';
    content: string;
    links?: Links[];
};



function MessageThread({messageList}: {messageList: Message[]}) {
    return (
        <div className="flex flex-col gap-6 py-6">
            {messageList.map((message, index) => (
                <div key={index} className='flex flex-col'>
                {message.type === 'user' ? (
                    <div className="self-end bg-[#f1f2f9] text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
                        <p>{message.content}</p>
                        </div>
                ) : (

                        <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-2xl max-w-[70%] shadow-sm">
                        <p>{message.content}</p>
                        {message.links && message.links.map((link, linkIndex) => (
                        <a
                            key={`${index}-${linkIndex}`}
                            href={link.url}
                            className="mt-4 inline-block font-bold text-blue-800 underline"
                        >
                            {link.title}
                        </a>
                        ))}
                    </div>
                )}
                </div>
            ))}
        </div>
    );
}


function InputMessage({value}: {value?: string}) {
    const [inputValue, setInputValue] = useState(value || '');
    return(
        <div className="relative w-full max-w-3xl mx-auto">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything"
              className="w-full px-6 py-4 border border-gray-300 rounded-full text-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <Search className="w-6 h-6" />
            </button>
          </div>
    )
}


function Header(){
  const { isSignedIn } = useUser();
    const router = useRouter();
    function handleSignup() {
        router.push('/SignUp');
    };

    function handleLogin() {
      router.push('/LogIn/[...rest]');
    }


    
    return(
        <header className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
          <div className="flex gap-3 items-center">
            {!isSignedIn ? (
              <>
                <button 
                  onClick={handleLogin}
                  className="px-6 py-2 bg-blue-800 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={handleSignup}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            )}
          </div>
        </header>
    )
}

export {ChatSideBar, MessageThread, InputMessage, Header};
