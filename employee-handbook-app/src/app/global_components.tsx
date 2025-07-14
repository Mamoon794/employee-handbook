/* eslint-disable */

'use client';

import { useEffect, useState, Dispatch, SetStateAction, useRef } from 'react';
import { Search, Plus, Menu, Trash2 } from 'lucide-react';
import axiosInstance from './axios_config';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { Link, Message } from '../models/schema'; 
import { Citation } from '@/types/ai';
import { marked } from 'marked';
import { Fragment } from "react";
import { Listbox, Label, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";

interface PrivateChat {
    id: string;
    title: string;
};

interface PublicChat {
  id: string;
  title: string;
  messages: Message[];
}

function getRowClass(i: number, total: number) {
  if (total >= 3) {
    return i % 2 === 0 ? "bg-white" : "bg-gray-200";
  }
  return "bg-white border border-gray-200";
}

export function markdownListToTable(md: string): string {
  const renderer = new marked.Renderer();

  renderer.list = function(token: any) {
    const listItems = token.items.map((item: any) => {
      return marked.parser(item.tokens);
    });

    const rows = listItems
      .map(
        (item: string, i: number) =>
          `<tr class="${getRowClass(i, listItems.length)}"><td class="px-4 py-2">${item}</td></tr>`
      )
      .join("");

    return `
    <div class="w-full border border-gray-200 rounded-lg overflow-hidden my-4">
      <table class="w-full">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
    `;
  };

  const result = marked.parse(md, { renderer });
  if (typeof result === "string") {
    return result;
  }

  throw new Error("marked.parse returned a Promise, but a string was expected.");
}

function PublicChatSideBar({setMessages, setCurrChatId, currChatId}: {setMessages: Dispatch<SetStateAction<Message[]>>, setCurrChatId: (chatId: string) => void, currChatId: string}) {
  const [chats, setChats] = useState<PublicChat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("publicChats");
    if (stored) {
      try {
        setChats(JSON.parse(stored));
      } catch {
        setChats([]);
      }
    }

    const sel = localStorage.getItem("currPublicChatId");
    if (sel) setCurrChatId(sel);
  }, [setCurrChatId]);

  const selectChat = (chat: PublicChat) => {
    setCurrChatId(chat.id);
    setMessages(chat.messages || []);
    localStorage.setItem("currPublicChatId", chat.id);
  };

  const handleNewChat = () => {
    const newChat: PublicChat = {
      id: Date.now().toString(),
      title: `Chat - ${new Date().toLocaleDateString()}-${chats.length + 1}`,
      messages: [],
    };
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    setCurrChatId(newChat.id);
    setMessages([]);
    localStorage.setItem("publicChats", JSON.stringify(updatedChats));
    localStorage.setItem("currPublicChatId", newChat.id);
  };

  const handleDelete = (id: string) => {
    const updatedChats = chats.filter((c) => c.id !== id);
    setChats(updatedChats);
    if (currChatId === id) {
      setCurrChatId("");
      setMessages([]);
      localStorage.removeItem("currPublicChatId");
    }
    localStorage.setItem("publicChats", JSON.stringify(updatedChats));
  };

  return (
    <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
      <div className="flex justify-between items-center p-4">
        <Menu className="text-gray-400" onClick={() => {}}/>
      </div>
      <div className="px-4 text-sm text-gray-300 mb-2">Today</div>
      {chats.map((chat, index) => (
        <button
          key={`${chat.id}-${index}`}
          className={`bg-[#343769] text-white text-left px-4 py-2 mx-4 rounded-lg hover:bg-[#45488f] ${
            currChatId === chat.id ? "border border-blue-300" : ""
          }`}
          onClick={() => selectChat(chat)}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{chat.title}</span>
            {currChatId === chat.id && (
              <Trash2
                className="text-gray-400"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(chat.id);
                }}
              />
            )}
          </div>
        </button>
      ))}

      <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full p-2 hover:bg-gray-400">
        <Plus className="text-[#1F2251]" onClick={handleNewChat} />
      </button>
    </aside>
  )
}

