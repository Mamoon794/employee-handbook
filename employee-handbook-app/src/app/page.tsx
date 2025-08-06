/* eslint-disable */

"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import {
  MessageThread,
  InputMessage,
  Header,
  PublicChatSideBar,
  Disclaimer,
  PopularQuestions,
  mapCitationsToLinks,
} from "./global_components"
import { useRouter } from "next/navigation"
import axiosInstance from "./axios_config"

import ProvincePopup from "../../components/province"
import { Message } from "@/models/schema"
import { Chat, ERROR_MESSAGE } from "./global_components"

export default function Home() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()

  const [inputValue, setInputValue] = useState<string>("")
  const [chats, setChats] = useState<Chat[]>([])
  const [province, setProvince] = useState<string>("")
  const [messages, setMessages] = useState([] as Message[])
  const [error, setError] = useState<{ message: string; chatId: string }>({
    message: "",
    chatId: "",
  })
  const [currChatId, setCurrChatId] = useState<string>("")
  const [titleLoading, setTitleLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedChats = localStorage.getItem("publicChats")
    if (storedChats) {
      try {
        setChats(JSON.parse(storedChats))
      } catch {
        setChats([])
      }
    }

    const storedChatId = localStorage.getItem("currPublicChatId")
    if (storedChatId) setCurrChatId(storedChatId)

    setHydrated(true);
  }, [])

  useEffect(() => {
    if (hydrated) { // to prevent publicChats from resetting to [] when logging out of a private account
      localStorage.setItem("publicChats", JSON.stringify(chats))
    }
  }, [chats])

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("currPublicChatId", currChatId)
    }
  }, [currChatId])

  useEffect(() => {
    const stored = localStorage.getItem("publicChats")
    if (stored) {
      const parsed = JSON.parse(stored)
      const chat = parsed.find((c: Chat) => c.id === currChatId)
      if (chat) setMessages(chat.messages || [])
    }
  }, [currChatId])

  useEffect(() => {
    if (isSignedIn && user) {
      axiosInstance
        .get(`/api/users/${user.id}?isClerkID=true`)
        .then(async (response) => {
          const userData = response.data[0]
          if (userData) {
            if (userData.userType === "Employee") {
              // Employees get free access to chat
              router.push("/chat")
            } else if (userData.userType === "Owner") {
              // Check subscription status using the API that considers trial period
              try {
                const subscriptionResponse = await axiosInstance.get(
                  "/api/check-subscription"
                )
                const { subscribed } = subscriptionResponse.data

                // Always redirect to dashboard - it will handle showing paywall if needed
                router.push("/dashboard")
              } catch (error) {
                console.error("Error checking subscription:", error)
                router.push("/dashboard")
              }
            } else {
              router.push("/chat")
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching user data for redirect:", error)
          router.push("/chat")
        })
    }
  }, [isSignedIn, user, router])

  useEffect(() => {
    const prov = localStorage.getItem("publicProvince")
    if (prov && !isSignedIn) setProvince(prov)
  }, [])

  useEffect(() => {
    if (province && !isSignedIn)
      localStorage.setItem("publicProvince", province)
    console.log(province)
  }, [province])

  useEffect(() => {
    sessionStorage.setItem("messages", JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    console.log(province)
  }, [])

  const handleRetry = async () => {
    setError({ message: "", chatId: "" })

    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.isFromUser === true)
    if (!lastUserMessage) return

    setMessages((prev) => [...prev, lastUserMessage])

    try {
      const res = await fetch("/api/messages/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          province,
          query: lastUserMessage.content,
          threadId: currChatId,
        }),
      })

      if (!res.ok) throw new Error("Network response was not ok")

      const data = await res.json()
      if (data.publicResponse) {
        const botMessage = {
          isFromUser: false,
          createdAt: new Date(),
          publicResponse: data.publicResponse,
          publicSources: data.publicSources
            ? mapCitationsToLinks(data.publicSources)
            : [],
        }
        setMessages((prevMessages) => {
          const updated = [...prevMessages, botMessage as Message]
          setChats((prevChats) => {
            return prevChats.map((c) =>
              c.id === currChatId ? { ...c, messages: updated } : c
            )
          })
          return updated
        })
      } else {
        setError({ message: ERROR_MESSAGE, chatId: currChatId })
      }
    } catch (err) {
      console.error(err)
      setError({ message: ERROR_MESSAGE, chatId: currChatId })
    }
  }

  return (
    <div className="min-h-screen flex bg-white flex-row">
      <PublicChatSideBar
        setCurrChatId={setCurrChatId}
        currChatId={currChatId}
        setMessages={setMessages}
        chats={chats}
        setChats={setChats}
        titleLoading={titleLoading}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header province={province} setProvince={setProvince} />

        <main className="flex-1 flex flex-col justify-between px-4 sm:px-6 pb-6 relative z-0">
          {!isSignedIn && !province && (
            <ProvincePopup onSave={(prov) => setProvince(prov)} />
          )}

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

            <InputMessage
              inputValue={inputValue}
              setInputValue={setInputValue}
              isPrivate={false}
              setError={setError}
              setMessages={setMessages}
              province={province}
              chats={chats}
              setTitleLoading={setTitleLoading}
              setChats={setChats}
              chatId={currChatId}
              setCurrChatId={setCurrChatId}
            />

            <Disclaimer />
          </div>
        </main>
      </div>
    </div>
  )
}
