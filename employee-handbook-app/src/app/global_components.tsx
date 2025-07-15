/* eslint-disable */

'use client';

import { useEffect, useState, Dispatch, SetStateAction, useRef } from 'react';
import { Plus, Menu, Trash2 } from 'lucide-react';
import axiosInstance from './axios_config';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { Message } from '../models/schema'; 
import { marked } from 'marked';
import dynamic from "next/dynamic";


const InputMessage = dynamic(() => import('./MessageInput').then(mod => mod.MessageInput), {
  ssr: false,
});

interface Chat {
    id: string;
    title: string;
    needsTitleUpdate?: boolean;
}

function ChatSideBar({setMessages, setCurrChatId, currChatId, titleLoading, chats, setChats, setTitleLoading}: {setMessages: Dispatch<SetStateAction<Message[]>>, setCurrChatId: (chatId: string) => void, currChatId: string,  titleLoading: boolean, chats: Chat[], setChats: Dispatch<SetStateAction<Chat[]>>, setTitleLoading: Dispatch<SetStateAction<boolean>>}) {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
      const localUserId = localStorage.getItem('userId');
      if (localUserId) {
        axiosInstance.get(`/api/chat/${localUserId}?isUserID=true`)
        .then((response) => {
          const chatData = response.data.map((chat: any) => ({
            id: chat.id,
            title: chat.title,
            needsTitleUpdate: chat.title && chat.title.startsWith('Chat - ')
          }));
          setChats(chatData);
          setSelectedChat(chatData.find((chat: Chat) => chat.id === currChatId) || null);
        });
      }
        
    }, [currChatId]);

    useEffect(() => {
      async function fetchChats() {
        const localUserId = localStorage.getItem('userId');
        setUserId(localUserId);
        const allChats = await axiosInstance.get(`/api/chat/${localUserId}?isUserID=true`);
        const chatData = allChats.data.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          needsTitleUpdate: chat.title && chat.title.startsWith('Chat - ')
        }));
        setChats(chatData);
        if (chatData.length > 0) {
          setSelectedChat(chatData[0]);
          // Fetch messages for the first chat
          const firstChatMessages = await axiosInstance.get(`/api/chat/${chatData[0].id}`);
          setMessages(firstChatMessages.data.messages);
          setCurrChatId(chatData[0].id);
        }
      }

      fetchChats();
    }, []);

    async function handleChatChange(currChat: Chat){
        setSelectedChat(currChat);
        const currMessages = await axiosInstance.get(`/api/chat/${currChat.id}`)
        setMessages(currMessages.data.messages);
        setCurrChatId(currChat.id);
    }

    async function handleNewChat() {
        if (!userId) return;

        const newChat = {
            title: `Chat - ${new Date().toLocaleDateString()}-${chats.length + 1}`,
            userId: userId,
            messages: [] as Message[],
            needsTitleUpdate: true, // <-- add this flag
        };

        try {
            const response = await axiosInstance.post('/api/chat', newChat);
            const createdChat = response.data
            console.log('New chat created:', createdChat);
            setChats([{ id: createdChat.id, title: newChat.title, needsTitleUpdate: true }, ...chats]);
            setSelectedChat({ id: createdChat.id, title: newChat.title, needsTitleUpdate: true });
            setMessages(newChat.messages || []);
            setCurrChatId(createdChat.id);
            // Removed AI title generation here; will be handled after first message in InputMessage
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }


    return(
        <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
        <div className="flex justify-between items-center p-4">
          <Menu className="text-gray-400" />
        </div>
        <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
        {chats.map((chat, index) => (
          <button
            key={`${chat.id}-${index}`}
            className="bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f]"
            onClick={() => {
              handleChatChange(chat);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {titleLoading && selectedChat?.id === chat.id ? "Generating..." : chat.title}
              </span>
              {selectedChat?.id === chat.id && (
                <Trash2 className="text-gray-400" onClick={()=>{
                  axiosInstance.delete(`/api/chat/${chat.id}`)
                    .then(() => {
                      setChats(chats.filter(c => c.id !== chat.id));
                      if (selectedChat?.id === chat.id) {
                        setSelectedChat(null);
                        setMessages([]);
                        setCurrChatId('');
                      }
                    })
                    .catch(error => {
                      console.error('Error deleting chat:', error);
                    });
                }} />
              )}
            </div>
          </button>
        ))}

        {/* New Chat Button */}
        <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
          <Plus className="text-[#1F2251]" onClick={handleNewChat} />
        </button>
      </aside>
    )
}


function MessageThread({
  messageList,
  error,
}: {
  messageList: Message[];
  error: string;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList, error]);

  const handleRetry = () => {
    // TODO
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-1 overflow-y-auto" style={{ height: 'calc(100vh - 200px)'}}>
    {messageList.length === 0 ? (
            <div className="flex flex-col justify-center items-center text-center">
              <h2 className="text-5xl font-bold text-blue-800 mb-2">Welcome to Gail!</h2>
              <h3 className="text-xl font-medium text-blue-800">
                Your workplace rights & regulations chatbot
              </h3>
            </div>
          ):
      messageList.map((message, index) => (
        <div key={index} className="flex flex-col">
          {message.isFromUser ? (
            <div className="self-end bg-[#f1f2f9] text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm">
              <p>{message.content}</p>
            </div>
          ) : (
            <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm">
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(message.content),
                }}
              />
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {message.sources
                    .filter((link) => link.url)
                    .map((link, linkIndex) => (
                      <a
                        key={`${index}-${linkIndex}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-800 underline font-medium hover:text-blue-600 transition w-fit"
                      >
                        {link.title?.trim() || "View PDF Source"}
                      </a>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="self-start border border-red-500 bg-red-200 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm">
          <div>{error}</div>
          <div className="pt-4">
            <button
            onClick={handleRetry}
            className="border border-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-md bg-white hover:bg-gray-200 transition-colors">
              Try again
            </button>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="py-10"/>
    </div>
  );
}


function Header({ province, setProvince }: { province: string; setProvince: (prov: string) => void }) {
    const { isSignedIn, user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn && user) {
            axiosInstance.get(`/api/users/${user.id}?isClerkID=true`)
            .then(response => {
              localStorage.setItem('userId', response.data[0].id);
              localStorage.setItem('companyId', response.data[0].companyId || '');
              setProvince(response.data[0].province || '');
            })
            .catch(error => {
              console.error('Error fetching user data:', error);
            });
        } 
        else {
            localStorage.removeItem('userId');
        }
    }, [isSignedIn, user]);

    
    return(
        <header className="flex justify-between items-center px-6 py-4">
          <h1 className="text-2xl font-bold text-blue-800">Gail</h1>
          <div className="flex gap-3 items-center">
            {!isSignedIn ? (
              <>
                {province !== "" && <span className="px-4"><ProvinceDropdown province={province} setProvince={setProvince} /></span>}
                <LogIn />
                <SignUp />
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

export function LogIn() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/LogIn/[...rest]');
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-800 text-white font-semibold px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
    >
      Log in
    </button>
  );
}

function SignUp() {
  const router = useRouter();

  const handleSignUp = () => {
    router.push('/SignUp');
  };

  return (
    <button
      onClick={handleSignUp}
      className="border border-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-md hover:bg-gray-200 transition-colors"
    >
      Sign up
    </button>
  );
}

function ProvinceDropdown({
  province,
  setProvince,
}: {
  province: string;
  setProvince: (prov: string) => void;
}) {
  const provinceMap: { [fullName: string]: string } = {
    "Alberta": "AB",
    "British Columbia": "BC",
    "Manitoba": "MB",
    "New Brunswick": "NB",
    "Newfoundland and Labrador": "NL",
    "Northwest Territories": "NT",
    "Nova Scotia": "NS",
    "Nunavut": "NU",
    "Ontario": "ON",
    "Prince Edward Island": "PE",
    "Quebec": "QC",
    "Saskatchewan": "SK",
    "Yukon": "YT"
  };

  const reverseProvinceMap: { [abbr: string]: string } = Object.fromEntries(
    Object.entries(provinceMap).map(([full, abbr]) => [abbr, full])
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const abbr = e.target.value;
    const full = reverseProvinceMap[abbr];
    if (full) {
      setProvince(full);
    }
  };

  return (
    <select
      value={provinceMap[province]}
      onChange={handleChange}
      className="text-gray-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-50 transition-colors w-[80px]"
    >
      <option value="" disabled>Select</option>
      {Object.values(provinceMap).map((abbr) => (
        <option key={abbr} value={abbr}>{abbr}</option>
      ))}
    </select>
  );
}


export {ChatSideBar, MessageThread, InputMessage, Header};