function PrivateChatSideBar({setMessages, setCurrChatId, currChatId}: {setMessages: Dispatch<SetStateAction<Message[]>>, setCurrChatId: (chatId: string) => void, currChatId: string}) {
    const [chats, setChats] = useState<PrivateChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<PrivateChat | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
      const localUserId = localStorage.getItem('userId');
      if (localUserId) {
        axiosInstance.get(`/api/chat/${localUserId}?isUserID=true`)
        .then((response) => {
          const chatData = response.data.map((chat: any) => ({
            id: chat.id,
            title: chat.title,
          }));
          setChats(chatData);
          setSelectedChat(chatData.find((chat: PrivateChat) => chat.id === currChatId) || null);
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

    async function handleChatChange(currChat: PrivateChat){
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
        };

        try {
            const response = await axiosInstance.post('/api/chat', newChat);
            const createdChat = response.data
            console.log('New chat created:', createdChat);
            setChats([{ id: createdChat.id, title: newChat.title }, ...chats]);
            setSelectedChat({ id: createdChat.id, title: newChat.title });
            setMessages(newChat.messages || []);
            setCurrChatId(createdChat.id);
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }


    return(
        <aside className="w-64 bg-[#1F2251] text-white flex flex-col min-h-screen relative">
        <div className="flex justify-between items-center p-4">
          <Menu className="text-gray-400"/>
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
              <span className="font-medium">{chat.title}</span>
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
  }, [messageList]);

  const handleRetry = () => {
    // TODO
  }

  return (
    <div className="flex flex-col gap-6 py-6 px-1 overflow-y-auto" style={{ height: 'calc(100vh - 200px)'}}>
      {messageList.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-center pt-70">
          <h2 className="text-5xl font-bold text-blue-800 mb-2">Welcome to Gail!</h2>
          <h3 className="text-xl font-medium text-blue-800">
            Your workplace rights & regulations chatbot
          </h3>
        </div>
      ):
      messageList.map((message, index) => (
        <div key={index} className="flex flex-col">
          {message.isFromUser ? (
            <div className="self-end bg-blue-100 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm text-lg">
              <p>{message.content}</p>
            </div>
          ) : (
            <div className="self-start bg-gray-100 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm">
              <div
                className="text-lg"
                dangerouslySetInnerHTML={{
                  __html: markdownListToTable(message.content),
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
        <div className="self-start border border-red-500 bg-red-200 text-gray-800 p-4 rounded-md max-w-[70%] shadow-sm text-lg">
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

      <div ref={bottomRef} />
    </div>
  );
}

function InputMessage({
  inputValue,
  setInputValue,
  isPrivate,
  province,
  chatId,
  setMessages,
  setError,
  setCurrChatId,
  threadId
}: {
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  isPrivate: boolean;
  province?: string | null;
  chatId?: string;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setCurrChatId?: Dispatch<SetStateAction<string>>;
  threadId?: string | null
}) {
  const errorMessage = 'Oops, something went wrong. Want to try again?'
  const province_map: { [key: string]: string } = {
    "ON": "Ontario",
    "AB": "Alberta",
    "BC": "British Columbia",
    "MB": "Manitoba",
    "NB": "New Brunswick",
    "NL": "Newfoundland and Labrador",
    "NS": "Nova Scotia",
    "PE": "Prince Edward Island",
    "QC": "Quebec",
    "SK": "Saskatchewan",
    "NT": "Northwest Territories",
    "NU": "Nunavut",
    "YT": "Yukon"
  }

  const submitUserMessage = async () => {
    if (!inputValue.trim()) return;

    try {
      const userMessage: Omit<Message, 'createdAt'> = {
        isFromUser: true,
        content: inputValue,
      };
      setMessages((prevMessages) => [...prevMessages, userMessage as Message]);
      setInputValue('');
      setError('');

      if (isPrivate) {
        let newChatId = chatId || '';
        if (chatId === '') {
            const newChat = await axiosInstance.post('/api/chat', {
            userId: localStorage.getItem('userId'),
            title: `Chat - ${new Date().toLocaleDateString()}-1`,
            messages: [userMessage]
          });
          if(setCurrChatId) setCurrChatId(newChat.data.id);
          newChatId = newChat.data.id;

        }

        else{
          axiosInstance.put(`/api/chat/${chatId}/add-message`, {
            messageData: userMessage
          });
        }
        await handlePrivateChat(newChatId);
      } else {
        await handlePublicChat();
      }
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    }
  };
  
  function mapCitationsToLinks(citations: Citation[]): Link[] {
    return citations.map(citation => ({
      title: citation.title,
      url: citation.fragmentUrl || citation.originalUrl // Use fragmentUrl if available, fallback to originalUrl
    }));
  }

  const handlePrivateChat = async (new_chatId: string) => {
    const full_province = province ? province_map[province] : '';
    console.log("province", province);
    const res = await axiosInstance.post(`/api/public/message`, {
      province,
      query: inputValue,
      threadId: new_chatId
    });
    if (res.status !== 200) {
      setError(errorMessage);
      return;
    }

    const data = res.data;
    if (data.response) {
      const botMessage = {
        content: data.response,
        isFromUser: false,
        sources: mapCitationsToLinks(data.citations),
      }
      setMessages((prevMessages) => [...prevMessages, botMessage as Message]);
      axiosInstance.put(`/api/chat/${new_chatId}/add-message`, {
        messageData: botMessage,
      });
    }
    else {
      setError(errorMessage);
    }
  };

  const handlePublicChat = async () => {
    if (!province) return;

    try {
      console.log("province", province);
      const res = await fetch('/api/public/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province,
          query: inputValue,
          threadId
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      if (data.response) {
        const botMessage = {
          content: data.response,
          isFromUser: false,
          createdAt: new Date(),
          sources: mapCitationsToLinks(data.citations),
        }
        setMessages((prevMessages) => [...prevMessages, botMessage as Message]);
      } else {
        setError(errorMessage);
      }
    } catch (err) {
      console.error(err);
      setError(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitUserMessage();
    }
  };
  
  return(
      <div className="relative w-full max-w-3xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            className="w-full px-6 py-4 border border-gray-300 rounded-md text-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-14"
          />
          <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={submitUserMessage}
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
  )
}


function Header({ province, setProvince }: { province: string; setProvince: (prov: string) => void }) {
    const { isSignedIn, user } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isSignedIn && user) {
            axiosInstance.get(`/api/users/${user.id}?isClerkID=true`)
            .then(response => {
              localStorage.setItem('userId', response.data[0].id);
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
                <span className="px-4"><ProvinceDropdown province={province} setProvince={setProvince} /></span>
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
  const provinces = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ] as const;  

  return (
    <Listbox value={province} onChange={setProvince}>
      <div className="relative inline-block">
        <Label className="sr-only">
          Change province or territory
        </Label>

        <ListboxButton
          className="w-[290px] px-4 py-2 flex items-center rounded-md bg-white font-semibold border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Change your province/territory
          <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
        </ListboxButton>

        <ListboxOptions
          className="absolute z-10 mt-1 max-h-60 w-[270px] overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black/10"
        >
          {provinces.map((p) => (
            <ListboxOption key={p} value={p} as={Fragment}>
              {({ active, selected }: { active: boolean; selected: boolean }) => (
                <li
                  className={
                    `flex cursor-pointer select-none items-center gap-2 px-4 py-2 text-sm ` +
                    (active ? "bg-blue-100 text-blue-900" : "text-gray-900")
                  }
                >
                  <span className="flex-1">{p}</span>
                  {selected && <Check className="h-4 w-4" />}
                </li>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export {PrivateChatSideBar, PublicChatSideBar, MessageThread, InputMessage, Header};