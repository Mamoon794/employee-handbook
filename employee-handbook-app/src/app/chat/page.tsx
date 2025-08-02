'use client';

import { useEffect, useState, Suspense } from 'react';
import {
  PrivateChatSideBar,
  MessageThread,
  InputMessage,
  Header,
  Chat,
  Disclaimer,
  PopularQuestions,
  ERROR_MESSAGE,
  provinceMap
} from '../global_components';
import { Message } from '../../models/schema';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse text-blue-800 text-lg">Loading chat interface...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<{ message: string; chatId: string }>({
    message: "",
    chatId: "",
  });
  const [currChatId, setCurrChatId] = useState("");
  const [province, setProvince] = useState("");
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [titleLoading, setTitleLoading] = useState(false);
  const [totalChatsLength, setTotalChatsLength] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCompany, setWelcomeCompany] = useState("");

  const handleRetry = async () => {
    setError({ message: "", chatId: "" });

    const lastUserMessage = [...messages].reverse().find((msg) => msg.isFromUser === true);
    if (!lastUserMessage) return;

    setMessages((prev) => [...prev, lastUserMessage]);

    try {
      const endpoint = "/api/messages/private";
      const currProvince =  province;
      const sendBody = {
        province: currProvince,
        query: lastUserMessage.content,
        threadId: currChatId,
        company: localStorage.getItem("companyName") || "",
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendBody),
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      if (data.response) {
        const botMessage: Message = {
          content: data.response,
          isFromUser: false,
          createdAt: new Date(),
          sources: data.citations?.map((citation: { title: string; fragmentUrl?: string; originalUrl?: string }) => ({
            title: citation.title,
            url: citation.fragmentUrl || citation.originalUrl || "",
          })),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        setError({ message: ERROR_MESSAGE, chatId: currChatId });
      }
    } catch (err) {
      console.error(err);
      setError({ message: ERROR_MESSAGE, chatId: currChatId });
    }
  };

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const welcomeParam = params.get("welcome");
    const companyParam = params.get("company");
    
    if (welcomeParam === "true" && companyParam) {
      setShowWelcome(true);
      setWelcomeCompany(decodeURIComponent(companyParam));

      const triggerConfetti = () => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#242267", "#294494", "#3a7bd5"],
        });
      };

      setTimeout(triggerConfetti, 100);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-white flex-row">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8 w-[95%] max-w-md text-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Welcome to {welcomeCompany}!
            </h2>
            <p className="text-gray-600 mb-6">
              You can now ask questions specific to your company&apos;s policies.
            </p>
            <button 
              onClick={() => setShowWelcome(false)}
              className="bg-blue-800 text-white font-semibold px-6 py-3 rounded-md hover:bg-blue-700 transition-colors mx-auto shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Sidebar (History) */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <Header province={province} setProvince={setProvince} />

        {/* Chat Area */}
        <main className="flex-1 flex flex-col justify-between px-6 pb-6 relative">
          {/* Message Thread */}
          <MessageThread
            messageList={messages}
            error={error}
            chatId={currChatId}
            onRetry={handleRetry}
          />

          <div className="absolute bottom-6 left-0 right-0 mx-10">
            {messages.length === 0 && (
              <PopularQuestions
                setInputValue={setInputValue}
                province={province}
                messages={messages}
                chatId={currChatId}
              />
            )}

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

            <Disclaimer />
          </div>
        </main>
      </div>
    </div>
  );
}