"use client"

import { useEffect, useState } from "react"
import {
  PrivateChatSideBar,
  MessageThread,
  InputMessage,
  Header,
  Chat,
  Disclaimer,
  PopularQuestions,
} from "../global_components"
import { Message } from "../../models/schema"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function ChatUI() {
  const [messages, setMessages] = useState([] as Message[])
  const [chats, setChats] = useState<Chat[]>([])
  const [error, setError] = useState<{message: string, chatId: string}>({message: '', chatId: ''})
  const [currChatId, setCurrChatId] = useState<string>("")
  const [province, setProvince] = useState<string>("")
  const [inputValue, setInputValue] = useState<string>("")
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [titleLoading, setTitleLoading] = useState(false)
  const [totalChatsLength, setTotalChatsLength] = useState<number>(0)

  const handleRetry = async () => {
    setError("");

    const lastUserMessage = [...messages].reverse().find((msg) => msg.isFromUser === true);
    if (!lastUserMessage) return;

    setMessages((prev) => [...prev, lastUserMessage]);

    try {
      // TODO: Switch to /api/private/message once implemented
      const endpoint = '/api/public/message';
      const res = await fetch(endpoint, {
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
          sources: data.citations?.map((citation: { title: string; fragmentUrl?: string; originalUrl?: string }) => ({
            title: citation.title,
            url: citation.fragmentUrl || citation.originalUrl,
          })),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        setError(GENERIC_ERROR_MESSAGE);
      }
    } catch (err) {
      console.error(err);
      setError(GENERIC_ERROR_MESSAGE);
    }
  };

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      router.push("/")
    }
  }, [isSignedIn])

  return (
    <div className="min-h-screen flex bg-white flex-row">
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
          <MessageThread messageList={messages} error={error} chatId={currChatId} onRetry={handleRetry}/>

          <div
            className="absolute bottom-6 left-0 right-0 mx-10"
          >
            {messages.length === 0 && (
              <PopularQuestions setInputValue={setInputValue} />
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

            <Disclaimer/>
          </div>
        </main>
      </div>
    </div>
  )
}

